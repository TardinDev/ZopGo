# ZopGo - Guide de Projet

Plateforme mobile de transport, livraison, hebergement et location de vehicules en Afrique (Gabon).

## Stack Technique

- **Runtime**: Expo SDK 54 (`~54.0.33`), React Native 0.81.5, React 19.1
- **Routing**: Expo Router v6 (file-based, root: `src/app/`)
- **Styling**: NativeWind v4.1 (TailwindCSS 3.4) + `global.css`
- **Auth**: Clerk (`@clerk/clerk-expo` v2.19) - sessions, tokens, email verification
- **State**: Zustand v5 (profil/role local, NOT auth) avec persist (AsyncStorage)
- **Backend**: Supabase (PostgreSQL, Storage, RLS) - `@supabase/supabase-js` v2.95
- **AI**: Google Gemini 2.0 Flash (chat assistant, SSE streaming)
- **Animations**: react-native-reanimated v4.1
- **Date picker**: `@react-native-community/datetimepicker` v8.4 (necessite dev client, pas Expo Go)
- **UI**: expo-linear-gradient, expo-blur, `@expo/vector-icons` (MaterialCommunityIcons)
- **TypeScript**: 5.9 (strict mode)
- **Tests**: Jest 29 + jest-expo

## Variables d'Environnement (.env)

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

Supabase project ref: `kjwlhjhtywzcthhhvptl`

## Architecture des Fichiers

```
src/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root: ClerkProvider + Stack
│   ├── index.tsx                 # Splash: redirect selon isSignedIn
│   ├── onboarding.tsx            # Ecran onboarding
│   ├── auth.tsx                  # Login/Signup (Clerk useSignIn/useSignUp)
│   └── (protected)/              # Routes protegees (auth guard)
│       ├── _layout.tsx           # Guard Clerk + sync Clerk→Zustand + auto-logout 15min
│       └── (tabs)/               # Navigation par onglets (20 fichiers)
│           ├── _layout.tsx       # Tab bar "liquid glass" + role-based visibility
│           ├── index.tsx         # Accueil
│           ├── voyages.tsx       # Recherche voyages (client)
│           ├── trajets.tsx       # Gestion trajets (chauffeur) - DateTimePicker spinner
│           ├── mes-hebergements.tsx  # Gestion hebergements (hebergeur) - toggle dispo + disponibilite
│           ├── hebergements.tsx  # Decouverte hebergements (client)
│           ├── livraisons.tsx    # Commande livraisons (client)
│           ├── location.tsx      # Location vehicules (client)
│           ├── messages.tsx      # Notifications + messages
│           ├── assistant.tsx     # Chat IA (Gemini)
│           ├── profil.tsx        # Profil utilisateur
│           ├── profile-edit.tsx  # Edition profil (hors tab bar)
│           ├── personal-info.tsx # Infos personnelles (hors tab bar)
│           ├── security.tsx      # Securite (hors tab bar)
│           ├── help-support.tsx  # Aide/support (hors tab bar)
│           ├── settings-screen.tsx  # Parametres (hors tab bar)
│           ├── payment-methods.tsx  # Methodes de paiement (hors tab bar)
│           ├── vehicles-edit.tsx    # Edition vehicules (hors tab bar)
│           ├── favorite-addresses.tsx # Adresses favorites (hors tab bar)
│           └── voyage-detail.tsx # Detail voyage (hors tab bar)
│
├── components/                   # 43 composants React Native
│   ├── ErrorBoundary.tsx         # Error boundary global
│   ├── RouteErrorBoundary.tsx    # Error boundary par route
│   ├── SearchBar.tsx
│   ├── chat/                     # ChatScreen, ChatInput, MessageBubble, TypingIndicator, WelcomeMessage
│   ├── home/                     # HomeHeader, HomeActions, StatsCards, ActivityList, WeatherWidget
│   ├── livraisons/               # LivraisonForm, LivraisonHeader, LivreurCard, LivreurList, WaitingView, AcceptedView, NoResponseView
│   ├── location/                 # LocationHeader, LocationSearchBar, LocationFilters, VehicleCard
│   ├── messages/                 # MessageCard, NotificationCard
│   ├── ratings/                  # RatingModal, RatingSummary, ReviewCard, StarRating
│   ├── ui/                       # Card, EmptyState, GradientButton, Skeleton, AnimatedTabScreen, ModeTransition
│   └── voyages/                  # VoyageCard, HebergementCard, TypeFilter, TabSelector, TransportSearchBar, LocationSearchBar, EmptyResults
│
├── stores/                       # Zustand stores (13 stores)
│   ├── authStore.ts              # User auth/profil, setupProfile, logout, setDisponible
│   ├── chatStore.ts              # Chat Gemini avec persistence (50 derniers messages)
│   ├── driversStore.ts           # Chauffeurs connectes
│   ├── voyagesStore.ts           # Recherche voyages (client)
│   ├── trajetsStore.ts           # CRUD trajets (chauffeur)
│   ├── hebergementsStore.ts      # CRUD hebergements (hebergeur) - disponible/disponibilite
│   ├── hebergementsDiscoveryStore.ts  # Decouverte hebergements (client)
│   ├── livraisonsStore.ts        # Etat livraisons
│   ├── locationStore.ts          # Recherche/filtres location vehicules
│   ├── messagesStore.ts          # Notifications + messages
│   ├── ratingsStore.ts           # Avis/evaluations
│   ├── settingsStore.ts          # Vehicules, methodes de paiement, adresses favorites
│   └── index.ts                  # Re-export centralise
│
├── lib/                          # API & services
│   ├── supabase.ts               # Client Supabase + Clerk JWT injection (RLS)
│   ├── supabaseProfile.ts        # CRUD profil (fetchByClerkId, upsert, update)
│   ├── supabaseAvatar.ts         # Upload/delete avatar (Storage, base64)
│   ├── supabaseTrajets.ts        # CRUD trajets + validation
│   ├── supabaseHebergements.ts   # CRUD hebergements (avec disponibilite + status)
│   ├── supabaseNotifications.ts  # Push token, preferences
│   └── gemini.ts                 # Gemini API (streaming SSE + fallback, rate limit 14/min)
│
├── hooks/
│   ├── useNetworkStatus.ts       # Verification connectivite
│   ├── usePushNotifications.ts   # Enregistrement push + listeners
│   └── useTabAnimation.tsx       # Animation transitions tabs
│
├── constants/                    # colors.ts, layout.ts, timeouts.ts, animations.ts
├── data/                         # Donnees statiques/demo (vehicles, voyages, user)
├── types/                        # Types TypeScript (index.ts)
└── utils/
    ├── errorHandler.ts           # handleError, logError, isNetworkError
    ├── tokenCache.ts             # Cache Clerk token (expo-secure-store)
    └── validation.ts             # sanitizeInput, validateName/City/Price/Places/Email/Phone/Amount
```

## Roles Utilisateur

3 roles avec tabs differents :

| Role | Tabs visibles |
|------|--------------|
| **client** | Accueil, Voyages, Livraisons, Location, Hebergements, Messages, Assistant, Profil |
| **chauffeur** | Accueil, Mes trajets, Messages, Assistant, Profil |
| **hebergeur** | Accueil, Mes logements, Messages, Assistant, Profil |

Le role est stocke dans `clerkUser.unsafeMetadata.role` et synchronise dans Zustand.

## Flux d'Authentification

1. `index.tsx` (splash): verifie `useAuth().isSignedIn`
2. Non connecte → `/onboarding` → `/auth` (Clerk `useSignIn`/`useSignUp`)
3. Inscription = email + verification par code (`email_code` strategy)
4. Apres auth: `setupProfile()` (Zustand) → navigation vers `/(protected)/(tabs)`
5. `(protected)/_layout.tsx`: guard `useAuth()` + `<Redirect href="/auth" />`
6. Sync Clerk→Zustand au restart (si session Clerk active mais Zustand vide)
7. Logout: `signOut()` (Clerk) + `logout()` (Zustand) + `router.replace('/auth')`
8. Auto-logout apres 15min en background

## Integration Supabase

- **Clerk JWT → Supabase RLS**: `setClerkTokenProvider()` dans `(protected)/_layout.tsx` injecte le token Clerk dans chaque requete Supabase via `global.fetch` override
- **Tables**: `profiles`, `trajets`, `hebergements`, `notifications`
- **Colonnes hebergements**: `id`, `hebergeur_id`, `nom`, `type`, `ville`, `adresse`, `prix_par_nuit`, `capacite`, `description`, `status` ('actif'/'inactif'), `disponibilite` (integer, default 1), `created_at`
- **Storage**: bucket `avatars` (upload via base64, pas fetch+blob - ne marche pas en React Native)
- **Validation**: toutes les insertions passent par `sanitizeInput()`, `validateCity()`, `validatePrice()`, `validatePlaces()`

### Migrations Supabase

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_notifications_trajets.sql
├── 003_fix_rls_and_fk.sql
├── 004_security_hardening.sql
├── 005_push_notifications.sql
├── 006_admin_rls.sql
├── 007_hebergements_rls.sql
├── 008_storage_avatars.sql
├── 009_hebergements_disponibilite.sql    # ALTER TABLE hebergements ADD COLUMN disponibilite
└── apply_all_missing.sql                  # Helper pour appliquer les migrations manquantes
```

Pour appliquer: `npx supabase login` → `npx supabase link --project-ref kjwlhjhtywzcthhhvptl` → `npx supabase db push`

## Patterns Optimistic Update

Les stores `trajetsStore`, `hebergementsStore` utilisent le pattern optimistic:
1. Mise a jour locale immediate
2. Appel Supabase en async
3. Rollback en cas d'erreur (restauration de l'etat precedent)
4. Remplacement de l'ID local par l'ID Supabase en cas de succes

## Fonctionnalites Cles

### Date picker trajets (`trajets.tsx`)
- `DateTimePicker` de `@react-native-community/datetimepicker` avec `display="spinner"`
- iOS: `mode="datetime"` inline + bouton "Valider"
- Android: `mode="date"` puis `mode="time"` en sequence
- `minimumDate={new Date()}` pour empecher les dates passees
- Format affichage: `DD/MM/YYYY a HHhMM`

### Disponibilite hebergements (`mes-hebergements.tsx`)
- `Switch` toggle disponible/indisponible (vert/rouge)
- `TextInput` numerique "Nombre de disponibilites" (visible si disponible)
- `formData.disponible` (boolean) mappe vers `status` ('actif'/'inactif')
- `formData.disponibilite` (string) mappe vers entier pour Supabase

## Gotchas Connus

- **LinearGradient + NativeWind**: `className="flex-1"` ne fonctionne PAS sur `LinearGradient`. Toujours utiliser `style={{ flex: 1 }}` pour les props de layout
- **Avatar upload**: Utiliser `FileSystem.readAsStringAsync` + `base64-arraybuffer` (pas `fetch` + `blob` qui crash en React Native)
- **Path alias**: `~/*` mappe vers `src/*` (configure dans `tsconfig.json` et `jest.config.js`)
- **DateTimePicker**: necessite un dev client (Expo Go ne supporte pas les modules natifs custom)
- **TypeScript pre-existing errors**: le dossier `admin-ZopGo/` a des erreurs TS qui ne concernent pas l'app mobile. `npx tsc --noEmit` montrera ces erreurs, filtrer avec `grep -v admin-ZopGo`

## Design System

- **Couleur primaire**: `#2162FE`
- **Couleur hebergements**: `#8B5CF6` (violet)
- **Tab bar**: "Liquid Glass" (BlurView + LinearGradient + border)
- **Constantes**: `src/constants/colors.ts` (COLORS object avec gradients, gray scale, status colors)
- **Icons**: `@expo/vector-icons` (MaterialCommunityIcons)

## Tests

```bash
npm test              # Lancer les tests (319 tests, 18 suites)
npm run test:watch    # Mode watch
npm run test:coverage # Avec couverture
```

- **Config**: `jest.config.js` (preset `jest-expo`, roots `src/`, alias `~/`)
- **Setup**: `jest.setup.js` (mocks: AsyncStorage, expo-secure-store, expo-network, expo-notifications, expo-device, datetimepicker, supabase, supabaseProfile, supabaseNotifications, supabaseTrajets, supabaseHebergements, supabaseAvatar)
- **Pattern stores**: `useStore.setState()` pour reset dans `beforeEach`, `useStore.getState()` pour assertions
- **Pattern libs**: `jest.unmock()` le module teste, mock `supabase.from` avec un chain thenable

### Structure des tests
```
src/
├── stores/__tests__/   # 11 fichiers (authStore, chatStore, driversStore, voyagesStore, trajetsStore, hebergementsStore, hebergementsDiscoveryStore, livraisonsStore, locationStore, ratingsStore, messagesStore)
├── lib/__tests__/      # 3 fichiers (gemini, supabaseTrajets, supabaseHebergements)
├── hooks/__tests__/    # 1 fichier (useNetworkStatus)
└── utils/__tests__/    # 3 fichiers (validation, errorHandler, tokenCache)
```

## Scripts

```bash
npm start             # Expo dev server
npm run android       # Run Android
npm run ios           # Run iOS
npm run web           # Run Web
npm run typecheck     # TypeScript check
npm run lint          # ESLint + Prettier check
npm run format        # Auto-fix lint + format
```
