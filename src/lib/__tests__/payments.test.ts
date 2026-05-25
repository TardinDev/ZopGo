import {
  generateIdempotencyKey,
  initiatePayment,
  fetchPayment,
  isTerminalStatus,
  isSuccessStatus,
  subscribeToPayment,
} from '../payments';
import { supabase } from '../supabase';

jest.unmock('../payments');

describe('generateIdempotencyKey', () => {
  it('returns a UUID-shaped string', () => {
    const key = generateIdempotencyKey();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('produces different keys across calls', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateIdempotencyKey()));
    expect(keys.size).toBeGreaterThan(45); // tolerate the rare collision
  });
});

describe('isTerminalStatus', () => {
  it('marks succeeded / failed / refunded / cancelled as terminal', () => {
    expect(isTerminalStatus('succeeded')).toBe(true);
    expect(isTerminalStatus('failed')).toBe(true);
    expect(isTerminalStatus('refunded')).toBe(true);
    expect(isTerminalStatus('cancelled')).toBe(true);
  });

  it('keeps pending / processing as non-terminal', () => {
    expect(isTerminalStatus('pending')).toBe(false);
    expect(isTerminalStatus('processing')).toBe(false);
  });
});

describe('isSuccessStatus', () => {
  it('only succeeded is success', () => {
    expect(isSuccessStatus('succeeded')).toBe(true);
    expect(isSuccessStatus('failed')).toBe(false);
    expect(isSuccessStatus('refunded')).toBe(false);
    expect(isSuccessStatus('processing')).toBe(false);
  });
});

describe('initiatePayment — client-side validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a non-positive amount before hitting the network', async () => {
    const result = await initiatePayment({
      amount: 0,
      currency: 'XAF',
      method: 'airtel_money',
      relatedType: 'trajet_reservation',
      relatedId: 'res-1',
      idempotencyKey: 'k-1',
      payerPhone: '+241066000000',
    });
    expect(result).toEqual({ error: expect.stringMatching(/montant/i) });
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('requires a phone number for mobile-money methods', async () => {
    const result = await initiatePayment({
      amount: 5000,
      currency: 'XAF',
      method: 'moov_money',
      relatedType: 'trajet_reservation',
      relatedId: 'res-1',
      idempotencyKey: 'k-1',
    });
    expect(result).toEqual({ error: expect.stringMatching(/téléphone/i) });
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('does NOT require a phone for PayPal', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { paymentId: 'pay-1', status: 'processing', redirectUrl: 'https://paypal/x' },
      error: null,
    });

    const result = await initiatePayment({
      amount: 10,
      currency: 'USD',
      method: 'paypal',
      relatedType: 'hebergement_reservation',
      relatedId: 'heb-1',
      idempotencyKey: 'k-2',
    });
    expect(result).toMatchObject({ paymentId: 'pay-1', status: 'processing' });
  });
});

describe('initiatePayment — server response handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards a successful Edge Function response', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { paymentId: 'p-1', status: 'processing', message: 'Composez le code USSD…' },
      error: null,
    });

    const result = await initiatePayment({
      amount: 5000,
      currency: 'XAF',
      method: 'airtel_money',
      relatedType: 'trajet_reservation',
      relatedId: 'res-1',
      idempotencyKey: 'k-3',
      payerPhone: '+241066000000',
    });

    expect(result).toEqual({
      paymentId: 'p-1',
      status: 'processing',
      redirectUrl: null,
      receiptEmail: null,
      providerRef: null,
      message: 'Composez le code USSD…',
    });
    expect(supabase.functions.invoke).toHaveBeenCalledWith('payments-initiate', {
      body: expect.objectContaining({
        amount: 5000,
        method: 'airtel_money',
        idempotencyKey: 'k-3',
      }),
    });
  });

  it('forwards payerProfileId to the Edge Function as a JWT-resolution fallback', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { paymentId: 'p-2', status: 'succeeded' },
      error: null,
    });

    await initiatePayment({
      amount: 12000,
      currency: 'XAF',
      method: 'airtel_money',
      relatedType: 'hebergement_reservation',
      relatedId: 'heb-9',
      idempotencyKey: 'k-7',
      payerPhone: '+241066000000',
      payerProfileId: 'prof-abc',
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('payments-initiate', {
      body: expect.objectContaining({
        relatedType: 'hebergement_reservation',
        relatedId: 'heb-9',
        payerProfileId: 'prof-abc',
      }),
    });
  });

  it('returns the error message when the Edge Function fails', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'singpay 500' },
    });

    const result = await initiatePayment({
      amount: 1000,
      currency: 'XAF',
      method: 'airtel_money',
      relatedType: 'livraison',
      relatedId: 'liv-1',
      idempotencyKey: 'k-4',
      payerPhone: '+241066000000',
    });

    expect(result).toEqual({ error: 'singpay 500' });
  });

  it('returns a friendly error when the function throws', async () => {
    (supabase.functions.invoke as jest.Mock).mockRejectedValue(new Error('network down'));

    const result = await initiatePayment({
      amount: 1000,
      currency: 'XAF',
      method: 'moov_money',
      relatedType: 'trajet_reservation',
      relatedId: 'res-1',
      idempotencyKey: 'k-5',
      payerPhone: '+241066000000',
    });

    expect(result).toEqual({ error: 'network down' });
  });

  it('surfaces an error field embedded in a 200 response', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { error: 'idempotency conflict' },
      error: null,
    });

    const result = await initiatePayment({
      amount: 1000,
      currency: 'XAF',
      method: 'airtel_money',
      relatedType: 'trajet_reservation',
      relatedId: 'res-1',
      idempotencyKey: 'k-6',
      payerPhone: '+241066000000',
    });

    expect(result).toEqual({ error: 'idempotency conflict' });
  });
});

describe('fetchPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a raw row to a Payment object', async () => {
    const row = {
      id: 'p-1',
      profile_id: 'prof-1',
      amount: 5000,
      currency: 'XAF',
      method: 'airtel_money',
      provider_ref: 'sp-ref-1',
      idempotency_key: 'k-1',
      related_type: 'trajet_reservation',
      related_id: 'res-1',
      status: 'succeeded',
      error_code: null,
      error_message: null,
      payer_phone: '+241066000000',
      receipt_email: 'pierre@example.com',
      receipt_sent_at: '2026-03-15T10:01:00Z',
      created_at: '2026-03-15T10:00:00Z',
      updated_at: '2026-03-15T10:01:00Z',
      completed_at: '2026-03-15T10:01:00Z',
    };
    const mockSingle = jest.fn().mockResolvedValue({ data: row, error: null });
    const mockEq = jest.fn(() => ({ maybeSingle: mockSingle }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const result = await fetchPayment('p-1');
    expect(result).toMatchObject({
      id: 'p-1',
      profileId: 'prof-1',
      amount: 5000,
      method: 'airtel_money',
      status: 'succeeded',
      relatedId: 'res-1',
      receiptEmail: 'pierre@example.com',
      receiptSentAt: '2026-03-15T10:01:00Z',
    });
  });

  it('returns null when the row is missing', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = jest.fn(() => ({ maybeSingle: mockSingle }));
    (supabase.from as jest.Mock).mockReturnValue({ select: () => ({ eq: mockEq }) });

    expect(await fetchPayment('missing')).toBeNull();
  });

  it('returns null on a query error (logs but does not throw)', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'rls' } });
    const mockEq = jest.fn(() => ({ maybeSingle: mockSingle }));
    (supabase.from as jest.Mock).mockReturnValue({ select: () => ({ eq: mockEq }) });

    expect(await fetchPayment('p-1')).toBeNull();
  });
});

describe('subscribeToPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens a channel filtered to the given payment id', () => {
    const mockOn = jest.fn().mockReturnThis();
    const mockSubscribe = jest.fn().mockReturnThis();
    const mockChannel = { on: mockOn, subscribe: mockSubscribe };
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

    subscribeToPayment('p-42', jest.fn());

    expect(supabase.channel).toHaveBeenCalledWith('payment-p-42');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        table: 'payments',
        filter: 'id=eq.p-42',
      }),
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('returns an unsubscribe handle that removes the channel', () => {
    const mockChannel = { on: jest.fn().mockReturnThis(), subscribe: jest.fn().mockReturnThis() };
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

    const sub = subscribeToPayment('p-1', jest.fn());
    sub.unsubscribe();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('passes mapped payment to the onChange callback when the row updates', () => {
    let registeredCb: ((payload: { new: Record<string, unknown> }) => void) | null = null;
    const mockOn = jest.fn((_event, _filter, cb) => {
      registeredCb = cb;
      return { subscribe: jest.fn().mockReturnThis() };
    });
    (supabase.channel as jest.Mock).mockReturnValue({ on: mockOn });

    const onChange = jest.fn();
    subscribeToPayment('p-1', onChange);

    registeredCb!({
      new: {
        id: 'p-1',
        profile_id: 'prof-1',
        amount: 1000,
        currency: 'XAF',
        method: 'moov_money',
        idempotency_key: 'k',
        related_type: 'trajet_reservation',
        related_id: 'res-1',
        status: 'succeeded',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:01:00Z',
      },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p-1', status: 'succeeded', amount: 1000 })
    );
  });
});
