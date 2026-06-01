// Edge Function: payments-webhook
//
// Receives asynchronous payment confirmations from the providers and settles
// the matching `payments` row. The provider-agnostic state machine (find by
// provider_ref → idempotent terminal guard → update status + provider_payload
// → receipt on success) is real and is the valuable part. The provider
// PARSING + SIGNATURE VERIFICATION are provider-specific:
//
//   • PayPal — verify via PayPal's verify-webhook-signature API (needs
//     PAYPAL_WEBHOOK_ID); handle PAYMENT.CAPTURE.COMPLETED / .DENIED and
//     CHECKOUT.ORDER.APPROVED (capture then settle).
//   • Singpay — STUB: HMAC verification + status mapping must be filled in
//     from the Singpay merchant docs.
//
// ⚠️ NOT exercised end-to-end (no provider credentials yet). Route this
// function's public URL into each provider's webhook/callback config.
//
// Endpoints:
//   POST .../payments-webhook?provider=paypal
//   POST .../payments-webhook?provider=singpay

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'ZopGo <onboarding@resend.dev>';

const PAYPAL_BASE = Deno.env.get('PAYPAL_BASE') ?? 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET');
const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID');

// const SINGPAY_WEBHOOK_SECRET = Deno.env.get('SINGPAY_WEBHOOK_SECRET'); // TODO

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type TerminalStatus = 'succeeded' | 'failed';

/**
 * Provider-agnostic settlement. Finds the payment by provider_ref, ignores
 * the call if it's already terminal (webhook retries / double-fire), then
 * updates the status + captures the raw payload. Realtime fires the UPDATE
 * to the mobile PaymentStatusModal automatically. Sends the receipt on
 * success (best-effort).
 */
async function settlePayment(
  providerRef: string,
  status: TerminalStatus,
  rawPayload: unknown,
): Promise<{ ok: boolean; reason?: string }> {
  const { data: payment, error } = await supabase
    .from('payments')
    .select('id, status, amount, currency, method, related_type, receipt_email, receipt_sent_at')
    .eq('provider_ref', providerRef)
    .maybeSingle();

  if (error || !payment) {
    return { ok: false, reason: 'payment_not_found' };
  }
  // Idempotency: never move out of a terminal state.
  if (['succeeded', 'failed', 'refunded', 'cancelled'].includes(payment.status)) {
    return { ok: true, reason: 'already_terminal' };
  }

  const { error: updErr } = await supabase
    .from('payments')
    .update({ status, provider_payload: rawPayload ?? {} })
    .eq('id', payment.id);
  if (updErr) {
    return { ok: false, reason: updErr.message };
  }

  // Receipt on success (best-effort, once).
  if (status === 'succeeded' && payment.receipt_email && !payment.receipt_sent_at) {
    void sendReceipt(payment).catch((e) => console.error('[webhook] receipt', e));
  }
  return { ok: true };
}

async function sendReceipt(payment: {
  id: string;
  amount: number;
  currency: string;
  method: string;
  related_type: string;
  receipt_email: string | null;
}): Promise<void> {
  if (!payment.receipt_email) return;
  const amountFmt = `${payment.amount.toLocaleString('fr-FR')} ${payment.currency}`;
  const subject = `Reçu ZopGo · ${amountFmt}`;
  const text = `Ton paiement de ${amountFmt} (${payment.method}) a bien été reçu. Merci de faire confiance à ZopGo.`;
  if (RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: RESEND_FROM, to: [payment.receipt_email], subject, text }),
    });
  } else {
    console.log('[webhook receipt-stub]', payment.receipt_email, subject);
  }
  await supabase
    .from('payments')
    .update({ receipt_sent_at: new Date().toISOString() })
    .eq('id', payment.id);
}

// ─── PayPal ─────────────────────────────────────────────────────────

async function paypalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal token HTTP ${res.status}`);
  return (await res.json()).access_token;
}

/** Verify the webhook signature with PayPal's verify-webhook-signature API. */
async function paypalVerify(req: Request, rawBody: string): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID || !PAYPAL_CLIENT_ID || !PAYPAL_SECRET) return false;
  const token = await paypalAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: req.headers.get('paypal-auth-algo'),
      cert_url: req.headers.get('paypal-cert-url'),
      transmission_id: req.headers.get('paypal-transmission-id'),
      transmission_sig: req.headers.get('paypal-transmission-sig'),
      transmission_time: req.headers.get('paypal-transmission-time'),
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  if (!res.ok) return false;
  return (await res.json()).verification_status === 'SUCCESS';
}

/** Captures an approved order so the funds actually move. */
async function paypalCapture(orderId: string): Promise<boolean> {
  const token = await paypalAccessToken();
  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return res.ok;
}

async function handlePayPal(req: Request, rawBody: string): Promise<Response> {
  if (!(await paypalVerify(req, rawBody))) {
    return json({ error: 'invalid signature' }, 401);
  }
  const event = JSON.parse(rawBody);
  const type = event.event_type as string;
  const resource = event.resource ?? {};
  // Order id: present directly on order events, or in related_ids on capture events.
  const orderId: string | undefined =
    resource.id ?? resource?.supplementary_data?.related_ids?.order_id;

  if (!orderId) return json({ ok: true, ignored: 'no order id' });

  if (type === 'CHECKOUT.ORDER.APPROVED') {
    // Capture, then settle on the resulting CAPTURE.COMPLETED webhook.
    await paypalCapture(orderId).catch((e) => console.error('[paypal] capture', e));
    return json({ ok: true });
  }
  if (type === 'PAYMENT.CAPTURE.COMPLETED') {
    await settlePayment(orderId, 'succeeded', event);
    return json({ ok: true });
  }
  if (type === 'PAYMENT.CAPTURE.DENIED' || type === 'PAYMENT.CAPTURE.DECLINED') {
    await settlePayment(orderId, 'failed', event);
    return json({ ok: true });
  }
  return json({ ok: true, ignored: type });
}

// ─── Singpay (STUB) ─────────────────────────────────────────────────

// deno-lint-ignore no-unused-vars
async function handleSingpay(req: Request, rawBody: string): Promise<Response> {
  // TODO(singpay): verify the HMAC signature with SINGPAY_WEBHOOK_SECRET,
  // parse { transaction_id, status }, map status → 'succeeded'|'failed',
  // then call settlePayment(transaction_id, mappedStatus, payload).
  console.warn('[payments-webhook] Singpay handler not implemented yet');
  return json({ error: 'singpay webhook not implemented' }, 501);
}

// ─── Router ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  const provider = new URL(req.url).searchParams.get('provider');
  const rawBody = await req.text();
  try {
    if (provider === 'paypal') return await handlePayPal(req, rawBody);
    if (provider === 'singpay') return await handleSingpay(req, rawBody);
    return json({ error: 'unknown provider' }, 400);
  } catch (e) {
    console.error('[payments-webhook] error', e);
    return json({ error: e instanceof Error ? e.message : 'webhook error' }, 500);
  }
});
