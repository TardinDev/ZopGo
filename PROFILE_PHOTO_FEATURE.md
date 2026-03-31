# 📸 Fonctionnalité : Changement de photo de profil

## ✅ Fonctionnalité implémentée

Les utilisateurs peuvent maintenant **changer leur photo de profil** depuis l'écran d'édition du profil !

---

## 🎯 Comment ça fonctionne

### Pour l'utilisateur :

1. **Accéder à l'écran de profil** :
   - Onglet "Profil" → Bouton "Modifier le profil"

2. **Changer la photo** :
   - Appuyer sur l'icône caméra (📷) en bas à droite de la photo
   - Choisir une option :
     - **Prendre une photo** : Ouvrir la caméra
     - **Choisir depuis la galerie** : Sélectionner une photo existante
   - La photo est automatiquement uploadée et mise à jour

3. **Avatar par défaut** :
   - Si aucune photo n'est uploadée, un avatar avec initiales et couleur est affiché
   - Couleur générée automatiquement à partir de l'ID utilisateur (cohérente)

---

## 🏗️ Architecture technique

### 1. **Upload vers Supabase Storage**

```typescript
// src/lib/supabaseAvatar.ts
uploadAvatar(userId, imageUri) → publicUrl
```

- Upload l'image vers le bucket `avatars` de Supabase
- Génère un nom de fichier unique : `{userId}/{timestamp}.{ext}`
- Retourne l'URL publique de l'image

### 2. **Avatar par défaut (placeholder)**

```typescript
generateAvatarPlaceholder(name, userId) → url
```

- Génère un avatar avec initiales (ex: "John Doe" → "JD")
- Couleur déterminée par l'userId (9 couleurs différentes)
- Utilise l'API UI Avatars : https://ui-avatars.com/

### 3. **Permissions**

- **Caméra** : Pour prendre une photo
- **Galerie** : Pour choisir une photo existante
- Configuré dans `app.json` avec messages personnalisés

### 4. **Stockage**

- **Supabase Storage** : Bucket `avatars` (public)
- **Limite de taille** : 5 MB par image
- **Formats acceptés** : JPEG, JPG, PNG, WebP
- **RLS Policies** :
  - Tout le monde peut voir les avatars (public)
  - Seul le propriétaire peut upload/modifier/supprimer son avatar

---

## 📁 Fichiers modifiés/créés

### Nouveaux fichiers :

| Fichier | Description |
|---------|-------------|
| `src/lib/supabaseAvatar.ts` | Upload/suppression d'avatars vers Supabase |
| `supabase/migrations/008_storage_avatars.sql` | Migration pour créer le bucket et les policies |

### Fichiers modifiés :

| Fichier | Modifications |
|---------|---------------|
| `src/app/(protected)/(tabs)/profile-edit.tsx` | UI pour changer la photo (caméra + galerie) |
| `src/stores/authStore.ts` | Synchronisation avatar depuis Supabase |
| `app.json` | Ajout du plugin expo-image-picker avec permissions |
| `package.json` | Ajout de expo-image-picker |

---

## 🗄️ Base de données

### Table `profiles`

Le champ `avatar` existe déjà :

```sql
CREATE TABLE profiles (
  ...
  avatar TEXT DEFAULT '',
  ...
);
```

### Storage Bucket `avatars`

Créé par la migration `008_storage_avatars.sql` :

```
avatars/
├── {userId}/
│   ├── {timestamp1}.jpg
│   ├── {timestamp2}.png
│   └── ...
└── ...
```

### Policies RLS

```sql
-- Lecture publique
"Public avatars are viewable by everyone"

-- Upload restreint au propriétaire
"Users can upload their own avatar"

-- Modification/suppression restreinte au propriétaire
"Users can update their own avatar"
"Users can delete their own avatar"
```

---

## 🧪 Comment tester

### Test 1 : Upload depuis la galerie

1. Ouvrir l'app → Profil → Modifier le profil
2. Appuyer sur l'icône caméra
3. Choisir "Choisir depuis la galerie"
4. Sélectionner une image
5. ✅ La photo est mise à jour immédiatement

### Test 2 : Prendre une photo

1. Ouvrir l'app → Profil → Modifier le profil
2. Appuyer sur l'icône caméra
3. Choisir "Prendre une photo"
4. Prendre une photo
5. ✅ La photo est mise à jour immédiatement

### Test 3 : Avatar par défaut

1. Créer un nouveau compte sans photo
2. ✅ Un avatar avec initiales et couleur s'affiche
3. La couleur reste cohérente (même couleur pour le même utilisateur)

### Test 4 : Synchronisation

1. Changer la photo sur téléphone A
2. Se connecter sur téléphone B avec le même compte
3. ✅ La photo est synchronisée depuis Supabase

---

## 🚀 Prochaines étapes

### Pour appliquer la migration Supabase :

```bash
# Se connecter à Supabase
supabase login

# Appliquer la migration
supabase db push
```

### Pour tester en développement :

```bash
npx expo start
```

### Pour builder l'APK :

```bash
eas build --profile preview --platform android
```

---

## 📊 Avant / Après

| Fonctionnalité | ❌ Avant | ✅ Après |
|----------------|----------|----------|
| Photo de profil | Image Unsplash par défaut | Photo personnalisée |
| Changement de photo | Impossible | ✅ Caméra + Galerie |
| Avatar par défaut | Image générique | Initiales + couleur |
| Stockage | Pas de stockage | Supabase Storage |
| Synchronisation | Non | ✅ Multi-appareils |

---

## 🔒 Sécurité

- ✅ **RLS activé** : Seul le propriétaire peut modifier son avatar
- ✅ **Validation des types MIME** : Seulement images autorisées
- ✅ **Limite de taille** : 5 MB maximum
- ✅ **Dossier par utilisateur** : Isolation des fichiers
- ✅ **URLs publiques** : Pas besoin d'auth pour voir les avatars (lecture seule)

---

## 🐛 Résolution de problèmes

### L'upload échoue

1. Vérifier que le bucket `avatars` existe dans Supabase
2. Vérifier que la migration a été appliquée : `supabase db push`
3. Vérifier les permissions storage dans Supabase dashboard

### Les permissions sont refusées

1. Vérifier que les permissions sont dans `app.json`
2. Rebuild l'app : `npx expo prebuild --clean`
3. Sur Android : vérifier les permissions dans les paramètres de l'app

### L'avatar ne se synchronise pas

1. Vérifier que l'utilisateur est bien connecté (Clerk + Supabase)
2. Vérifier que `clerkId` est présent dans le store
3. Vérifier les logs de la fonction `uploadAvatar`

---

**Fonctionnalité complète et prête à l'emploi !** 📸✨
