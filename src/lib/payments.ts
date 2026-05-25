/**
 * Client-side payment helpers.
 *
 * The mobile client never charges the user directly. All initiation goes
 * through the `payments-initiate` Edge Function which signs the request,
 * talks to the provider (Singpay or PayPal), and writes back via webhook.
 * The client only reads the resulting row + listens for status changes.
 */
import { supabase } from './supabase';
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  Payment,
  PaymentStatus,
} from '../types';

// ─── Idempotency key generator ─────────────────────────────────────

/**
 * Generates a fresh idempotency key for a booking attempt. Calling
 * `initiatePayment` with the same key returns the existing payment row
 * (provider call is NOT retried), which is what we want when the user
 * taps "Réserver" twice or the network blips.
 */
export function generateIdempotencyKey(): string {
  // RN has no crypto.randomUUID in older runtimes; build a v4-ish UUID
  // from Math.random. Good enough for client-side idempotency, not for
  // cryptographic uniqueness.
  const hex = (n: number) =>
    Math.floor(Math.random() * 16 ** n)
      .toString(16)
      .padStart(n, '0');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${hex(4)}-${hex(12)}`;
}

// ─── Initiate ──────────────────────────────────────────────────────

export async function initiatePayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult | { error: string }> {
  if (params.amount <= 0) {
    return { error: 'Le montant doit être supérieur à zéro.' };
  }
  if (
    (params.method === 'airtel_money' || params.method === 'moov_money') &&
    !params.payerPhone
  ) {
    return { error: 'Numéro de téléphone requis pour le mobile money.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('payments-initiate', {
      body: params,
    });

    if (error) {
      if (__DEV__) console.error('[payments] invoke error:', error.message);
      return { error: error.message || 'Échec de l\'initiation du paiement.' };
    }
    if (!data || typeof data !== 'object') {
      return { error: 'Réponse inattendue du serveur de paiement.' };
    }
    const result = data as InitiatePaymentResult & { error?: string };
    if (result.error) {
      return { error: result.error };
    }
    return {
      paymentId: result.paymentId,
      status: result.status,
      redirectUrl: result.redirectUrl ?? null,
      receiptEmail: result.receiptEmail ?? null,
      providerRef: result.providerRef ?? null,
      message: result.message,
    };
  } catch (err) {
    if (__DEV__) console.error('[payments] unexpected error:', err);
    return {
      error:
        err instanceof Error
          ? err.message
          : 'Erreur inattendue lors du paiement.',
    };
  }
}

// ─── Read ───────────────────────────────────────────────────────────

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    amount: Number(row.amount),
    currency: row.currency as Payment['currency'],
    method: row.method as Payment['method'],
    providerRef: (row.provider_ref as string) ?? null,
    idempotencyKey: String(row.idempotency_key),
    relatedType: row.related_type as Payment['relatedType'],
    relatedId: String(row.related_id),
    status: row.status as PaymentStatus,
    errorCode: (row.error_code as string) ?? null,
    errorMessage: (row.error_message as string) ?? null,
    payerPhone: (row.payer_phone as string) ?? null,
    receiptEmail: (row.receipt_email as string) ?? null,
    receiptSentAt: (row.receipt_sent_at as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    completedAt: (row.completed_at as string) ?? null,
  };
}

export async function fetchPayment(paymentId: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle();

  if (error) {
    if (__DEV__) console.error('[payments] fetch error:', error.message);
    return null;
  }
  if (!data) return null;
  return rowToPayment(data as Record<string, unknown>);
}

// ─── Subscribe to status changes ────────────────────────────────────

export interface PaymentSubscription {
  unsubscribe: () => void;
}

/**
 * Subscribes to UPDATE events on a specific payment row. Used by the
 * payment status modal to flip from "processing" to "succeeded" /
 * "failed" the moment the webhook fires.
 */
export function subscribeToPayment(
  paymentId: string,
  onChange: (payment: Payment) => void
): PaymentSubscription {
  const channel = supabase
    .channel(`payment-${paymentId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'payments',
        filter: `id=eq.${paymentId}`,
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object') {
          onChange(rowToPayment(payload.new as Record<string, unknown>));
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}

// ─── Terminal status helpers ────────────────────────────────────────

const TERMINAL_STATUSES: ReadonlySet<PaymentStatus> = new Set([
  'succeeded',
  'failed',
  'refunded',
  'cancelled',
]);

export function isTerminalStatus(status: PaymentStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isSuccessStatus(status: PaymentStatus): boolean {
  return status === 'succeeded';
}
