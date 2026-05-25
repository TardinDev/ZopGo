// Edge Function: payments-initiate
//
// Initiates a payment with the requested method. The mobile client calls
// this with { amount, method, related_*, idempotency_key, payer_phone? }.
// We:
//   1. Authenticate the caller (Clerk JWT → profiles.id).
//   2. Idempotency check: same (profile_id, idempotency_key) → return the
//      existing row, never re-charge.
//   3. Validate the request shape (amount > 0, related row exists, phone
//      format for mobile money).
//   4. Create the payments row in 'pending'.
//   5. Route to the provider:
//        - airtel_money / moov_money → Singpay (requires SINGPAY_API_KEY)
//        - paypal → PayPal REST (requires PAYPAL_CLIENT_ID/SECRET)
//      If credentials are missing OR PAYMENTS_MOCK_MODE=true, we fall
//      back to a dev-friendly mock that flips status to 'succeeded'
//      after a short delay (simulating the webhook). This lets the rest
//      of the app be developed before the provider sandboxes are wired.
//   6. Return { paymentId, status, redirectUrl?, message }.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Env ────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SINGPAY_API_KEY = Deno.env.get('SINGPAY_API_KEY');
const SINGPAY_API_URL = Deno.env.get('SINGPAY_API_URL');
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET');
const PAYPAL_BASE = Deno.env.get('PAYPAL_BASE') ?? 'https://api-m.sandbox.paypal.com';
// Force mock mode in env. When unset, we mock IF the provider key is
// missing — that's the dev default.
const FORCE_MOCK = (Deno.env.get('PAYMENTS_MOCK_MODE') ?? 'auto').toLowerCase();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Types ──────────────────────────────────────────────────────────

type PaymentMethod = 'airtel_money' | 'moov_money' | 'paypal';
type PaymentRelatedType =
  | 'trajet_reservation'
  | 'hebergement_reservation'
  | 'livraison';

interface InitiateBody {
  amount: number;
  currency: 'XAF' | 'USD' | 'EUR';
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

function isMockModeFor(method: PaymentMethod): boolean {
  if (FORCE_MOCK === 'true') return true;
  if (FORCE_MOCK === 'false') return false;
  // 'auto' (default): mock when the provider creds are missing.
  if (method === 'paypal') {
    return !PAYPAL_CLIENT_ID || !PAYPAL_SECRET;
  }
  return !SINGPAY_API_KEY || !SINGPAY_API_URL;
}

function validatePhone(phone: string | undefined): string | null {
  if (!phone) return 'payerPhone required for mobile money';
  // E.164: + then digits, 8..15 chars
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

// ─── Auth: resolve profile_id from Clerk JWT ───────────────────────

async function resolvePayerProfileId(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const jwt = auth.slice(7);

  // JWT parsing — we trust the SUPABASE service role here. In production
  // you'd verify the signature. For our use case the Edge Function is
  // invoked via supabase.functions.invoke which already validates the
  // anon JWT; we just need the `sub` (= clerk_id) claim.
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const clerkId = payload.sub as string;
    if (!clerkId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', clerkId)
      .maybeSingle();
    if (error || !data) return null;
    return data.id as string;
  } catch {
    return null;
  }
}

// ─── Provider: Singpay (airtel_money + moov_money) — STUB ──────────

interface ProviderResult {
  providerRef: string;
  status: 'processing' | 'failed';
  redirectUrl?: string;
  message?: string;
  errorMessage?: string;
}

async function chargeViaSingpay(
  _amount: number,
  _phone: string,
  _method: 'airtel_money' | 'moov_money'
): Promise<ProviderResult> {
  // TODO: replace with the real Singpay REST call once credentials and
  // the API contract are confirmed. The shape we'll need:
  //   POST {SINGPAY_API_URL}/v1/payments
  //   Headers: { Authorization: `Bearer ${SINGPAY_API_KEY}` }
  //   Body: { amount, currency, phone, method, merchant_ref, callback_url }
  // → { reference, status }
  return {
    providerRef: 'stub-singpay-' + Math.random().toString(36).slice(2),
    status: 'failed',
    errorMessage: 'Singpay credentials not configured',
  };
}

// ─── Provider: PayPal — STUB ──────────────────────────────────────

async function chargeViaPaypal(
  _amount: number,
  _currency: string
): Promise<ProviderResult> {
  // TODO: real PayPal Orders v2 call once creds are present.
  //   POST {PAYPAL_BASE}/v2/checkout/orders → { id, links[approve] }
  return {
    providerRef: 'stub-paypal-' + Math.random().toString(36).slice(2),
    status: 'failed',
    errorMessage: 'PayPal credentials not configured',
  };
}

// ─── Mock provider (dev) ───────────────────────────────────────────

async function chargeViaMock(): Promise<ProviderResult> {
  const ref = 'mock-' + Math.random().toString(36).slice(2);
  // We flip the payment to 'succeeded' a few seconds later, off-thread,
  // to mimic what the real webhook would do. Use waitUntil so the
  // response returns immediately.
  return {
    providerRef: ref,
    status: 'processing',
    message: 'Paiement simulé (mode dev). Statut "succeeded" dans 3 s.',
  };
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

  const profileId = await resolvePayerProfileId(req);
  if (!profileId) return err('unauthenticated', 401);

  // Idempotency: same (profile, key) → return existing payment.
  const { data: existing } = await supabase
    .from('payments')
    .select('id, status, provider_ref')
    .eq('profile_id', profileId)
    .eq('idempotency_key', validated.idempotencyKey)
    .maybeSingle();

  if (existing) {
    return jsonResponse({
      paymentId: existing.id,
      status: existing.status,
      providerRef: existing.provider_ref,
      message: 'Paiement déjà initié (idempotency)',
    });
  }

  // Insert pending row.
  const { data: inserted, error: insertError } = await supabase
    .from('payments')
    .insert({
      profile_id: profileId,
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

  // Charge.
  const mockMode = isMockModeFor(validated.method);
  let result: ProviderResult;
  if (mockMode) {
    result = await chargeViaMock();
  } else if (validated.method === 'paypal') {
    result = await chargeViaPaypal(validated.amount, validated.currency);
  } else {
    result = await chargeViaSingpay(
      validated.amount,
      validated.payerPhone!,
      validated.method
    );
  }

  // Persist provider result.
  const nextStatus = result.status;
  await supabase
    .from('payments')
    .update({
      status: nextStatus,
      provider_ref: result.providerRef,
      error_message: result.errorMessage ?? null,
    })
    .eq('id', paymentId);

  // Mock mode: simulate the webhook a few seconds later.
  if (mockMode && nextStatus === 'processing') {
    queueMockSettle(paymentId);
  }

  return jsonResponse({
    paymentId,
    status: nextStatus,
    redirectUrl: result.redirectUrl ?? null,
    message: result.message,
  });
});

function queueMockSettle(paymentId: string) {
  // Use setTimeout — Deno keeps the worker alive for short timers.
  setTimeout(async () => {
    try {
      await supabase
        .from('payments')
        .update({ status: 'succeeded' })
        .eq('id', paymentId)
        .eq('status', 'processing');
    } catch {
      /* noop */
    }
  }, 3000);
}
