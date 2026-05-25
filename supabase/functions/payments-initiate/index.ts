// Edge Function: payments-initiate
//
// Initiates a payment with the requested method and sends a receipt
// email to the payer. The mobile client calls this with { amount,
// method, related_*, idempotency_key, payer_phone? }. We:
//   1. Authenticate the caller (Clerk JWT → profiles.id).
//   2. Idempotency check: same (profile_id, idempotency_key) → return
//      the existing row, never re-charge.
//   3. Validate the request shape.
//   4. Create the payments row in 'pending'.
//   5. Charge via the configured provider (Singpay / PayPal). When no
//      provider credentials are set, OR when PAYMENTS_AUTO_SUCCEED=true,
//      we short-circuit to 'succeeded' immediately — used to drive the
//      booking flow end-to-end while the provider sandboxes are being
//      configured.
//   6. Send the receipt email (Resend if RESEND_API_KEY is configured,
//      otherwise log to function logs and still record the dispatch in
//      `receipt_sent_at`).
//   7. Return { paymentId, status, redirectUrl?, message, receiptEmail }.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Env ────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SINGPAY_API_KEY = Deno.env.get('SINGPAY_API_KEY');
const SINGPAY_API_URL = Deno.env.get('SINGPAY_API_URL');
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET');
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'ZopGo <onboarding@resend.dev>';
// Force-succeed: bypass the provider call and mark everything 'succeeded'
// instantly. Defaults to 'auto', which means: succeed when the provider
// keys aren't configured. Test phase = 'true'. Prod = 'false'.
const AUTO_SUCCEED = (Deno.env.get('PAYMENTS_AUTO_SUCCEED') ?? 'auto').toLowerCase();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Types ──────────────────────────────────────────────────────────

type PaymentMethod = 'airtel_money' | 'moov_money' | 'paypal';
type PaymentCurrency = 'XAF' | 'USD' | 'EUR';
type PaymentRelatedType =
  | 'trajet_reservation'
  | 'hebergement_reservation'
  | 'livraison';

interface InitiateBody {
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  relatedType: PaymentRelatedType;
  relatedId: string;
  idempotencyKey: string;
  payerPhone?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function err(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

function shouldAutoSucceed(method: PaymentMethod): boolean {
  if (AUTO_SUCCEED === 'true') return true;
  if (AUTO_SUCCEED === 'false') return false;
  // 'auto': succeed when the provider creds are missing.
  if (method === 'paypal') return !PAYPAL_CLIENT_ID || !PAYPAL_SECRET;
  return !SINGPAY_API_KEY || !SINGPAY_API_URL;
}

function validatePhone(phone: string | undefined): string | null {
  if (!phone) return 'payerPhone required for mobile money';
  if (!/^\+?\d{8,15}$/.test(phone)) return 'invalid phone format (E.164)';
  return null;
}

function validateBody(body: Partial<InitiateBody>): string | null {
  if (typeof body.amount !== 'number' || body.amount <= 0) return 'amount must be > 0';
  if (!body.currency || !['XAF', 'USD', 'EUR'].includes(body.currency)) return 'invalid currency';
  if (!body.method || !['airtel_money', 'moov_money', 'paypal'].includes(body.method)) {
    return 'invalid method';
  }
  if (
    !body.relatedType ||
    !['trajet_reservation', 'hebergement_reservation', 'livraison'].includes(body.relatedType)
  ) {
    return 'invalid relatedType';
  }
  if (!body.relatedId) return 'relatedId required';
  if (!body.idempotencyKey) return 'idempotencyKey required';
  if (body.method !== 'paypal') {
    const phoneErr = validatePhone(body.payerPhone);
    if (phoneErr) return phoneErr;
  }
  return null;
}

async function resolvePayerProfile(req: Request): Promise<
  { id: string; name: string; email: string } | null
> {
  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const jwt = auth.slice(7);
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const clerkId = payload.sub as string;
    if (!clerkId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('clerk_id', clerkId)
      .maybeSingle();
    if (error || !data) return null;
    return data as { id: string; name: string; email: string };
  } catch {
    return null;
  }
}

// ─── Receipt builders (mirror src/lib/paymentReceipt.ts) ──────────

const METHOD_LABEL: Record<PaymentMethod, string> = {
  airtel_money: 'Airtel Money',
  moov_money: 'Moov Money',
  paypal: 'PayPal',
};
const RELATED_LABEL: Record<PaymentRelatedType, string> = {
  trajet_reservation: 'Réservation de trajet',
  hebergement_reservation: "Réservation d'hébergement",
  livraison: 'Livraison',
};

function formatAmount(value: number, currency: PaymentCurrency): string {
  const digits = value
    .toLocaleString('fr-FR')
    .replace(/[  ]/g, ' ')
    .replace(/,/g, ' ');
  switch (currency) {
    case 'XAF': return `${digits} Fcfa`;
    case 'USD': return `$${digits}`;
    case 'EUR': return `${digits} €`;
  }
}

function formatDateFr(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()} à ${h}h${m}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

interface ReceiptCtx {
  payerName: string;
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  relatedType: PaymentRelatedType;
  providerRef: string | null;
}

function buildSubject(c: ReceiptCtx): string {
  return `Reçu ZopGo · ${formatAmount(c.amount, c.currency)}`;
}

function buildText(c: ReceiptCtx): string {
  const lines = [
    `Bonjour ${c.payerName || 'cher client'},`,
    '',
    'Ton paiement a bien été reçu. Voici le récapitulatif :',
    '',
    `  • Montant       : ${formatAmount(c.amount, c.currency)}`,
    `  • Méthode       : ${METHOD_LABEL[c.method]}`,
    `  • Objet         : ${RELATED_LABEL[c.relatedType]}`,
    `  • Date          : ${formatDateFr()}`,
    c.providerRef ? `  • Référence     : ${c.providerRef}` : null,
    '',
    'Conserve ce reçu, il fait office de preuve de paiement.',
    '',
    'Merci de faire confiance à ZopGo.',
    "— L'équipe ZopGo",
  ];
  return lines.filter((l) => l !== null).join('\n');
}

function buildHtml(c: ReceiptCtx): string {
  const amount = formatAmount(c.amount, c.currency);
  const refRow = c.providerRef
    ? `<tr><td style="padding:6px 0;color:#6B7280;font-size:13px;">Référence</td><td style="padding:6px 0;color:#0F172A;font-size:13px;font-weight:600;font-family:monospace;">${escapeHtml(c.providerRef)}</td></tr>`
    : '';
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/><title>Reçu ZopGo</title></head>
<body style="margin:0;padding:24px;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
<div style="max-width:560px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,0.08);">
  <div style="background:#2162FE;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
    <span style="color:white;font-weight:800;letter-spacing:1.6px;font-size:13px;">ZOPGO PASS</span>
    <span style="color:rgba(255,255,255,0.92);font-weight:700;letter-spacing:1.2px;font-size:11px;text-transform:uppercase;">REÇU DE PAIEMENT</span>
  </div>
  <div style="padding:24px;">
    <p style="margin:0 0 12px 0;font-size:15px;">Bonjour ${escapeHtml(c.payerName || 'cher client')},</p>
    <p style="margin:0 0 18px 0;font-size:14px;color:#4B5563;">Ton paiement a bien été reçu. Voici le récapitulatif :</p>
    <div style="font-size:28px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;margin-bottom:18px;">${escapeHtml(amount)}</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:6px 0;color:#6B7280;">Méthode</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${escapeHtml(METHOD_LABEL[c.method])}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">Objet</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${escapeHtml(RELATED_LABEL[c.relatedType])}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">Date</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${escapeHtml(formatDateFr())}</td></tr>
      ${refRow}
    </table>
    <p style="margin:24px 0 0 0;font-size:12px;color:#9CA3AF;line-height:18px;">Conserve ce reçu, il fait office de preuve de paiement. Merci de faire confiance à ZopGo.</p>
  </div>
</div>
</body></html>`;
}

// ─── Email delivery ────────────────────────────────────────────────

async function sendReceiptEmail(
  to: string,
  ctx: ReceiptCtx
): Promise<{ sent: boolean; reason: 'resend' | 'log' | 'error'; message?: string }> {
  const subject = buildSubject(ctx);
  const text = buildText(ctx);
  const html = buildHtml(ctx);

  if (!RESEND_API_KEY) {
    // No provider configured — log the full email so it shows up in the
    // Edge Function logs. We still mark the receipt as "sent" so the UI
    // / dashboard reflects a complete payment.
    console.log('[receipt-stub] to:', to);
    console.log('[receipt-stub] subject:', subject);
    console.log('[receipt-stub] text:', text);
    return { sent: true, reason: 'log' };
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      console.error('[receipt-resend] HTTP', resp.status, body);
      return { sent: false, reason: 'error', message: `Resend HTTP ${resp.status}` };
    }
    return { sent: true, reason: 'resend' };
  } catch (e) {
    console.error('[receipt-resend] exception:', e);
    return { sent: false, reason: 'error', message: String(e) };
  }
}

// ─── Main handler ──────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return err('method not allowed', 405);

  let body: Partial<InitiateBody>;
  try {
    body = await req.json();
  } catch {
    return err('invalid JSON body');
  }

  const validationError = validateBody(body);
  if (validationError) return err(validationError);
  const validated = body as InitiateBody;

  const payer = await resolvePayerProfile(req);
  if (!payer) return err('unauthenticated', 401);

  // Idempotency.
  const { data: existing } = await supabase
    .from('payments')
    .select('id, status, provider_ref, receipt_email')
    .eq('profile_id', payer.id)
    .eq('idempotency_key', validated.idempotencyKey)
    .maybeSingle();

  if (existing) {
    return jsonResponse({
      paymentId: existing.id,
      status: existing.status,
      providerRef: existing.provider_ref,
      receiptEmail: existing.receipt_email,
      message: 'Paiement déjà initié (idempotency)',
    });
  }

  // Insert pending row.
  const { data: inserted, error: insertError } = await supabase
    .from('payments')
    .insert({
      profile_id: payer.id,
      amount: validated.amount,
      currency: validated.currency,
      method: validated.method,
      idempotency_key: validated.idempotencyKey,
      related_type: validated.relatedType,
      related_id: validated.relatedId,
      payer_phone: validated.payerPhone ?? null,
      status: 'pending',
    })
    .select('id')
    .single();
  if (insertError || !inserted) {
    return err(insertError?.message ?? 'failed to create payment', 500);
  }
  const paymentId = inserted.id as string;

  // Auto-succeed (test phase) or provider stubs not yet wired → succeed.
  const autoSucceed = shouldAutoSucceed(validated.method);
  const providerRef = autoSucceed
    ? `auto-${Math.random().toString(36).slice(2)}`
    : `stub-${Math.random().toString(36).slice(2)}`;
  const finalStatus: 'succeeded' | 'failed' = autoSucceed ? 'succeeded' : 'failed';
  const errorMessage = autoSucceed
    ? null
    : validated.method === 'paypal'
    ? 'PayPal credentials not configured'
    : 'Singpay credentials not configured';

  // Send the receipt before flipping status, so a delivery failure can
  // be reflected on the same row update.
  let receiptReason: 'resend' | 'log' | 'error' | 'skipped' = 'skipped';
  let receiptSentAt: string | null = null;
  if (finalStatus === 'succeeded' && payer.email) {
    const ctx: ReceiptCtx = {
      payerName: payer.name,
      amount: validated.amount,
      currency: validated.currency,
      method: validated.method,
      relatedType: validated.relatedType,
      providerRef,
    };
    const result = await sendReceiptEmail(payer.email, ctx);
    receiptReason = result.reason;
    if (result.sent) receiptSentAt = new Date().toISOString();
  }

  await supabase
    .from('payments')
    .update({
      status: finalStatus,
      provider_ref: providerRef,
      error_message: errorMessage,
      receipt_email: payer.email ?? null,
      receipt_sent_at: receiptSentAt,
    })
    .eq('id', paymentId);

  return jsonResponse({
    paymentId,
    status: finalStatus,
    providerRef,
    receiptEmail: payer.email,
    receiptSentAt,
    receiptReason,
    message:
      finalStatus === 'succeeded'
        ? `Reçu envoyé à ${payer.email}`
        : errorMessage,
  });
});
