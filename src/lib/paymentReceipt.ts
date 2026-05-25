/**
 * Pure receipt-email builders. Lives in src/lib so it can be unit-tested
 * with jest in Node — and re-used by the `payments-initiate` Edge
 * Function which runs in Deno. Keep this module free of React Native
 * and Supabase imports (no side effects).
 */
import type { PaymentMethod, PaymentRelatedType, PaymentCurrency } from '../types';

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

export interface ReceiptContext {
  payerName: string;
  payerEmail: string;
  amount: number;
  currency: PaymentCurrency;
  method: PaymentMethod;
  relatedType: PaymentRelatedType;
  /** Provider transaction reference. */
  providerRef: string | null;
  /** ISO date string (defaults to the current date if omitted). */
  paidAt?: string;
}

function formatAmount(value: number, currency: PaymentCurrency): string {
  // `toLocaleString('fr-FR')` uses NBSP (U+00A0) or NNBSP (U+202F) as the
  // thousands separator depending on the Node / ICU version. Normalise to
  // a regular space so the output is deterministic — tests and email
  // clients alike then see plain ASCII whitespace.
  const digits = value
    .toLocaleString('fr-FR')
    .replace(/[  ]/g, ' ')
    .replace(/,/g, ' ');
  switch (currency) {
    case 'XAF':
      return `${digits} Fcfa`;
    case 'USD':
      return `$${digits}`;
    case 'EUR':
      return `${digits} €`;
  }
}

function formatDateFr(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const months = [
    'jan', 'fév', 'mar', 'avr', 'mai', 'juin',
    'juil', 'août', 'sep', 'oct', 'nov', 'déc',
  ];
  const year = d.getFullYear();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${months[d.getMonth()]} ${year} à ${h}h${m}`;
}

export function buildReceiptSubject(ctx: ReceiptContext): string {
  return `Reçu ZopGo · ${formatAmount(ctx.amount, ctx.currency)}`;
}

export function buildReceiptText(ctx: ReceiptContext): string {
  const lines = [
    `Bonjour ${ctx.payerName || 'cher client'},`,
    '',
    'Ton paiement a bien été reçu. Voici le récapitulatif :',
    '',
    `  • Montant       : ${formatAmount(ctx.amount, ctx.currency)}`,
    `  • Méthode       : ${METHOD_LABEL[ctx.method]}`,
    `  • Objet         : ${RELATED_LABEL[ctx.relatedType]}`,
    `  • Date          : ${formatDateFr(ctx.paidAt)}`,
    ctx.providerRef ? `  • Référence     : ${ctx.providerRef}` : null,
    '',
    'Conserve ce reçu, il fait office de preuve de paiement.',
    '',
    "Merci de faire confiance à ZopGo.",
    '— L\'équipe ZopGo',
  ];
  return lines.filter((l) => l !== null).join('\n');
}

export function buildReceiptHtml(ctx: ReceiptContext): string {
  // Inline styles for maximum email-client compatibility (Gmail, Outlook,
  // Apple Mail). No external CSS, no class names, brand blue accent only.
  const amount = formatAmount(ctx.amount, ctx.currency);
  const method = METHOD_LABEL[ctx.method];
  const objet = RELATED_LABEL[ctx.relatedType];
  const date = formatDateFr(ctx.paidAt);
  const safeName = escapeHtml(ctx.payerName || 'cher client');
  const refRow = ctx.providerRef
    ? `<tr><td style="padding:6px 0;color:#6B7280;font-size:13px;">Référence</td><td style="padding:6px 0;color:#0F172A;font-size:13px;font-weight:600;font-family:monospace;">${escapeHtml(
        ctx.providerRef
      )}</td></tr>`
    : '';
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Reçu ZopGo</title></head>
<body style="margin:0;padding:24px;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,0.08);">
    <div style="background:#2162FE;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
      <span style="color:white;font-weight:800;letter-spacing:1.6px;font-size:13px;">ZOPGO PASS</span>
      <span style="color:rgba(255,255,255,0.92);font-weight:700;letter-spacing:1.2px;font-size:11px;text-transform:uppercase;">REÇU DE PAIEMENT</span>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 12px 0;font-size:15px;">Bonjour ${safeName},</p>
      <p style="margin:0 0 18px 0;font-size:14px;color:#4B5563;">Ton paiement a bien été reçu. Voici le récapitulatif :</p>
      <div style="font-size:28px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;margin-bottom:18px;">${escapeHtml(amount)}</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:6px 0;color:#6B7280;">Méthode</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${escapeHtml(method)}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Objet</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${escapeHtml(objet)}</td></tr>
        <tr><td style="padding:6px 0;color:#6B7280;">Date</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${escapeHtml(date)}</td></tr>
        ${refRow}
      </table>
      <p style="margin:24px 0 0 0;font-size:12px;color:#9CA3AF;line-height:18px;">Conserve ce reçu, il fait office de preuve de paiement. Merci de faire confiance à ZopGo.</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
