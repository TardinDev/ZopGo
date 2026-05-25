-- 025_payments.sql
-- Payment system foundation.
--
-- One row per payment attempt. The app does NOT charge the user from the
-- client — every initiation goes through the `payments-initiate` Edge
-- Function which signs the request, talks to the provider, and writes
-- back via webhook. The mobile client only reads from this table.
--
-- Status lifecycle:
--   pending    → row just inserted, provider call not yet made
--   processing → provider accepted, awaiting user action (USSD / web flow)
--   succeeded  → provider webhook confirmed payment
--   failed     → provider rejected or user cancelled
--   refunded   → manual or auto refund issued
--   cancelled  → expired / aborted before any provider action

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'airtel_money',   -- via Singpay
  'moov_money',     -- via Singpay
  'paypal'          -- PayPal REST API
);

CREATE TYPE payment_related_type AS ENUM (
  'trajet_reservation',
  'hebergement_reservation',
  'livraison'
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- WHO paid. profile_id is the supabase profiles.id of the payer.
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,

  -- HOW MUCH. Amount stored in MINOR units (e.g. XAF has no minor units
  -- so it's just the integer amount; we use bigint to be safe). Currency
  -- ISO-4217. XAF for Gabon mobile money, USD for PayPal.
  amount bigint NOT NULL CHECK (amount > 0),
  currency text NOT NULL CHECK (currency IN ('XAF', 'USD', 'EUR')),

  -- WHICH method + provider reference.
  method payment_method NOT NULL,
  provider_ref text,
  -- Idempotency: same (profile_id, idempotency_key) MUST NOT create two
  -- payments. Client generates a UUID per booking attempt.
  idempotency_key text NOT NULL,

  -- WHAT was paid for. Links back to the reservation / livraison row.
  related_type payment_related_type NOT NULL,
  related_id uuid NOT NULL,

  -- STATUS lifecycle.
  status payment_status NOT NULL DEFAULT 'pending',
  error_code text,
  error_message text,

  -- Mobile money flows: the user's phone in E.164 format. Optional for
  -- PayPal where the email is owned by the provider.
  payer_phone text,

  -- Provider-specific raw payload, useful for debugging webhook fails.
  provider_payload jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Idempotency guard — one payment row per client-generated key per payer.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency
  ON public.payments (profile_id, idempotency_key);

-- Lookups by payer.
CREATE INDEX IF NOT EXISTS idx_payments_profile_created
  ON public.payments (profile_id, created_at DESC);

-- Reverse lookup: "did this reservation get paid?"
CREATE INDEX IF NOT EXISTS idx_payments_related
  ON public.payments (related_type, related_id);

-- Status filter — used by the dashboard to show pending / failed
-- payments needing attention.
CREATE INDEX IF NOT EXISTS idx_payments_status
  ON public.payments (status)
  WHERE status IN ('pending', 'processing', 'failed');

-- updated_at auto-bumper.
CREATE OR REPLACE FUNCTION public.tg_payments_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IN ('succeeded', 'failed', 'refunded', 'cancelled')
     AND OLD.status NOT IN ('succeeded', 'failed', 'refunded', 'cancelled') THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_touch_updated_at ON public.payments;
CREATE TRIGGER payments_touch_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_payments_touch_updated_at();

-- RLS: a user can read their own payments only. Writes go through the
-- service-role Edge Functions (`payments-initiate` and the webhook
-- handler) which bypass RLS.
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
  ON public.payments FOR SELECT
  USING (
    profile_id = (
      SELECT id FROM public.profiles
      WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

COMMENT ON TABLE public.payments IS
  'Payment attempts. Created + updated exclusively by the payments Edge Functions. Clients read via RLS.';
