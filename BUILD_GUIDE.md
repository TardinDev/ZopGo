# Guide de Build APK/AAB pour ZopGo

## 🚨 Important : Variables d'environnement

L'application **crashera au démarrage** si les variables d'environnement ne sont pas correctement configurées lors du build !

## Prérequis

1. **Fichier `.env` configuré localement** (pour le développement)
2. **Compte EAS Build configuré** : `eas login`
3. **Variables secrets configurées sur EAS** (pour les builds)

## Configuration des secrets EAS

Avant de builder, vous DEVEZ configurer les secrets sur EAS :

```bash
# 1. Clerk Authentication (OBLIGATOIRE - l'app crashe sans cette clé)
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_VOTRE_CLE_ICI"

# 2. Supabase (OBLIGATOIRE)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://votre-projet.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "votre_cle_anon_ici"

# 3. Google Gemini (Optionnel - pour l'assistant IA)
eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value "votre_cle_gemini_ici"
```

### Vérifier les secrets configurés

```bash
eas secret:list
```

### Mettre à jour un secret existant

```bash
eas secret:delete --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "nouvelle_valeur"
```

## Builds

### Build Preview (APK pour tests)

Build APK pour tester sur des appareils physiques :

```bash
eas build --profile preview --platform android
```

### Build Production (AAB pour Google Play)

Build AAB pour publication sur Google Play Store :

```bash
eas build --profile production --platform android
```

### Build iOS

```bash
eas build --profile production --platform ios
```

## Télécharger l'APK/AAB

Après le build :

1. Allez sur https://expo.dev/accounts/tardin/projects/ZopGo/builds
2. Téléchargez l'APK/AAB depuis l'interface web
3. Ou utilisez : `eas build:list`

## Installation APK sur téléphone

### Via USB (ADB)

```bash
adb install chemin/vers/votre.apk
```

### Via QR Code

EAS Build génère un QR code pour télécharger l'APK directement sur le téléphone.

## ⚠️ Problèmes courants

### L'app crash au démarrage

**Cause** : Variables d'environnement manquantes

**Solution** :
1. Vérifiez que les secrets EAS sont configurés : `eas secret:list`
2. Vérifiez que `eas.json` contient bien les variables d'environnement
3. Rebuild l'APK après avoir configuré les secrets

### "Configuration manquante" au démarrage

**Cause** : La clé Clerk n'est pas trouvée

**Solution** :
1. Configurez le secret : `eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_..."`
2. Rebuild

### Variables d'environnement non prises en compte

**Cause** : Les variables doivent être dans `eas.json` ET configurées comme secrets EAS

**Solution** :
- Vérifiez `eas.json` : les variables sont déclarées dans la section `env`
- Configurez les secrets EAS comme indiqué ci-dessus
- Les variables avec valeur vide (`""`) dans `eas.json` seront remplies par les secrets EAS

## Architecture technique

L'app utilise deux méthodes pour accéder aux variables d'environnement :

1. **En développement** : `process.env.EXPO_PUBLIC_*` (depuis `.env`)
2. **En production (APK/AAB)** : `Constants.expoConfig.extra.*` (depuis `app.json`)

Les fichiers suivants gèrent cette logique :
- `src/app/_layout.tsx` - Clerk configuration
- `src/lib/supabase.ts` - Supabase configuration
- `src/lib/gemini.ts` - Gemini AI configuration

## Mode de build local (sans EAS)

Si vous voulez builder localement (sans EAS Build) :

```bash
# 1. Créer le build natif
npx expo prebuild

# 2. Builder avec Android Studio ou Gradle
cd android && ./gradlew assembleRelease

# L'APK sera dans : android/app/build/outputs/apk/release/app-release.apk
```

⚠️ **Attention** : Le build local nécessite :
- Android Studio installé
- SDK Android configuré
- Variables d'environnement dans le fichier `.env` à la racine du projet

## Support

Pour tout problème de build, consultez :
- Documentation Expo : https://docs.expo.dev/build/introduction/
- Documentation EAS Build : https://docs.expo.dev/build-reference/variables/
