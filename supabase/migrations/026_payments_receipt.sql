-- 026_payments_receipt.sql
-- Track receipt delivery on every payment row. We persist the email
-- address used (in case the user changes their profile email later) and
-- the timestamp of the send, so the dashboard / support tooling can tell
-- "this was paid, was the receipt sent?" without having to query the
-- email provider.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS receipt_email text,
  ADD COLUMN IF NOT EXISTS receipt_sent_at timestamptz;

COMMENT ON COLUMN public.payments.receipt_email IS
  'Email address the receipt was sent to. May differ from current profiles.email if the user changed it post-payment.';

COMMENT ON COLUMN public.payments.receipt_sent_at IS
  'When the receipt email was dispatched (Resend API call, or stub-mode log). NULL = not sent yet / failed.';
