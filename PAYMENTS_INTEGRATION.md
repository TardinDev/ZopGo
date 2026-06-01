# Paiements — guide d'intégration (test → live)

## État actuel

- **Client, DB, UI, reçus : 100 % prêts** (`src/lib/payments.ts`,
  `PaymentMethodSheet`, `PaymentStatusModal`, migrations `025`/`026`, tests).
- **`payments-initiate`** tourne en **mode `test` par défaut** : il écrit
  `status='succeeded'` immédiatement + envoie le reçu. Le flux de réservation
  marche de bout en bout **sans credentials**. ✅ Aucune régression.
- Le **mode `live`** et la fonction **`payments-webhook`** sont **codés mais
  jamais testés end-to-end** (pas encore de credentials). PayPal suit l'API
  documentée ; **Singpay est un stub** à compléter.

## Architecture (mode live)

```
App  ──initiatePayment──▶  payments-initiate
                              │  route par méthode
                              ├─ paypal        → PayPal Orders v2  → status='processing' (+ approval URL)
                              └─ airtel/moov   → Singpay (STUB)    → status='processing'
App  ──subscribeToPayment (realtime)──▶ payments table
Provider  ──webhook──▶  payments-webhook?provider=paypal|singpay
                              │  vérifie signature
                              └─ settlePayment(provider_ref) → status='succeeded'|'failed'
                                     │ realtime UPDATE
App (PaymentStatusModal) ◀── onSuccess/onFailure → crée la réservation
```

Le client gère **déjà** l'asynchrone : en `live`, `initiatePayment` renvoie
`processing`, puis le modal réagit au webhook via realtime. Aucune modif
mobile nécessaire (hormis ouvrir `redirectUrl` PayPal dans un in-app browser
— voir TODO).

## Passer en live — checklist

1. **Renseigner les secrets** (Supabase → Edge Functions → secrets) :
   ```bash
   npx supabase secrets set PAYMENTS_MODE=live
   npx supabase secrets set PAYPAL_BASE=https://api-m.sandbox.paypal.com \
     PAYPAL_CLIENT_ID=... PAYPAL_SECRET=... PAYPAL_WEBHOOK_ID=...
   npx supabase secrets set SINGPAY_API_URL=... SINGPAY_API_KEY=... SINGPAY_WEBHOOK_SECRET=...
   npx supabase secrets set APP_RETURN_URL=zopgo://payments/return
   # (RESEND_API_KEY / RESEND_FROM déjà gérés)
   ```
2. **Déployer les fonctions** :
   ```bash
   npx supabase functions deploy payments-initiate
   npx supabase functions deploy payments-webhook
   ```
3. **PayPal** : créer un webhook dans l'app PayPal pointant sur
   `https://<ref>.functions.supabase.co/payments-webhook?provider=paypal`,
   abonné à `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`,
   `PAYMENT.CAPTURE.DENIED`. Copier le **Webhook ID** dans `PAYPAL_WEBHOOK_ID`.
4. **Singpay** : configurer le callback sur
   `.../payments-webhook?provider=singpay` (après avoir complété le stub).

## TODO avant go-live (assumés, non faits)

- [ ] **Singpay `singpayInitiate()`** (`payments-initiate`) — endpoint réel,
      payload, header d'auth, référence/idempotency, `callback_url`.
- [ ] **Singpay `handleSingpay()`** (`payments-webhook`) — vérif HMAC
      (`SINGPAY_WEBHOOK_SECRET`), parsing `{transaction_id, status}`, mapping
      → `settlePayment()`.
- [ ] **Vérif signature JWT Clerk** dans `resolvePayer()` (live) — on ne fait
      que décoder le claim ; vérifier contre le JWKS Clerk avant prod.
- [ ] **PayPal & XAF** : PayPal ne supporte pas le XAF → envoyer USD/EUR pour
      la méthode `paypal` (décision de conversion à trancher côté produit).
- [ ] **Ouverture de `redirectUrl`** PayPal côté app via `expo-web-browser`
      + deep link `APP_RETURN_URL`.
- [ ] **Test sandbox e2e** PayPal (un paiement complet : create → approve →
      capture → webhook → `succeeded` → réservation créée).

## Revenir en test
`npx supabase secrets set PAYMENTS_MODE=test` puis redéployer
`payments-initiate`. Le comportement simulé (auto-succès + reçu) reprend.
