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
- `_shared/adminAuth.ts` existe déjà : il vérifie la signature HS256 du jeton du template et le claim `admin_role`. Écrit et vérifié en production lors du correctif des annonces diffusées.

## Décisions

| Question | Décision | Raison |
|---|---|---|
| Accès du nouveau | Invitation par email | L'administration ne manipule aucun mot de passe, et l'email valide l'adresse |
| Suivi | Liste des invitations en attente + révocation | Sans elle, on invite à l'aveugle et une adresse mal saisie reste valable jusqu'à expiration |
| Authentification de la fonction | Vérification de la signature HS256 + claim `admin_role` | Une première conception déléguait aux policies ; elle était fausse, voir ci-dessous |
| Emplacement du secret Clerk | Secret Supabase | Seul endroit où il ne transite jamais par un navigateur |

## Architecture

### Edge Function `admin-invitations`

Déployée en `verify_jwt = false`, comme les autres fonctions du projet — le gateway Edge ne sait valider ni les jetons Clerk, ni ceux du template.

**Autorisation par `_shared/adminAuth.ts`**, module déjà écrit, déployé et vérifié en production lors du correctif des annonces diffusées.

Il vérifie la signature HS256 du jeton avec le secret JWT du projet (`ADMIN_JWT_SECRET`), contrôle l'expiration, puis lit le claim `admin_role`. C'est le même contrôle que les policies, appliqué en amont de la base.

**Une première conception, écartée.** L'idée initiale était de déléguer l'autorisation aux policies : lire `audit_log`, table réservée aux admins, et conclure « admin » si la lecture passait. Elle ne tient pas — **un refus RLS ne produit aucune erreur**, PostgREST renvoie un résultat vide. La fonction concluait donc « admin » pour tout porteur de jeton valide. Constaté en production avant correction.

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
La règle de repli du rôle vit directement dans le webhook — trois lignes n'appellent pas un module. Elle est verrouillée par un test de contrat lisant la source, comme `sendPushAuthContract.test.ts` le fait pour `send-push` : le webhook tourne sous Deno, hors de portée de Jest.

## Flux

1. L'admin saisit email + rôle, valide
2. L'admin web appelle `admin-invitations` en `POST`, jeton du template en en-tête
3. La fonction vérifie la signature du jeton et le claim `admin_role`
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
- Contrat du webhook : présence du repli, `unsafe_metadata` prioritaire, défaut `client`
- Vérification en production : invitation réellement créée, listée, puis révoquée ; et un appel sans qualité d'admin refusé en `403`

## Hors périmètre

- **Renvoi d'une invitation** — Clerk ne l'expose pas ; il faudrait révoquer puis recréer
- **Création de comptes administrateurs** — doit rester un geste délibéré au Dashboard
- **Import en masse** — un formulaire unitaire suffit à l'usage décrit

## Prérequis côté exploitant

Le secret `CLERK_SECRET_KEY` doit être posé dans les secrets Supabase, avec une clé `sk_live_` de l'instance de production. Elle ne transite jamais par le navigateur ni par le dépôt.

`ADMIN_JWT_SECRET` est déjà en place, posé lors du correctif des annonces diffusées.

Note : la CLI Supabase refuse les noms de secrets commençant par `SUPABASE_`, d'où ce nom.
