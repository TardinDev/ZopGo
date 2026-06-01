// Edge Function: payments-initiate
//
// Two modes, selected by the PAYMENTS_MODE env var:
//
//   • 'test'  (DEFAULT) — guaranteed-succeed simulation. Unchanged from the
//     original test-phase behaviour: writes a payments row with
//     status='succeeded', sends the receipt, returns 'succeeded'. This keeps
//     the booking flow working end-to-end while real providers are wired.
//
//   • 'live'  — real provider routing. Resolves the payer from the Clerk JWT
//     (NOT the request body), routes by method to Singpay (mobile money) or
//     PayPal, writes status='processing', and returns 'processing' (+ a
//     redirectUrl for PayPal). The payment is settled asynchronously by the
//     `payments-webhook` Function when the provider calls back. The receipt
//     is sent by the webhook on success (not here).
//
// ⚠️ The 'live' path has NOT been exercised end-to-end (no provider
// credentials yet). The Singpay adapter is a documented stub — its real API
// contract must be filled in (see _singpayInitiate). PayPal follows the
// documented Orders v2 API but needs a sandbox e2e pass before go-live.
// Clerk JWT *signature* verification is still a TODO (see resolvePayer).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Env ────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'ZopGo <onboarding@resend.dev>';

// 'test' (default) | 'live'. Anything other than 'live' keeps the simulation.
const PAYMENTS_MODE = (Deno.env.get('PAYMENTS_MODE') ?? 'test').toLowerCase();
const IS_LIVE = PAYMENTS_MODE === 'live';

// PayPal (Orders v2). Base defaults to sandbox.
const PAYPAL_BASE = Deno.env.get('PAYPAL_BASE') ?? 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET');
// Deep link the PayPal approval returns to (handled by the mobile app).
const APP_RETURN_URL = Deno.env.get('APP_RETURN_URL') ?? 'zopgo://payments/return';

// Singpay (mobile money aggregator). Contract TBD — see _singpayInitiate.
const SINGPAY_API_URL = Deno.env.get('SINGPAY_API_URL');
const SINGPAY_API_KEY = Deno.env.get('SINGPAY_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── CORS / response helpers ───────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ─── Receipt builders (inline mirror of src/lib/paymentReceipt.ts) ──

type PaymentMethod = 'airtel_money' | 'moov_money' | 'paypal';

const METHOD_LABEL: Record<string, string> = {
  airtel_money: 'Airtel Money',
  moov_money: 'Moov Money',
  paypal: 'PayPal',
};
const RELATED_LABEL: Record<string, string> = {
  trajet_reservation: 'Réservation de trajet',
  hebergement_reservation: "Réservation d'hébergement",
  livraison: 'Livraison',
};

function formatAmount(value: number, currency: string): string {
  const digits = value
    .toLocaleString('fr-FR')
    .replace(/[  ]/g, ' ')
    .replace(/,/g, ' ');
  if (currency === 'XAF') return `${digits} Fcfa`;
  if (currency === 'USD') return `$${digits}`;
  if (currency === 'EUR') return `${digits} €`;
  return `${digits} ${currency}`;
}

function formatDateFr(): string {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()} à ${h}h${m}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildReceipt(args: {
  payerName: string;
  amount: number;
  currency: string;
  method: string;
  relatedType: string;
  providerRef: string;
}) {
  const amountFmt = formatAmount(args.amount, args.currency);
  const methodLabel = METHOD_LABEL[args.method] ?? args.method;
  const objetLabel = RELATED_LABEL[args.relatedType] ?? args.relatedType;
  const date = formatDateFr();
  const subject = `Reçu ZopGo · ${amountFmt}`;
  const text = [
    `Bonjour ${args.payerName || 'cher client'},`,
    '',
    'Ton paiement a bien été reçu. Voici le récapitulatif :',
    '',
    `  • Montant       : ${amountFmt}`,
    `  • Méthode       : ${methodLabel}`,
    `  • Objet         : ${objetLabel}`,
    `  • Date          : ${date}`,
    `  • Référence     : ${args.providerRef}`,
    '',
    'Conserve ce reçu, il fait office de preuve de paiement.',
    '',
    'Merci de faire confiance à ZopGo.',
    "— L'équipe ZopGo",
  ].join('\n');
  const html = `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:24px;background:#F4F5F7;font-family:-apple-system,sans-serif;color:#0F172A;">
<div style="max-width:560px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,0.08);">
<div style="background:#2162FE;padding:18px 24px;display:flex;justify-content:space-between;">
<span style="color:white;font-weight:800;letter-spacing:1.6px;font-size:13px;">ZOPGO PASS</span>
<span style="color:rgba(255,255,255,0.92);font-weight:700;letter-spacing:1.2px;font-size:11px;text-transform:uppercase;">REÇU DE PAIEMENT</span>
</div><div style="padding:24px;">
<p style="margin:0 0 12px 0;font-size:15px;">Bonjour ${escapeHtml(args.payerName || 'cher client')},</p>
<p style="margin:0 0 18px 0;font-size:14px;color:#4B5563;">Ton paiement a bien été reçu :</p>
<div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:18px;">${escapeHtml(amountFmt)}</div>
<table style="width:100%;font-size:13px;">
<tr><td style="padding:6px 0;color:#6B7280;">Méthode</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(methodLabel)}</td></tr>
<tr><td style="padding:6px 0;color:#6B7280;">Objet</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(objetLabel)}</td></tr>
<tr><td style="padding:6px 0;color:#6B7280;">Date</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(date)}</td></tr>
<tr><td style="padding:6px 0;color:#6B7280;">Référence</td><td style="padding:6px 0;font-weight:600;font-family:monospace;">${escapeHtml(args.providerRef)}</td></tr>
</table>
<p style="margin:24px 0 0 0;font-size:12px;color:#9CA3AF;">Conserve ce reçu, il fait office de preuve de paiement. Merci de faire confiance à ZopGo.</p>
</div></div></body></html>`;
  return { subject, text, html };
}

async function sendEmail(to: string, subject: string, html: string, text: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log('[receipt-stub] to=' + to);
    console.log('[receipt-stub] subject=' + subject);
    console.log('[receipt-stub] text=\n' + text);
    return true;
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, html, text }),
    });
    if (!r.ok) {
      console.error('[receipt-resend] HTTP ' + r.status, await r.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('[receipt-resend] exception', e);
    return false;
  }
}

// ─── Payer resolution ──────────────────────────────────────────────

type Payer = { id: string; name: string; email: string };

async function profileById(id: string): Promise<Payer | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('id', id)
    .maybeSingle();
  return (data as Payer) ?? null;
}

async function profileByClerkId(clerkId: string): Promise<Payer | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('clerk_id', clerkId)
    .maybeSingle();
  return (data as Payer) ?? null;
}

/** Extract the Clerk `sub` claim from the Bearer token (decode only). */
function clerkSubFromRequest(req: Request): string | null {
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    const parts = auth.slice(7).split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolves the paying profile.
 *   • live: from the Clerk JWT ONLY (the body is not trusted).
 *     TODO(security): verify the JWT signature against Clerk's JWKS before
 *     go-live — we currently only decode the claim.
 *   • test: keep the lenient behaviour (body.payerProfileId, then JWT).
 */
async function resolvePayer(body: Record<string, unknown>, req: Request): Promise<Payer | null> {
  if (IS_LIVE) {
    const sub = clerkSubFromRequest(req);
    return sub ? await profileByClerkId(sub) : null;
  }
  const fromBody = body.payerProfileId;
  if (typeof fromBody === 'string' && fromBody.length > 0) {
    const p = await profileById(fromBody).catch(() => null);
    if (p) return p;
  }
  const sub = clerkSubFromRequest(req);
  return sub ? await profileByClerkId(sub).catch(() => null) : null;
}

// ─── Provider adapters (live mode) ─────────────────────────────────

type InitiateResult = {
  providerRef: string;
  redirectUrl: string | null;
  raw: unknown;
};

/** PayPal Orders v2: create an order and return its approval link. */
async function paypalInitiate(amount: number, currency: string): Promise<InitiateResult> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error('PayPal non configuré (PAYPAL_CLIENT_ID / PAYPAL_SECRET manquants).');
  }
  // PayPal does NOT support XAF as a presentment currency. The caller must
  // send USD/EUR for PayPal (conversion is a business decision, out of scope).
  if (currency === 'XAF') {
    throw new Error('PayPal nécessite une devise USD ou EUR (XAF non supporté).');
  }
  // OAuth2 client-credentials token.
  const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokenRes.ok) {
    throw new Error(`PayPal token HTTP ${tokenRes.status}: ${await tokenRes.text()}`);
  }
  const { access_token } = await tokenRes.json();

  // Create the order. Amount is a 2-decimal string for USD/EUR.
  const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount.toFixed(2) } }],
      application_context: {
        brand_name: 'ZopGo',
        user_action: 'PAY_NOW',
        return_url: APP_RETURN_URL,
        cancel_url: APP_RETURN_URL,
      },
    }),
  });
  if (!orderRes.ok) {
    throw new Error(`PayPal order HTTP ${orderRes.status}: ${await orderRes.text()}`);
  }
  const order = await orderRes.json();
  const approval =
    (order.links as { rel: string; href: string }[] | undefined)?.find(
      (l) => l.rel === 'approve' || l.rel === 'payer-action'
    )?.href ?? null;
  return { providerRef: order.id as string, redirectUrl: approval, raw: order };
}

/**
 * Singpay (Airtel/Moov Money) — STUB. The real API contract (endpoint,
 * payload, auth header, signature, status callback) is NOT public to us
 * yet. Fill this in once the Singpay merchant docs + sandbox credentials
 * are available. Until then, calling it in live mode throws clearly rather
 * than fabricating a fake success.
 *
 * Expected shape (to confirm against Singpay docs):
 *   POST {SINGPAY_API_URL}/<initiate-endpoint>
 *   headers: { Authorization: Bearer {SINGPAY_API_KEY}, ... }
 *   body: { amount, currency, msisdn: payerPhone, operator: 'airtel'|'moov',
 *           reference: idempotencyKey, callback_url: <payments-webhook> }
 *   → { transaction_id, status: 'pending' } + async webhook on completion.
 */
// deno-lint-ignore no-unused-vars
async function singpayInitiate(
  amount: number,
  currency: string,
  operator: 'airtel' | 'moov',
  payerPhone: string | null,
  idempotencyKey: string,
): Promise<InitiateResult> {
  if (!SINGPAY_API_URL || !SINGPAY_API_KEY) {
    throw new Error('Singpay non configuré (SINGPAY_API_URL / SINGPAY_API_KEY manquants).');
  }
  throw new Error(
    'Adaptateur Singpay non implémenté — renseigner le contrat d’API Singpay ' +
      'dans singpayInitiate() (endpoint, payload, signature, webhook).'
  );
}

// ─── Main handler ──────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // Empty body tolerated in test mode.
  }

  const amount = typeof body.amount === 'number' ? body.amount : 0;
  const currency = typeof body.currency === 'string' ? body.currency : 'XAF';
  const method = (typeof body.method === 'string' ? body.method : 'airtel_money') as PaymentMethod;
  const relatedType =
    typeof body.relatedType === 'string' ? body.relatedType : 'trajet_reservation';
  const relatedId = typeof body.relatedId === 'string' ? body.relatedId : 'unknown';
  const idempotencyKey =
    typeof body.idempotencyKey === 'string' && body.idempotencyKey.length > 0
      ? body.idempotencyKey
      : crypto.randomUUID();
  const payerPhone = typeof body.payerPhone === 'string' ? body.payerPhone : null;

  const payer = await resolvePayer(body, req);

  // ════════════════════════════════════════════════════════════════
  // LIVE MODE — real provider routing, async settlement via webhook.
  // ════════════════════════════════════════════════════════════════
  if (IS_LIVE) {
    if (!payer) {
      return json({ error: 'Authentification requise.' }, 401);
    }
    if (amount <= 0) {
      return json({ error: 'Montant invalide.' }, 400);
    }

    // Idempotency: return the existing payment if the client retries.
    const { data: existing } = await supabase
      .from('payments')
      .select('id, status, provider_ref')
      .eq('profile_id', payer.id)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    if (existing) {
      return json({
        paymentId: existing.id,
        status: existing.status,
        providerRef: existing.provider_ref ?? null,
        message: 'Paiement déjà initié.',
      });
    }

    let result: InitiateResult;
    try {
      if (method === 'paypal') {
        result = await paypalInitiate(amount, currency);
      } else if (method === 'airtel_money' || method === 'moov_money') {
        result = await singpayInitiate(
          amount,
          currency,
          method === 'airtel_money' ? 'airtel' : 'moov',
          payerPhone,
          idempotencyKey,
        );
      } else {
        return json({ error: `Méthode non supportée: ${method}` }, 400);
      }
    } catch (e) {
      console.error('[payments-initiate] provider error', e);
      return json({ error: e instanceof Error ? e.message : 'Échec provider.' }, 502);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('payments')
      .insert({
        profile_id: payer.id,
        amount,
        currency,
        method,
        idempotency_key: idempotencyKey,
        related_type: relatedType,
        related_id: relatedId,
        payer_phone: payerPhone,
        status: 'processing',
        provider_ref: result.providerRef,
        provider_payload: result.raw ?? {},
        receipt_email: payer.email ?? null,
      })
      .select('id')
      .single();
    if (insertErr || !inserted) {
      console.error('[payments-initiate] insert failed', insertErr?.message);
      return json({ error: 'Impossible d’enregistrer le paiement.' }, 500);
    }

    return json({
      paymentId: inserted.id,
      status: 'processing',
      providerRef: result.providerRef,
      redirectUrl: result.redirectUrl,
      receiptEmail: payer.email ?? null,
      message:
        method === 'paypal'
          ? 'Finalise le paiement dans la fenêtre PayPal.'
          : 'Confirme le paiement sur ton téléphone.',
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TEST MODE (default) — unchanged simulation: auto-success + receipt.
  // ════════════════════════════════════════════════════════════════
  const providerRef = 'sim-' + crypto.randomUUID().slice(0, 12);
  console.log('[payments-initiate] TEST', {
    amount, currency, method, relatedType, relatedId, payerResolved: !!payer,
  });

  let paymentId: string | null = null;
  if (payer) {
    try {
      const { data: existing } = await supabase
        .from('payments')
        .select('id, status')
        .eq('profile_id', payer.id)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();
      if (existing) {
        paymentId = existing.id as string;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('payments')
          .insert({
            profile_id: payer.id,
            amount,
            currency,
            method,
            idempotency_key: idempotencyKey,
            related_type: relatedType,
            related_id: relatedId,
            payer_phone: payerPhone,
            status: 'succeeded',
            provider_ref: providerRef,
            receipt_email: payer.email ?? null,
            receipt_sent_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        if (insertErr) {
          console.error('[payments-initiate] insert failed', insertErr.message);
        } else if (inserted) {
          paymentId = inserted.id as string;
        }
      }
    } catch (e) {
      console.error('[payments-initiate] db write threw', e);
    }
  }

  if (payer?.email) {
    const receipt = buildReceipt({
      payerName: payer.name || '',
      amount,
      currency,
      method,
      relatedType,
      providerRef,
    });
    void sendEmail(payer.email, receipt.subject, receipt.html, receipt.text);
  }

  return json({
    paymentId: paymentId ?? `sim-${crypto.randomUUID()}`,
    status: 'succeeded',
    providerRef,
    receiptEmail: payer?.email ?? null,
    message: payer?.email ? `Reçu envoyé à ${payer.email}` : 'Paiement simulé (mode test)',
  });
});
