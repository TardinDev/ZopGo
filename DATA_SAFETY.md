# Data Safety — ZopGo (Google Play Console)

Ce document fournit les réponses exactes à reporter dans **Play Console →
Politique de l'application → Sécurité des données**. Il est dérivé de
`PRIVACY_POLICY.md` et du code réel (collecte effective de l'app).

> ⚠️ À mettre à jour le jour où les **paiements réels** sont activés
> (`PAYMENTS_MODE=live`). Aujourd'hui `PAYMENTS_MODE=test` : aucune donnée
> financière réelle n'est collectée, donc la section « Informations financières »
> reste à **Non**.

---

## Question d'introduction

| Question | Réponse |
|---|---|
| Votre application collecte-t-elle ou partage-t-elle des données utilisateur ? | **Oui** |
| Toutes les données collectées sont-elles chiffrées en transit ? | **Oui** (HTTPS de bout en bout) |
| Fournissez-vous un moyen de demander la suppression des données ? | **Oui** (suppression de compte + email privacy@zopgo.com) |

---

## Types de données collectées

Légende des colonnes Play Console pour chaque type :
- **Collectée** : la donnée quitte l'appareil vers nos serveurs
- **Partagée** : transmise à un tiers (au sens Play : un processeur sous contrat
  n'est PAS « partage », mais Gemini reçoit le contenu des messages → à déclarer)
- **Éphémère** : traitée en mémoire sans stockage
- **Obligatoire / Facultative**
- **Finalité** : raison de la collecte

### Informations personnelles

| Donnée | Collectée | Partagée | Oblig./Fac. | Finalité |
|---|---|---|---|---|
| Adresse e-mail | Oui | Non | Obligatoire | Gestion de compte, authentification |
| Nom | Oui | Non | Obligatoire | Gestion de compte, fonctionnalité de l'app |
| Numéro de téléphone | Oui | Non | Facultative | Mise en relation entre utilisateurs |
| Autres infos (rôle : client/chauffeur/hébergeur) | Oui | Non | Obligatoire | Fonctionnalité de l'app |

### Photos et vidéos

| Donnée | Collectée | Partagée | Oblig./Fac. | Finalité |
|---|---|---|---|---|
| Photos (avatar + photos d'annonces d'hébergement) | Oui | Non | Facultative | Fonctionnalité de l'app |

### Messages

| Donnée | Collectée | Partagée | Oblig./Fac. | Finalité |
|---|---|---|---|---|
| Messages à l'assistant IA | Oui | **Oui** (Google Gemini) | Facultative | Fonctionnalité de l'app (réponses IA) |

> Le « partage » ici = le contenu des messages est transmis à l'API Google Gemini
> pour générer la réponse. À déclarer comme partagé.

### Activité dans l'application

| Donnée | Collectée | Partagée | Oblig./Fac. | Finalité |
|---|---|---|---|---|
| Avis / évaluations (notes + commentaires) | Oui | Non | Facultative | Fonctionnalité de l'app |
| Statut de disponibilité (chauffeur/hébergeur) | Oui | Non | Facultative | Fonctionnalité de l'app |

### Identifiants de l'appareil ou autres

| Donnée | Collectée | Partagée | Oblig./Fac. | Finalité |
|---|---|---|---|---|
| Token de notification push (FCM / Expo) | Oui | **Oui** (Google FCM / Expo) | Facultative | Notifications push |
| Identifiant d'appareil | Oui | Non | Facultative | Diagnostic / dépannage |

---

## Types de données NON collectées (à laisser décochés)

- ❌ **Position géographique** (approx. ou précise) — l'app ne collecte pas la position
- ❌ **Informations financières** — paiements en mode test, aucune donnée de carte/transaction réelle (⚠️ à revoir au passage `PAYMENTS_MODE=live`)
- ❌ **Contacts** — aucun accès au carnet d'adresses
- ❌ **Calendrier**
- ❌ **Historique de navigation / recherche web**
- ❌ **Enregistrements audio / Microphone**
- ❌ **Fichiers et documents** (hors photos sélectionnées manuellement)
- ❌ **Santé et fitness**
- ❌ **Informations sur les SMS ou appels**

---

## Pratiques de sécurité (section dédiée)

| Question | Réponse | Justification |
|---|---|---|
| Les données sont-elles chiffrées en transit ? | **Oui** | HTTPS partout (Clerk, Supabase, Gemini, FCM) |
| L'utilisateur peut-il demander la suppression des données ? | **Oui** | Suppression de compte in-app + email privacy@zopgo.com |
| Engagement envers la politique « Families » ? | Selon ciblage | L'app vise un public général (PEGI 3 / Everyone) |

---

## Récapitulatif des destinataires tiers (pour cohérence avec la privacy policy)

| Tiers | Rôle | Donnée transmise | « Partage » au sens Play ? |
|---|---|---|---|
| Clerk | Processeur (auth) | Email, nom, session | Non (sous-traitant) |
| Supabase | Processeur (BDD/stockage) | Profil, avis, avatar, photos | Non (sous-traitant) |
| Google Gemini | Service IA | Contenu des messages | **Oui** |
| Google FCM | Notifications push (Android) | Token d'appareil | **Oui** |
| Expo Push | Notifications push (iOS) | Token de notification | **Oui** |

---

## Checklist de transcription

- [ ] Section « Personnelles » : email, nom, téléphone, rôle
- [ ] Section « Photos » : avatar + photos d'hébergement
- [ ] Section « Messages » : messages IA → cocher **Partagé**
- [ ] Section « Activité » : avis, disponibilité
- [ ] Section « Identifiants » : token push (Partagé), device ID
- [ ] Bien laisser **Position** et **Infos financières** décochés
- [ ] Sécurité : chiffrement en transit = Oui, suppression = Oui
- [ ] URL de la politique de confidentialité renseignée (voir `DEPLOY_PLAYSTORE.md`)
