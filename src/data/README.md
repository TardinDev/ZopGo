# Structure des Données - ZopGo

Ce dossier contient toutes les données statiques utilisées dans l'application ZopGo. Les données sont organisées par domaine fonctionnel pour faciliter la maintenance et la réutilisation.

## Organisation des fichiers

### 📁 Types (`/src/types/index.ts`)
Contient toutes les interfaces TypeScript pour typer les données de l'application :
- `Voyage` - Type pour les voyages/trajets
- `Hebergement` - Type pour les hébergements
- `UserInfo` - Type pour les informations utilisateur
- `MenuItem` - Type pour les éléments de menu
- `Stat` - Type pour les statistiques
- `Activity` - Type pour les activités récentes

### 📁 Données (`/src/data/`)

#### `voyages.ts`
Données liées aux voyages et hébergements :
- `voyages[]` - Liste de tous les voyages disponibles (bus, train, avion, bateau, voiture)
- `hebergements[]` - Liste de tous les hébergements disponibles (hôtels, auberges)
- `transportTypes[]` - Types de transport pour le filtrage
- `hebergementTypes[]` - Types d'hébergement pour le filtrage

#### `user.ts`
Données liées à l'utilisateur :
- `userInfo` - Informations de profil de l'utilisateur (nom, email, téléphone, avatar, statistiques)
- `menuItems[]` - Menu des paramètres du profil

#### `home.ts`
Données liées à la page d'accueil :
- `stats[]` - Statistiques affichées en haut de la page (gains, courses, note)
- `generateActivities(count)` - Fonction pour générer les activités récentes
- `weatherInfo` - Informations météo affichées

#### `index.ts`
Fichier d'export centralisé qui réexporte toutes les données des autres fichiers.

## Utilisation

### Import des données

```typescript
// Import depuis le fichier centralisé
import { voyages, hebergements, userInfo, stats } from '@/data';

// Ou import direct depuis un fichier spécifique
import { voyages } from '@/data/voyages';
```

### Import des types

```typescript
import { Voyage, UserInfo, Activity } from '@/types';
```

## Ajout de nouvelles données

Pour ajouter de nouvelles données :

1. **Créer le type TypeScript** dans `/src/types/index.ts`
2. **Créer le fichier de données** dans `/src/data/` (ex: `messages.ts`)
3. **Exporter depuis index.ts** : Ajouter `export * from './messages';`
4. **Utiliser dans les composants** : `import { messages } from '@/data';`

## Exemple d'ajout

```typescript
// 1. Dans /src/types/index.ts
export interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
}

// 2. Dans /src/data/messages.ts
import { Message } from '../types';

export const messages: Message[] = [
  { id: 1, sender: 'Pierre', content: 'Bonjour', timestamp: '10:30' },
  // ...
];

// 3. Dans /src/data/index.ts
export * from './messages';

// 4. Dans votre composant
import { messages } from '@/data';
```

## Avantages de cette structure

✅ **Centralisation** : Toutes les données au même endroit
✅ **Typage fort** : TypeScript garantit la cohérence des données
✅ **Réutilisabilité** : Les données peuvent être partagées entre composants
✅ **Maintenabilité** : Facile à mettre à jour et à modifier
✅ **Testabilité** : Données mockées facilement accessibles pour les tests
✅ **Séparation des préoccupations** : La logique de présentation est séparée des données
