# ZopGo

Une application mobile moderne de covoiturage et de transport au Gabon, développée avec React Native et Expo.

## À propos

ZopGo est une plateforme de mobilité qui connecte les voyageurs avec différents modes de transport (bus, voiture, bateau, avion) à travers le Gabon. L'application offre une expérience utilisateur fluide avec une interface moderne et intuitive.

## Fonctionnalités

- **Recherche de voyages** : Trouvez facilement des trajets entre différentes villes du Gabon
- **Filtres de transport** : Filtrez par type de transport (Bus, Voiture, Bateau, Avion)
- **Interface moderne** : Design "Liquid Glass" avec effets de flou et dégradés
- **Navigation intuitive** : Tab bar flottante avec animations fluides
- **Gestion de profil** : Créez et modifiez votre profil utilisateur
- **Messagerie** : Communiquez avec les autres utilisateurs
- **Livraisons** : Suivez vos colis et livraisons

## Technologies utilisées

### Core
- **React Native** 0.81.4
- **Expo** ~54.0.0
- **React** 19.1.0
- **Expo Router** ~6.0.4 - Navigation file-based

### UI & Styling
- **NativeWind** (Tailwind CSS pour React Native)
- **Expo Linear Gradient** - Dégradés
- **Expo Blur** - Effets de flou "Liquid Glass"
- **@expo/vector-icons** - Iconographie

### Navigation & Gestures
- **React Navigation** ^7.0.3
- **React Native Gesture Handler** ~2.28.0
- **React Native Reanimated** ~4.1.0
- **React Native Screens** ~4.16.0

### Maps
- **React Native Maps** ^1.20.1

### Development
- **TypeScript** ~5.9.2
- **ESLint** avec configuration Expo
- **Prettier** avec plugin Tailwind CSS

## Structure du projet

```
ZopGo/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Écrans d'authentification
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (protected)/     # Écrans protégés (après connexion)
│   │   │   └── (tabs)/      # Navigation par onglets
│   │   │       ├── index.tsx       # Accueil
│   │   │       ├── voyages.tsx     # Recherche de voyages
│   │   │       ├── livraisons.tsx  # Livraisons
│   │   │       ├── messages.tsx    # Messagerie
│   │   │       ├── profil.tsx      # Profil utilisateur
│   │   │       ├── voyage-detail.tsx
│   │   │       ├── profile-edit.tsx
│   │   │       └── _layout.tsx
│   │   └── index.tsx        # Point d'entrée
│   └── components/          # Composants réutilisables
├── assets/                  # Images et ressources
├── app.json                # Configuration Expo
└── package.json
```

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI
- iOS Simulator (pour macOS) ou Android Emulator

### Étapes d'installation

1. Clonez le repository :
```bash
git clone https://github.com/TardinDev/ZopGo.git
cd ZopGo
```

2. Installez les dépendances :
```bash
npm install
```

3. Démarrez le serveur de développement :
```bash
npm start
```

4. Lancez l'application :
   - Pour iOS : `npm run ios`
   - Pour Android : `npm run android`
   - Pour Web : `npm run web`

## Scripts disponibles

- `npm start` - Démarre le serveur Expo
- `npm run android` - Lance l'app sur Android
- `npm run ios` - Lance l'app sur iOS
- `npm run web` - Lance l'app sur navigateur web
- `npm run lint` - Vérifie le code avec ESLint et Prettier
- `npm run format` - Formate automatiquement le code
- `npm run prebuild` - Prépare les builds natifs

## Configuration

L'application utilise :
- **Expo Router** pour la navigation file-based
- **NativeWind** pour le styling avec Tailwind CSS
- **TypeScript** avec typed routes pour la sécurité des types

## Design System

### Couleurs principales
- Bleu primaire : `#2162FE`
- Dégradés : `#4facfe` → `#00f2fe`
- Gris : `#6B7280`

### Effets spéciaux
- **Liquid Glass** : Effet de verre liquide avec blur natif
- **Tab Bar flottante** : Capsule arrondie avec ombre douce
- **Animations fluides** : Reanimated pour des transitions naturelles

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## Licence

Ce projet est privé et destiné à un usage commercial.

## Contact

Pour toute question ou suggestion, contactez l'équipe ZopGo.

### Auteur

**Davy Tardin**

[![GitHub](https://img.shields.io/badge/GitHub-TardinDev-181717?style=flat&logo=github)](https://github.com/TardinDev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Davy%20Tardin-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/davy-tardin-11a7a1159/)
[![Website](https://img.shields.io/badge/Website-evoubap.com-4285F4?style=flat&logo=googlechrome)](https://evoubap.com)

---

Développé avec ❤️ pour le Gabon
