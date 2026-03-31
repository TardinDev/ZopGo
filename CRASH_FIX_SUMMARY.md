# 🔧 Résumé des correctifs : Crash au démarrage de l'APK

## ❌ Problème identifié

L'application crashait au démarrage sur les appareils physiques (APK) car **les variables d'environnement du fichier `.env` ne sont pas incluses automatiquement dans les builds APK/AAB**.

### Cause technique

Quand vous buildez un APK/AAB avec Expo/EAS Build :
- ❌ `process.env.EXPO_PUBLIC_*` retourne `undefined` (le fichier `.env` n'existe pas dans le build)
- ❌ Sans la clé Clerk, l'app crash immédiatement au démarrage
- ❌ Sans Supabase URL/clé, impossible de charger les données

## ✅ Corrections appliquées

### 1. Fichiers modifiés

#### `app.json`
Ajout des variables d'environnement dans `extra` pour qu'elles soient accessibles via `Constants.expoConfig.extra` :

```json
"extra": {
  "clerkPublishableKey": "${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}",
  "supabaseUrl": "${EXPO_PUBLIC_SUPABASE_URL}",
  "supabaseAnonKey": "${EXPO_PUBLIC_SUPABASE_ANON_KEY}",
  "geminiApiKey": "${EXPO_PUBLIC_GEMINI_API_KEY}"
}
```

#### `src/app/_layout.tsx`
Utilise maintenant `Constants.expoConfig.extra` en fallback :

```typescript
import Constants from 'expo-constants';

const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  Constants.expoConfig?.extra?.clerkPublishableKey;
```

#### `src/lib/supabase.ts`
Même logique pour Supabase :

```typescript
import Constants from 'expo-constants';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  '';
```

#### `src/lib/gemini.ts`
Même logique pour Gemini AI :

```typescript
import Constants from 'expo-constants';

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  Constants.expoConfig?.extra?.geminiApiKey;
```

#### `eas.json`
Ajout de la section `env` dans chaque profil de build pour charger les variables depuis les secrets EAS.

### 2. Nouveaux fichiers créés

- **`BUILD_GUIDE.md`** : Guide complet pour builder l'APK/AAB correctement
- **`.env.production.example`** : Template des variables pour la production
- **`scripts/setup-eas-secrets.sh`** : Script automatique pour configurer les secrets EAS

## 🚀 Comment builder maintenant

### Méthode recommandée : EAS Build

1. **Configurer les secrets EAS** (une seule fois) :

```bash
# Option 1 : Script automatique
./scripts/setup-eas-secrets.sh

# Option 2 : Manuellement
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
```

2. **Builder l'APK** :

```bash
# APK pour tests
eas build --profile preview --platform android

# AAB pour Google Play
eas build --profile production --platform android
```

3. **Télécharger et installer** :
   - Via le QR code généré par EAS
   - Ou depuis https://expo.dev/accounts/tardin/projects/ZopGo/builds

### Méthode alternative : Build local

```bash
# 1. S'assurer que le fichier .env est bien rempli
# 2. Prebuild
npx expo prebuild

# 3. Build avec Gradle
cd android && ./gradlew assembleRelease

# L'APK sera dans : android/app/build/outputs/apk/release/
```

## ✅ Vérification

Après le build, vérifier que :
1. L'app ne crash pas au démarrage ✅
2. La connexion avec Clerk fonctionne ✅
3. Les données Supabase se chargent ✅
4. L'assistant IA fonctionne (si clé Gemini configurée) ✅

## 📝 Notes importantes

- **Les secrets EAS sont persistants** : une fois configurés, pas besoin de les reconfigurer à chaque build
- **En développement** : continuez à utiliser le fichier `.env` local (fonctionne avec `npx expo start`)
- **En production** : les secrets EAS sont utilisés automatiquement lors du build
- **Sécurité** : Ne jamais committer le fichier `.env` sur Git !

## 🔍 Debugging

Si l'app crash encore :

1. Vérifier les secrets configurés :
```bash
eas secret:list
```

2. Vérifier les logs de build :
```bash
eas build:list
eas build:view [BUILD_ID]
```

3. Vérifier dans le code que `Constants.expoConfig.extra` n'est pas `undefined` :
```typescript
console.log('Extra config:', Constants.expoConfig?.extra);
```

## 📚 Documentation

- Build guide complet : `BUILD_GUIDE.md`
- Variables de production : `.env.production.example`
- Documentation EAS : https://docs.expo.dev/build-reference/variables/
