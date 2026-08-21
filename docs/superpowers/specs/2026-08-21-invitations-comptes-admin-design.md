# Créer un compte chauffeur ou hébergeur depuis l'admin

**Date** : 2026-08-21
**État** : validé, prêt pour le plan d'implémentation

## Intention

Permettre à l'administration d'enrôler un chauffeur ou un hébergeur sans passer par le Dashboard Clerk, en lui envoyant une invitation par email. La personne choisit elle-même son mot de passe : l'administration ne manipule aucun secret, et l'email prouve que l'adresse est valide.

## Contrainte fondatrice

**Créer un compte exige la clé secrète Clerk**, qui ne peut pas vivre dans un navigateur — n'importe quel visiteur pourrait l'extraire du bundle. Toute la fonctionnalité découle de là : il faut une Edge Function, la clé restant côté serveur.

## État de l'existant

Constaté avant conception :

- L'admin web s'authentifie auprès de Supabase avec un jeton **HS256** issu du template Clerk `supabase`, porteur du claim `admin_role`. Ce n'est pas un jeton Clerk brut.
- `_shared/clerkAuth.ts` vérifie des jetons **RS256** contre le JWKS Clerk. Il rejetterait donc l'admin.
- `sendAdminPush.ts` n'appelle **aucune** Edge Function : il tape l'API Expo Push directement depuis le navigateur. Il n'existe aucun précédent d'appel de fonction côté admin.
- `clerk-webhook` crée la ligne `profiles` sur `user.created`, en lisant le rôle dans `userData.unsafe_metadata?.role || 'client'`.
- `audit_log` est réservé aux admins depuis la migration 040.

## Décisions

| Question | Décision | Raison |
|---|---|---|
| Accès du nouveau | Invitation par email | L'administration ne manipule aucun mot de passe, et l'email valide l'adresse |
| Suivi | Liste des invitations en attente + révocation | Sans elle, on invite à l'aveugle et une adresse mal saisie reste valable jusqu'à expiration |
| Authentification de la fonction | Délégation à RLS | Évite d'introduire un second mécanisme de vérification et le secret JWT Supabase avec lui |
| Emplacement du secret Clerk | Secret Supabase | Seul endroit où il ne transite jamais par un navigateur |

## Architecture

### Edge Function `admin-invitations`

Déployée en `verify_jwt = false`, comme les autres fonctions du projet — le gateway Edge ne sait valider ni les jetons Clerk, ni ceux du template.

**Autorisation par délégation.** La fonction construit un client Supabase portant le jeton `Authorization` de l'appelant, puis lit une ligne d'`audit_log`. Cette table n'étant lisible que par un porteur du claim `admin_role`, une lecture réussie prouve la qualité d'administrateur.

Ce choix évite de dupliquer la logique d'autorisation : elle reste définie dans les policies, à un seul endroit. Il évite aussi d'exposer le secret JWT Supabase à une seconde fonction.

**Trois opérations**, distinguées par la méthode HTTP :

- `POST` — crée l'invitation via `POST https://api.clerk.com/v1/invitations`, avec `email_address`, `public_metadata: { role }` et `notify: true`
- `GET` — liste les invitations `pending` via `GET /v1/invitations?status=pending`
- `DELETE` — révoque via `POST /v1/invitations/{id}/revoke`

Le secret Clerk est lu depuis `Deno.env.get('CLERK_SECRET_KEY')`.

### Correction du webhook — le rôle

Une invitation Clerk ne transporte que `public_metadata`. À l'acceptation, l'utilisateur créé porte donc son rôle dans `public_metadata.role`, tandis que `clerk-webhook` lit `unsafe_metadata.role`.

**Sans correction, tout invité deviendrait `client`**, quel que soit le rôle choisi — la fonctionnalité manquerait son objet sans qu'aucune erreur ne le signale.

Le webhook lira donc :

```
userData.unsafe_metadata?.role || userData.public_metadata?.role || 'client'
```

L'ordre compte : `unsafe_metadata` d'abord, pour ne pas modifier le comportement des inscriptions par l'application, qui l'alimentent déjà.

### Écran admin — `src/pages/invitations/`

Une page unique : formulaire (email, rôle) au-dessus de la liste des invitations en attente — destinataire, rôle, date d'envoi, bouton de révocation avec confirmation.

Ressource `invitations` déclarée dans `App.tsx`, entrée dans le menu latéral.

### Logique extraite et testable

Suivant la convention du dépôt admin (`payload.ts`, `actor.ts`, `moderation.ts`) :

- `buildInvitationPayload(email, role)` — détoure l'email, le passe en minuscules, place le rôle dans `public_metadata`
- `resolveInvitedRole(unsafeMeta, publicMeta)` — la règle de repli ci-dessus, également utilisée côté fonction

## Flux

1. L'admin saisit email + rôle, valide
2. L'admin web appelle `admin-invitations` en `POST`, jeton du template en en-tête
3. La fonction vérifie la qualité d'admin en lisant `audit_log`
4. Elle crée l'invitation Clerk, qui envoie l'email
5. La personne clique, choisit son mot de passe → Clerk crée l'utilisateur avec `public_metadata.role`
6. `user.created` déclenche `clerk-webhook`, qui crée la ligne `profiles` avec le bon rôle
7. La personne se connecte dans l'application mobile

## Gestion des erreurs

- **Appelant non admin** : `403`, aucune information sur la cause
- **Email déjà invité ou déjà inscrit** : Clerk renvoie une erreur explicite, relayée telle quelle à l'admin
- **Clé Clerk absente ou invalide** : `500`, message journalisé côté fonction, message générique côté admin
- **Révocation d'une invitation déjà acceptée** : Clerk refuse, l'erreur est affichée

## Tests

- `buildInvitationPayload` : détourage, minuscules, rôle placé dans `public_metadata`, email vide refusé
- `resolveInvitedRole` : `unsafe_metadata` prioritaire, repli sur `public_metadata`, défaut `client` quand les deux manquent
- Vérification en production : invitation réellement créée, listée, puis révoquée ; et un appel sans qualité d'admin refusé en `403`

## Hors périmètre

- **Renvoi d'une invitation** — Clerk ne l'expose pas ; il faudrait révoquer puis recréer
- **Création de comptes administrateurs** — doit rester un geste délibéré au Dashboard
- **Import en masse** — un formulaire unitaire suffit à l'usage décrit

## Prérequis côté exploitant

Le secret `CLERK_SECRET_KEY` doit être posé dans les secrets Supabase, avec une clé `sk_live_` de l'instance de production. Elle ne transite jamais par le navigateur ni par le dépôt.
