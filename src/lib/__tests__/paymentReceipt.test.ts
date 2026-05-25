import {
  buildReceiptSubject,
  buildReceiptText,
  buildReceiptHtml,
  type ReceiptContext,
} from '../paymentReceipt';

const BASE_CTX: ReceiptContext = {
  payerName: 'Pierre Martin',
  payerEmail: 'pierre@example.com',
  amount: 15000,
  currency: 'XAF',
  method: 'airtel_money',
  relatedType: 'trajet_reservation',
  providerRef: 'sp-ref-42',
  paidAt: '2026-03-15T14:30:00Z',
};

describe('buildReceiptSubject', () => {
  it('includes the brand and the formatted amount', () => {
    expect(buildReceiptSubject(BASE_CTX)).toBe('Reçu ZopGo · 15 000 Fcfa');
  });

  it('uses the right currency symbol for USD', () => {
    const subject = buildReceiptSubject({ ...BASE_CTX, currency: 'USD', amount: 25 });
    expect(subject).toContain('$25');
  });

  it('uses the right currency symbol for EUR', () => {
    const subject = buildReceiptSubject({ ...BASE_CTX, currency: 'EUR', amount: 42 });
    expect(subject).toContain('42 €');
  });
});

describe('buildReceiptText', () => {
  it('greets the payer by name', () => {
    expect(buildReceiptText(BASE_CTX)).toMatch(/Bonjour Pierre Martin/);
  });

  it('falls back to a generic greeting when name is empty', () => {
    expect(buildReceiptText({ ...BASE_CTX, payerName: '' })).toMatch(/Bonjour cher client/);
  });

  it('renders the localised method label (not the enum value)', () => {
    expect(buildReceiptText({ ...BASE_CTX, method: 'moov_money' })).toMatch(/Moov Money/);
    expect(buildReceiptText({ ...BASE_CTX, method: 'paypal' })).toMatch(/PayPal/);
  });

  it('renders the localised related-type label', () => {
    const text = buildReceiptText({ ...BASE_CTX, relatedType: 'hebergement_reservation' });
    expect(text).toMatch(/Réservation d'hébergement/);
  });

  it('includes the provider reference when present', () => {
    expect(buildReceiptText(BASE_CTX)).toMatch(/sp-ref-42/);
  });

  it('omits the reference line when providerRef is null', () => {
    expect(buildReceiptText({ ...BASE_CTX, providerRef: null })).not.toMatch(/Référence/);
  });

  it('uses the French short-month date format', () => {
    // The exact hour depends on TZ; we just check the date + month tokens.
    expect(buildReceiptText(BASE_CTX)).toMatch(/15 mar 2026/);
  });

  it('falls back to the current date when paidAt is omitted', () => {
    const { paidAt: _, ...ctxWithoutDate } = BASE_CTX;
    const text = buildReceiptText(ctxWithoutDate);
    const year = new Date().getFullYear().toString();
    expect(text).toContain(year);
  });
});

describe('buildReceiptHtml', () => {
  it('renders an html document with the brand strip', () => {
    const html = buildReceiptHtml(BASE_CTX);
    expect(html).toMatch(/<!DOCTYPE html>/);
    expect(html).toMatch(/ZOPGO PASS/);
    expect(html).toMatch(/REÇU DE PAIEMENT/);
  });

  it('shows the formatted amount in large type', () => {
    const html = buildReceiptHtml(BASE_CTX);
    expect(html).toMatch(/15 000 Fcfa/);
  });

  it('escapes HTML-special characters in the payer name', () => {
    const html = buildReceiptHtml({
      ...BASE_CTX,
      payerName: '<script>alert(1)</script>',
    });
    expect(html).not.toMatch(/<script>/);
    expect(html).toMatch(/&lt;script&gt;/);
  });

  it('escapes HTML-special characters in the provider reference', () => {
    const html = buildReceiptHtml({ ...BASE_CTX, providerRef: '"><img src=x>' });
    expect(html).not.toMatch(/"><img/);
    expect(html).toMatch(/&quot;&gt;&lt;img/);
  });

  it('omits the reference row entirely when providerRef is null', () => {
    expect(buildReceiptHtml({ ...BASE_CTX, providerRef: null })).not.toMatch(/Référence/);
  });

  it('uses the brand blue (#2162FE) for the strip and no cosmetic gradients', () => {
    const html = buildReceiptHtml(BASE_CTX);
    expect(html).toMatch(/#2162FE/);
    // No CSS gradient instructions — keeping aligned with the anti-AI-look brand rule.
    expect(html).not.toMatch(/linear-gradient/);
  });
});
