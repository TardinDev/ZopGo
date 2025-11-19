# 📱 ZopGo - Architecture du Code Source

## 🏗️ Structure du Projet

```
src/
├── app/                    # Routes Expo Router
│   ├── (protected)/       # Routes protégées
│   │   ├── (tabs)/       # Navigation par tabs
│   │   │   ├── index.tsx          # 🏠 Accueil
│   │   │   ├── voyages.tsx        # 🚗 Voyages & Hébergements
│   │   │   ├── livraisons.tsx     # 📦 Livraisons
│   │   │   ├── messages.tsx       # 💬 Messages
│   │   │   ├── profil.tsx         # 👤 Profil
│   │   │   └── _layout.tsx        # Layout tabs
│   │   ├── course/        # Écrans de course
│   │   ├── delivery/      # Écrans de livraison
│   │   ├── message/       # Écrans de messages
│   │   └── _layout.tsx    # Layout protected
│   ├── auth/              # Authentification
│   └── _layout.tsx        # Root layout
│
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base
│   │   ├── Card.tsx      # Cartes (3 variants)
│   │   ├── GradientButton.tsx # Boutons gradient
│   │   ├── EmptyState.tsx # États vides
│   │   ├── Skeleton.tsx  # Loading states
│   │   └── index.ts      # Export centralisé
│   ├── ErrorBoundary.tsx # Error boundary global
│   └── SearchBar.tsx     # Barre de recherche
│
├── constants/            # Constantes de l'application
│   ├── colors.ts        # 30+ couleurs
│   ├── layout.ts        # Espacements, ombres
│   ├── timeouts.ts      # Délais/timeouts
│   ├── animations.ts    # Configs animations
│   └── index.ts         # Export centralisé
│
├── data/                # Données statiques
│   ├── voyages.ts      # Voyages & hébergements
│   ├── user.ts         # Utilisateur & menu
│   ├── home.ts         # Page d'accueil
│   ├── livreurs.ts     # Livreurs
│   ├── index.ts        # Export centralisé
│   └── README.md       # Documentation
│
├── types/              # Types TypeScript
│   └── index.ts       # Toutes les interfaces
│
└── utils/             # Utilitaires
    ├── validation.ts  # Validation inputs
    └── errorHandler.ts # Gestion erreurs
```

---

## 📦 Modules Principaux

### 1. Constants (`/constants`)

**Usage:**
```typescript
import { COLORS, LAYOUT, TIMEOUTS, SPRING_CONFIG } from '@/constants';

// Couleurs
<View style={{ backgroundColor: COLORS.primary }} />
colors={COLORS.gradients.blue}

// Layout
paddingHorizontal: LAYOUT.spacing.lg
borderRadius: LAYOUT.borderRadius.large
iconSize: LAYOUT.iconSize.medium

// Timeouts
setTimeout(() => {}, TIMEOUTS.DELIVERY_ACCEPTANCE);

// Animations
withSpring(value, SPRING_CONFIG.default)
```

---

### 2. Components (`/components`)

#### UI Components (`/components/ui`)

**Card**
```typescript
import { Card } from '@/components/ui';

<Card variant="elevated">
  <Text>Contenu</Text>
</Card>

// Variants: 'default' | 'elevated' | 'outlined'
```

**GradientButton**
```typescript
import { GradientButton } from '@/components/ui';

<GradientButton
  title="Titre"
  subtitle="Sous-titre"
  icon="🚕"
  colors={COLORS.gradients.blue}
  onPress={() => {}}
/>
```

**EmptyState**
```typescript
import { EmptyState } from '@/components/ui';

<EmptyState
  icon="search-outline"
  title="Aucun résultat"
  description="Essayez une autre recherche"
/>
```

**Skeleton**
```typescript
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui';

{isLoading ? (
  <SkeletonList count={3} />
) : (
  <DataList />
)}
```

#### Error Boundary

```typescript
import { ErrorBoundary } from '@/components';

// Dans _layout.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

### 3. Data (`/data`)

**Voyages & Hébergements**
```typescript
import { voyages, hebergements, transportTypes } from '@/data';

const allVoyages = voyages;
const hotels = hebergements.filter(h => h.type === 'Hôtel');
```

**User Data**
```typescript
import { userInfo, menuItems } from '@/data';

<Text>{userInfo.name}</Text>
{menuItems.map(item => ...)}
```

**Home Data**
```typescript
import { stats, generateActivities, weatherInfo } from '@/data';

const activities = generateActivities(10);
<Text>{weatherInfo.temperature}</Text>
```

**Livreurs**
```typescript
import {
  livreurs,
  getSortedLivreursByDistance,
  getAvailableLivreurs,
  getLivreurById
} from '@/data';

const sortedLivreurs = getSortedLivreursByDistance();
const available = getAvailableLivreurs();
const livreur = getLivreurById(1);
```

---

### 4. Utils (`/utils`)

**Validation**
```typescript
import {
  validateLocation,
  sanitizeInput,
  validateEmail,
  validatePhone,
  formatPhone
} from '@/utils/validation';

if (validateLocation(location)) {
  const clean = sanitizeInput(location);
  // ...
}
```

**Error Handling**
```typescript
import { handleError, logError, isNetworkError } from '@/utils/errorHandler';

try {
  // code risqué
} catch (error) {
  const { displayMessage } = handleError(error, 'ComponentName');
  Alert.alert('Erreur', displayMessage);
}
```

---

## 🎯 Patterns & Best Practices

### 1. Import des Constantes

**❌ Mauvais**
```typescript
colors={['#3B82F6', '#2563EB']}
setTimeout(() => {}, 300000);
```

**✅ Bon**
```typescript
import { COLORS, TIMEOUTS } from '@/constants';

colors={COLORS.gradients.blue}
setTimeout(() => {}, TIMEOUTS.DELIVERY_ACCEPTANCE);
```

---

### 2. Gestion d'État

**❌ Mauvais - Fuite mémoire**
```typescript
const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
```

**✅ Bon - Utiliser useRef**
```typescript
const timeoutRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);
```

---

### 3. Performance - useMemo

**❌ Mauvais - Recalcul à chaque render**
```typescript
const filtered = data.filter(item => item.available);
```

**✅ Bon - Mémoïsation**
```typescript
const filtered = useMemo(
  () => data.filter(item => item.available),
  [data]
);
```

---

### 4. Validation d'Entrées

**❌ Mauvais - Pas de validation**
```typescript
const handleSearch = () => {
  if (location) {
    search(location);
  }
};
```

**✅ Bon - Validation + sanitization**
```typescript
import { validateLocation, sanitizeInput } from '@/utils/validation';

const handleSearch = () => {
  const clean = sanitizeInput(location);
  if (validateLocation(clean)) {
    search(clean);
  } else {
    Alert.alert('Erreur', 'Adresse invalide');
  }
};
```

---

### 5. Gestion d'Erreurs

**❌ Mauvais - console.log**
```typescript
catch (error) {
  console.log(error);
}
```

**✅ Bon - Gestion centralisée**
```typescript
import { handleError } from '@/utils/errorHandler';

catch (error) {
  const { displayMessage } = handleError(error, 'SearchComponent');
  Alert.alert('Erreur', displayMessage);
}
```

---

## 🚀 Quick Start

### Démarrer le projet
```bash
npm start
```

### Linter
```bash
npm run lint
```

### Format
```bash
npm run format
```

---

## 📚 Documentation Complète

- **`/src/data/README.md`** - Guide des données
- **`/IMPROVEMENTS_IMPLEMENTED.md`** - Détails des améliorations
- **`/REFACTORING.md`** - Refactoring précédent

---

## 💡 Tips

1. **Toujours importer depuis les index**: `from '@/constants'` au lieu de `from '@/constants/colors'`
2. **Utiliser les composants UI**: Moins de duplication, cohérence visuelle
3. **Valider les inputs**: Sécurité et UX
4. **Gérer les erreurs**: Utiliser handleError() partout
5. **Mémoïser**: useMemo pour calculs, useCallback pour fonctions
6. **Types TypeScript**: Toujours typer les props et states

---

## 🎨 Palette de Couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| Primary | `#2162FE` | Boutons principaux, liens |
| Secondary | `#4facfe` | Accents secondaires |
| Yellow | `#FFDD5C` | Arrière-plans, highlights |
| Orange | `#F59E0B` | Livraisons, alertes warning |
| Success | `#10B981` | États success |
| Error | `#EF4444` | Erreurs |

---

## 🔧 Maintenance

### Ajouter une nouvelle couleur
1. Ouvrir `/src/constants/colors.ts`
2. Ajouter dans l'objet `COLORS`
3. Utiliser partout: `COLORS.maNouvelleCouleur`

### Ajouter un nouveau composant UI
1. Créer dans `/src/components/ui/NomComposant.tsx`
2. Exporter depuis `/src/components/ui/index.ts`
3. Utiliser: `import { NomComposant } from '@/components/ui'`

### Ajouter de nouvelles données
1. Créer le type dans `/src/types/index.ts`
2. Créer le fichier dans `/src/data/nouvelles-donnees.ts`
3. Exporter depuis `/src/data/index.ts`
4. Utiliser: `import { nouvellesDonnees } from '@/data'`

---

**Dernière mise à jour**: 19 Novembre 2025
**Version**: 2.0.0 (Post-Refactoring)
