# Politique de Confidentialité — ZopGo

**Dernière mise à jour :** 15 mars 2026

ZopGo est une application mobile de mise en relation entre clients, transporteurs et hébergeurs. La présente politique de confidentialité décrit les données que nous collectons, comment nous les utilisons et les droits dont vous disposez.

---

## 1. Données collectées

### Données de compte
- **Email** : utilisé pour l'authentification et les communications
- **Nom et prénom** : affichés dans votre profil
- **Numéro de téléphone** : facultatif, utilisé pour la mise en relation
- **Rôle** : client, transporteur ou hébergeur
- **Photo de profil (avatar)** : facultative, stockée sur nos serveurs

### Données d'utilisation
- **Évaluations et avis** : notes et commentaires laissés sur les prestations
- **Statut de disponibilité** : pour les transporteurs et hébergeurs
- **Conversations avec l'assistant IA** : messages envoyés à l'assistant intégré

### Données techniques
- **Tokens de notifications push** : pour l'envoi de notifications
- **Identifiant d'appareil** : pour le diagnostic d'erreurs (via Sentry)

## 2. Données NON collectées

- **Localisation** : ZopGo ne collecte pas votre position géographique
- **Contacts** : aucun accès à votre carnet d'adresses
- **Caméra/Microphone** : aucun accès direct (sauf sélection manuelle de photo de profil)

## 3. Services tiers

Nous utilisons les services tiers suivants, chacun ayant sa propre politique de confidentialité :

| Service | Usage | Données partagées |
|---------|-------|-------------------|
| [Clerk](https://clerk.com/privacy) | Authentification | Email, nom, session |
| [Supabase](https://supabase.com/privacy) | Base de données et stockage | Profil, évaluations, avatar |
| [Google Gemini](https://ai.google.dev/terms) | Assistant IA | Messages de conversation |
| [Sentry](https://sentry.io/privacy/) | Suivi d'erreurs | Données techniques, stack traces |
| [Expo Push](https://expo.dev/privacy) | Notifications push | Token de notification |

## 4. Stockage local

L'application stocke localement sur votre appareil :
- **SecureStore** (chiffré) : tokens d'authentification Clerk
- **AsyncStorage** : préférences utilisateur et cache de données

Ces données ne quittent jamais votre appareil sauf pour l'authentification.

## 5. Notifications push

ZopGo utilise Expo Push Notifications pour vous envoyer des notifications. Un token unique est généré pour votre appareil et stocké sur nos serveurs. Vous pouvez désactiver les notifications dans les paramètres de votre appareil à tout moment.

## 6. Assistant IA

L'assistant IA intégré utilise l'API Google Gemini. Les messages que vous envoyez à l'assistant sont transmis à Google pour générer les réponses. Google peut traiter ces données conformément à ses conditions d'utilisation. Ne partagez pas d'informations personnelles sensibles avec l'assistant.

## 7. Sécurité

- Les tokens d'authentification sont stockés de manière chiffrée (SecureStore)
- Les communications avec nos serveurs sont chiffrées (HTTPS)
- L'accès aux données est restreint par rôle et authentification

## 8. Vos droits

Conformément à la réglementation applicable, vous disposez des droits suivants :
- **Accès** : obtenir une copie de vos données personnelles
- **Rectification** : corriger vos données via les paramètres de votre profil
- **Suppression** : demander la suppression de votre compte et de vos données
- **Opposition** : vous opposer au traitement de vos données

Pour exercer ces droits, contactez-nous à l'adresse indiquée ci-dessous.

## 9. Modifications

Nous pouvons mettre à jour cette politique de confidentialité. Les modifications seront publiées dans l'application et sur notre page de store. La date de dernière mise à jour est indiquée en haut de ce document.

## 10. Contact

Pour toute question relative à la protection de vos données :

- **Email** : privacy@zopgo.com
- **Application** : section Paramètres > Aide & Contact
