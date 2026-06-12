# Déploiement Play Store — ZopGo

Guide opérationnel de bout en bout. Coche les cases dans l'ordre.

Statut au moment de la rédaction :
- ✅ Code : 961/961 tests, typecheck clean, lint clean
- ✅ Sécurité : CVE Clerk corrigée, aucun secret fuité
- ✅ Push : pipeline FCM déployé et configuré (secret `GOOGLE_SERVICE_ACCOUNT` OK)
- ✅ Assets : icône 512, feature graphic, listing, privacy policy, data safety
- ⚠️ Reste : **screenshots**, **hébergement de la privacy policy**, **build/submit**

---

## Étape 1 — Screenshots (la seule étape qui demande un device)

Play Store exige **2 à 8 captures** par type de téléphone. Format accepté :
PNG/JPEG, ratio 9:16 (portrait), entre 320 px et 3840 px de côté.

### Comment capturer
1. Installe le build (APK preview existant ou un nouveau) sur un téléphone Android
   ou un émulateur (`Pixel 6`, résolution 1080×2400 = parfait).
2. Connecte-toi avec un compte de démo qui a des données (trajets, hébergements,
   messages, avis) pour que les écrans soient « pleins ».
3. Capture **au moins 4 écrans** parmi les plus vendeurs :
   - Accueil (`index.tsx`) — vue d'ensemble
   - Découverte hébergements (`hebergements.tsx`) — cartes + filtres
   - Recherche voyages / trajets (`voyages.tsx`)
   - Détail d'un hébergement avec photos + avis
   - Assistant IA (`assistant.tsx`) — argument différenciant
   - Messages / notifications (`messages.tsx`)

### Capture via émulateur (rapide)
```bash
# bouton appareil photo dans la barre latérale de l'émulateur, OU :
adb exec-out screencap -p > screenshot_01_accueil.png
```

Range-les dans `assets/store/screenshots/` (à créer). Tu les uploades ensuite
manuellement dans Play Console → Fiche du Store principale.

---

## Étape 2 — Héberger la politique de confidentialité (URL publique requise)

Play Console exige une **URL** (pas un fichier). Trois options simples :

| Option | Effort | Comment |
|---|---|---|
| **GitHub Pages** (recommandé) | 5 min | Pousser `PRIVACY_POLICY.md` dans un repo public + activer Pages, ou utiliser un Gist rendu via htmlpreview |
| Notion / Google Sites | 5 min | Coller le contenu, publier, copier l'URL |
| Page sur ton domaine | variable | `https://zopgo.com/privacy` |

> L'email de contact `privacy@zopgo.com` doit être **fonctionnel** (Play envoie
> parfois des vérifications). Si la boîte n'existe pas encore, créer un alias.

URL finale à renseigner dans : Play Console → Contenu de l'application →
Politique de confidentialité.

---

## Étape 3 — Remplir Data Safety + Content Rating

- **Data Safety** : transcrire `DATA_SAFETY.md` (réponses prêtes).
- **Content Rating** : questionnaire IARC → voir `STORE_LISTING.md`
  (PEGI 3 / Everyone attendu, aucun contenu sensible).

---

## Étape 4 — Fiche du Store

Copier depuis `STORE_LISTING.md` :
- Titre, description courte (80 car.), description longue (4000 car.)
- Catégorie : Voyages et infos locales
- Mots-clés / tags
- Upload icône 512×512 + feature graphic 1024×500 + screenshots

---

## Étape 5 — Build de production (.aab)

```bash
# depuis la racine du projet, avec ton compte Expo connecté
eas build --profile production --platform android
```

Le profil `production` (eas.json) produit un **app-bundle .aab** avec
`autoIncrement` du versionCode — c'est le format requis par le Play Store.

> ⚠️ Confirmation requise avant de lancer (règle projet : jamais de `eas build`
> sans feu vert). C'est la **première** soumission (versionCode 1).

### Clé de signature
EAS gère la clé de signature (keystore `e1Q7HjKE_X` déjà utilisé pour les
builds preview). Au premier upload, activer **Play App Signing** (Google gère
la clé d'app, EAS garde la clé d'upload). Ne perds pas l'accès à ce keystore EAS.

---

## Étape 6 — Soumission

Deux voies :

**A. Manuelle (recommandée pour la 1re fois)**
Télécharge le `.aab` depuis le dashboard Expo, puis upload dans
Play Console → Production (ou Tests fermés d'abord).

**B. Automatisée via EAS Submit**
```bash
eas submit --profile production --platform android
```
Nécessite un **service account Google Play** (JSON) configuré dans EAS.
Le bloc `submit.production` de `eas.json` est actuellement vide → à compléter
avec le chemin du service account si tu choisis cette voie.

> Conseil : commencer par un **canal de test fermé** (closed testing) avec
> quelques testeurs avant la prod, pour valider la livraison réelle des
> notifications push sur le build store-signed.

---

## Récap des fichiers de préparation

| Fichier | Contenu |
|---|---|
| `STORE_LISTING.md` | Titre, descriptions, catégorie, content rating, mots-clés |
| `PRIVACY_POLICY.md` | Politique de confidentialité (à héberger) |
| `DATA_SAFETY.md` | Réponses prêtes pour le formulaire Sécurité des données |
| `DEPLOY_PLAYSTORE.md` | Ce guide |

## Checklist finale avant « Envoyer pour examen »

- [ ] Screenshots (≥ 2) uploadés
- [ ] Feature graphic + icône 512 uploadés
- [ ] URL privacy policy renseignée et accessible publiquement
- [ ] Email de contact fonctionnel
- [ ] Data Safety rempli (cf. `DATA_SAFETY.md`)
- [ ] Content Rating obtenu
- [ ] Build `.aab` production uploadé
- [ ] Play App Signing activé
- [ ] (recommandé) Test fermé validé : push reçue sur build store-signed
