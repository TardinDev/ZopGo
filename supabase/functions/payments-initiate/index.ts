// Edge Function: payments-initiate
//
// SIMULATION MODE — guaranteed-succeed flow.
//
// The mobile client calls this Function to initiate a payment. While
// the provider integrations (Singpay / PayPal) are not yet wired and
// the auth bridge to Supabase (Third Party Auth with Clerk) is still
// being configured, this Function unconditionally returns a successful
// response so the booking flow can be developed end-to-end.
//
// What it does:
//   1. Accept ANY POST body (no validation, no auth check).
//   2. Try (best-effort) to write a payments row to the DB so the UI's
//      realtime subscription has something to read. If the write fails
//      (auth, RLS, missing FK), we swallow the error and still return
//      success — the UI doesn't depend on the DB write for the test
//      phase.
//   3. Try (best-effort) to send a receipt email via Resend. If
//      RESEND_API_KEY is unset, log the body to the Function logs and
//      pretend it was sent.
//   4. ALWAYS return 200 with status='succeeded'.
//
// When Phase 2/3 lands (real Singpay + PayPal), this Function will be
// rewritten with proper auth + idempotency + provider routing.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Env ────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'ZopGo <onboarding@resend.dev>';

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
type PaymentCurrency = 'XAF' | 'USD' | 'EUR';
type PaymentRelatedType = 'trajet_reservation' | 'hebergement_reservation' | 'livraison';

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

// ─── Best-effort profile resolution (no auth gating) ───────────────

async function lookupProfile(body: Record<string, unknown>, req: Request): Promise<
  { id: string; name: string; email: string } | null
> {
  // Try body.payerProfileId first.
  const fromBody = body.payerProfileId;
  if (typeof fromBody === 'string' && fromBody.length > 0) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', fromBody)
        .maybeSingle();
      if (data) return data as { id: string; name: string; email: string };
    } catch (e) {
      console.error('[lookupProfile] by id failed', e);
    }
  }
  // Fallback: JWT → clerk_id → profile.
  try {
    const auth = req.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) {
      const parts = auth.slice(7).split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const clerkId = payload.sub as string;
        if (clerkId) {
          const { data } = await supabase
            .from('profiles')
            .select('id, name, email')
            .eq('clerk_id', clerkId)
            .maybeSingle();
          if (data) return data as { id: string; name: string; email: string };
        }
      }
    }
  } catch (e) {
    console.error('[lookupProfile] from JWT failed', e);
  }
  return null;
}

// ─── Main handler ──────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  // Parse body — anything goes, defaults applied below.
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // Empty body is fine in simulation mode.
  }

  const amount = typeof body.amount === 'number' ? body.amount : 0;
  const currency = typeof body.currency === 'string' ? body.currency : 'XAF';
  const method = typeof body.method === 'string' ? body.method : 'airtel_money';
  const relatedType =
    typeof body.relatedType === 'string' ? body.relatedType : 'trajet_reservation';
  const relatedId = typeof body.relatedId === 'string' ? body.relatedId : 'unknown';
  const idempotencyKey =
    typeof body.idempotencyKey === 'string' && body.idempotencyKey.length > 0
      ? body.idempotencyKey
      : crypto.randomUUID();
  const payerPhone = typeof body.payerPhone === 'string' ? body.payerPhone : null;

  const providerRef = 'sim-' + crypto.randomUUID().slice(0, 12);
  const payer = await lookupProfile(body, req);
  console.log('[payments-initiate] req', {
    amount, currency, method, relatedType, relatedId,
    payerResolved: !!payer,
    payerEmail: payer?.email,
  });

  // Best-effort DB write. The UI doesn't depend on it (it has the
  // returned status), but writing it lets the dashboard / support see
  // the simulated payments.
  let paymentId: string | null = null;
  if (payer) {
    try {
      // Idempotency: don't re-insert if the client retries.
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

  // Send the receipt (best effort, swallow errors).
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

  // Always return success. The UI shows green and the user proceeds.
  return json({
    paymentId: paymentId ?? `sim-${crypto.randomUUID()}`,
    status: 'succeeded',
    providerRef,
    receiptEmail: payer?.email ?? null,
    message: payer?.email
      ? `Reçu envoyé à ${payer.email}`
      : 'Paiement simulé (mode test)',
  });
});
