# Photo de véhicule du chauffeur — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au chauffeur de déposer une photo de son véhicule, et au client de la voir sur le détail du trajet pour reconnaître la voiture au point de rendez-vous.

**Architecture:** La photo est rattachée au profil du chauffeur (`profiles.vehicle_photo_url`), déposée dans un bucket `vehicle-photos` cadré sur le dossier `{clerkId}/`. Elle remonte au client par la jointure profil déjà présente dans la requête de recherche, puis transite par les paramètres de route jusqu'au détail du trajet — exactement le chemin que suit déjà `chauffeurAvatar`.

**Tech Stack:** Expo / React Native, Supabase Storage + RLS, Zustand, Jest.

**Spec:** `docs/superpowers/specs/2026-08-20-photo-vehicule-chauffeur-design.md`

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `supabase/migrations/044_vehicle_photo.sql` | Colonne + bucket + policies cadrées |
| `src/lib/supabaseVehiclePhoto.ts` | Dépôt et suppression du fichier. Jumeau de `supabaseAvatar.ts` |
| `src/lib/__tests__/supabaseVehiclePhoto.test.ts` | Tests du module ci-dessus |
| `src/types/index.ts` | Champ `vehiclePhotoUrl` sur `UserInfo` |
| `src/stores/authStore.ts` | Mappe `vehiclePhotoUrl` → `vehicle_photo_url` |
| `src/lib/supabaseTrajets.ts` | Ajoute la colonne à la jointure profil |
| `src/app/(protected)/(tabs)/vehicles-edit.tsx` | Dépôt côté chauffeur |
| `src/app/(protected)/(tabs)/voyage-detail.tsx` | Affichage côté client |

---

### Task 1 : Migration — colonne, bucket et policies

**Files:**
- Create: `supabase/migrations/044_vehicle_photo.sql`

- [ ] **Step 1 : Écrire la migration**

```sql
-- Migration 044 — Photo de véhicule du chauffeur
--
-- Rattachée au profil et non au trajet : un chauffeur roule avec un véhicule
-- dans le cas général, il dépose la photo une fois et elle sert tous ses
-- trajets. Voir docs/superpowers/specs/2026-08-20-photo-vehicule-chauffeur-design.md
--
-- Les policies d'écriture sont cadrées sur le dossier DÈS LA CRÉATION. Les
-- migrations 040 et 041 ont montré qu'une policy permissive laissée en place
-- annule silencieusement les policies cadrées, les règles se combinant en OU.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vehicle_photo_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('vehicle-photos', 'vehicle-photos', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique : le client doit voir la photo avant de réserver.
CREATE POLICY "vehicle_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-photos');

-- Écriture réservée au propriétaire du dossier.
CREATE POLICY "vehicle_photos_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "vehicle_photos_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "vehicle_photos_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );
```

- [ ] **Step 2 : Appliquer**

Run: `npx supabase db push --linked`
Expected: `Applying migration 044_vehicle_photo.sql...` puis `Finished supabase db push.`

- [ ] **Step 3 : Vérifier qu'aucune policy permissive ne subsiste sur ce bucket**

Run:
```bash
npx supabase db query "select policyname, cmd, coalesce(qual,'-') q, coalesce(with_check,'-') wc from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'vehicle_photos%' order by policyname" --linked
```
Expected: 4 policies. Les trois d'écriture contiennent `foldername`. Seule celle de lecture a un prédicat réduit à `bucket_id`.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/044_vehicle_photo.sql
git commit -m "feat(db): colonne et bucket pour la photo de vehicule"
```

---

### Task 2 : Module de dépôt du fichier

**Files:**
- Create: `src/lib/supabaseVehiclePhoto.ts`
- Test: `src/lib/__tests__/supabaseVehiclePhoto.test.ts`

- [ ] **Step 1 : Écrire les tests qui échouent**

```typescript
// Le module dépose dans un bucket dédié sous {clerkId}/{timestamp}.{ext}.
// Le cadrage RLS repose sur ce premier segment : s'il cesse d'être le clerkId,
// tout dépôt est rejeté en production sans que les tests le voient.

jest.unmock('../supabaseVehiclePhoto');

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../supabase';
import { uploadVehiclePhoto, deleteVehiclePhoto } from '../supabaseVehiclePhoto';

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

(supabase as unknown as { storage: { from: jest.Mock } }).storage = {
  from: jest.fn(),
};

const mockedStorage = (supabase as unknown as { storage: { from: jest.Mock } }).storage;
const mockedFs = FileSystem as unknown as { readAsStringAsync: jest.Mock };

function mockUpload(result: { data: unknown; error: unknown }) {
  const bucket = {
    upload: jest.fn().mockResolvedValue(result),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: 'https://cdn.test/vehicle-photos/clk_1/123.jpg' },
    }),
    remove: jest.fn().mockResolvedValue({ error: null }),
  };
  mockedStorage.from.mockReturnValue(bucket);
  return bucket;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedFs.readAsStringAsync.mockResolvedValue('base64data');
});

describe('uploadVehiclePhoto', () => {
  it('dépose dans le bucket vehicle-photos et renvoie l’URL publique', async () => {
    const bucket = mockUpload({ data: { path: 'clk_1/123.jpg' }, error: null });

    const url = await uploadVehiclePhoto('clk_1', 'file:///tmp/photo.jpg');

    expect(mockedStorage.from).toHaveBeenCalledWith('vehicle-photos');
    expect(url).toBe('https://cdn.test/vehicle-photos/clk_1/123.jpg');
    expect(bucket.upload).toHaveBeenCalled();
  });

  it('range le fichier sous le clerkId — le cadrage RLS en dépend', async () => {
    const bucket = mockUpload({ data: { path: 'clk_1/123.jpg' }, error: null });

    await uploadVehiclePhoto('clk_1', 'file:///tmp/photo.jpg');

    const [chemin] = bucket.upload.mock.calls[0];
    expect(chemin.startsWith('clk_1/')).toBe(true);
  });

  it('renvoie null quand le dépôt échoue', async () => {
    mockUpload({ data: null, error: { message: 'boom' } });

    await expect(
      uploadVehiclePhoto('clk_1', 'file:///tmp/photo.jpg')
    ).resolves.toBeNull();
  });

  it('renvoie null quand la lecture du fichier échoue', async () => {
    mockUpload({ data: { path: 'x' }, error: null });
    mockedFs.readAsStringAsync.mockRejectedValue(new Error('illisible'));

    await expect(
      uploadVehiclePhoto('clk_1', 'file:///tmp/photo.jpg')
    ).resolves.toBeNull();
  });
});

describe('deleteVehiclePhoto', () => {
  it('supprime le fichier désigné par l’URL', async () => {
    const bucket = mockUpload({ data: null, error: null });

    const ok = await deleteVehiclePhoto(
      'https://cdn.test/storage/v1/object/public/vehicle-photos/clk_1/123.jpg'
    );

    expect(ok).toBe(true);
    expect(bucket.remove).toHaveBeenCalledWith(['clk_1/123.jpg']);
  });

  it('renvoie false sur une URL qui ne désigne pas ce bucket', async () => {
    mockUpload({ data: null, error: null });

    await expect(deleteVehiclePhoto('https://cdn.test/autre.jpg')).resolves.toBe(false);
  });
});
```

- [ ] **Step 2 : Lancer les tests, vérifier qu'ils échouent**

Run: `npx jest supabaseVehiclePhoto`
Expected: FAIL — `Cannot find module '../supabaseVehiclePhoto'`

- [ ] **Step 3 : Écrire le module**

```typescript
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { logError } from '../utils/errorHandler';

const BUCKET = 'vehicle-photos';

/**
 * Dépose la photo du véhicule et renvoie son URL publique.
 *
 * Le chemin est `{clerkId}/{timestamp}.{ext}` : le premier segment porte le
 * cadrage RLS (migration 044). Le modifier reviendrait à faire rejeter tous
 * les dépôts en production.
 *
 * Lecture en base64 plutôt que `fetch` + `blob`, qui ne fonctionne pas en
 * React Native.
 */
export async function uploadVehiclePhoto(
  clerkId: string,
  imageUri: string
): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${clerkId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      logError(error, 'uploadVehiclePhoto: Storage upload failed');
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    logError(err, 'uploadVehiclePhoto');
    return null;
  }
}

/** Supprime la photo désignée par son URL publique. */
export async function deleteVehiclePhoto(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(new RegExp(`/${BUCKET}/(.+)$`));
    if (!match) return false;

    const { error } = await supabase.storage.from(BUCKET).remove([match[1]]);
    if (error) {
      logError(error, 'deleteVehiclePhoto');
      return false;
    }
    return true;
  } catch (err) {
    logError(err, 'deleteVehiclePhoto');
    return false;
  }
}
```

- [ ] **Step 4 : Lancer les tests**

Run: `npx jest supabaseVehiclePhoto`
Expected: PASS — 6 tests

- [ ] **Step 5 : Commit**

```bash
git add src/lib/supabaseVehiclePhoto.ts src/lib/__tests__/supabaseVehiclePhoto.test.ts
git commit -m "feat(vehicule): module de depot de la photo de vehicule"
```

---

### Task 3 : Persistance sur le profil

**Files:**
- Modify: `src/types/index.ts:56-67` (interface `UserInfo`)
- Modify: `src/stores/authStore.ts:437-442` (mapping vers Supabase)
- Test: `src/stores/__tests__/authStore.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Ajouter dans `src/stores/__tests__/authStore.test.ts` :

```typescript
// updateProfile mappe explicitement chaque champ camelCase vers sa colonne
// snake_case. Un champ absent de ce mapping est mis à jour localement puis
// perdu au prochain démarrage — sans aucune erreur.
it('propage vehiclePhotoUrl vers la colonne vehicle_photo_url', () => {
  useAuthStore.getState().setupProfile('chauffeur', 'Test', 'test@zopgo.app');
  useAuthStore.setState({ clerkId: 'clk_1' });

  useAuthStore.getState().updateProfile({ vehiclePhotoUrl: 'https://cdn/x.jpg' });

  expect(updateSupabaseProfile).toHaveBeenCalledWith('clk_1', {
    vehicle_photo_url: 'https://cdn/x.jpg',
  });
});
```

- [ ] **Step 2 : Lancer le test, vérifier qu'il échoue**

Run: `npx jest authStore -t "vehiclePhotoUrl"`
Expected: FAIL — `updateSupabaseProfile` appelé sans `vehicle_photo_url`

- [ ] **Step 3 : Ajouter le champ au type**

Dans `src/types/index.ts`, interface `UserInfo`, après `avatar: string;` :

```typescript
  /** Photo du véhicule, renseignée par les chauffeurs. Vide sinon. */
  vehiclePhotoUrl?: string;
```

- [ ] **Step 4 : Ajouter le mapping**

Dans `src/stores/authStore.ts`, après la ligne `if ('avatar' in updates && updates.avatar) supabaseUpdates.avatar = updates.avatar;` :

```typescript
          if ('vehiclePhotoUrl' in updates && updates.vehiclePhotoUrl !== undefined)
            supabaseUpdates.vehicle_photo_url = updates.vehiclePhotoUrl;
```

- [ ] **Step 5 : Lancer les tests**

Run: `npx jest authStore`
Expected: PASS

- [ ] **Step 6 : Commit**

```bash
git add src/types/index.ts src/stores/authStore.ts src/stores/__tests__/authStore.test.ts
git commit -m "feat(vehicule): persiste l'URL de la photo sur le profil"
```

---

### Task 4 : Dépôt côté chauffeur

**Files:**
- Modify: `src/app/(protected)/(tabs)/vehicles-edit.tsx`

- [ ] **Step 1 : Ajouter les imports et l'état**

En tête du composant :

```typescript
import * as ImagePicker from 'expo-image-picker';
import { uploadVehiclePhoto } from '../../../lib/supabaseVehiclePhoto';
```

Dans le corps du composant, avec les autres `useState` :

```typescript
  const { user, updateProfile, clerkId } = useAuthStore();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const vehiclePhotoUrl = user?.profile?.vehiclePhotoUrl || '';
```

- [ ] **Step 2 : Ajouter le gestionnaire de dépôt**

```typescript
  const pickVehiclePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Nous avons besoin de la permission pour accéder à la galerie.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    const url = await uploadVehiclePhoto(clerkId || '', result.assets[0].uri);
    setUploadingPhoto(false);

    if (url) {
      updateProfile({ vehiclePhotoUrl: url });
    } else {
      Alert.alert('Erreur', "Impossible d'envoyer la photo. Réessayez.");
    }
  };
```

- [ ] **Step 3 : Ajouter la zone photo dans le rendu**

Juste au-dessus de la liste des véhicules :

```tsx
        <View style={{ marginBottom: 24 }}>
          <Text className="mb-2 text-gray-600">Photo du véhicule</Text>
          <TouchableOpacity
            onPress={pickVehiclePhoto}
            disabled={uploadingPhoto}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Ajouter une photo du véhicule"
            style={{
              height: 180,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {vehiclePhotoUrl ? (
              <Image
                source={{ uri: vehiclePhotoUrl }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Text className="text-gray-500">Ajouter une photo</Text>
            )}
            {uploadingPhoto && (
              <View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ActivityIndicator color="white" />
              </View>
            )}
          </TouchableOpacity>
          <Text className="mt-2 text-xs text-gray-500">
            Cette photo aide vos passagers à reconnaître votre véhicule.
          </Text>
        </View>
```

Vérifier que `Image` et `ActivityIndicator` figurent dans l'import `react-native` du fichier ; les ajouter sinon.

- [ ] **Step 4 : Vérifier**

Run: `npm test && npx tsc --noEmit && npx expo lint`
Expected: tests verts, typecheck sans erreur, lint code 0

- [ ] **Step 5 : Commit**

```bash
git add "src/app/(protected)/(tabs)/vehicles-edit.tsx"
git commit -m "feat(vehicule): depot de la photo depuis l'ecran vehicules"
```

---

### Task 5 : Transport jusqu'au client

**Files:**
- Modify: `src/lib/supabaseTrajets.ts:104`
- Modify: `src/app/(protected)/(tabs)/voyage-detail.tsx`

- [ ] **Step 1 : Ajouter la colonne à la jointure**

Dans `src/lib/supabaseTrajets.ts`, remplacer :

```typescript
    .select('*, profiles:chauffeur_id(name, avatar, rating, role, agency_name, agency_logo_url)')
```

par :

```typescript
    .select('*, profiles:chauffeur_id(name, avatar, rating, role, agency_name, agency_logo_url, vehicle_photo_url)')
```

- [ ] **Step 2 : Étendre le type de la jointure**

Dans le même fichier, l'interface qui décrit `profiles?` (vers la ligne 24) reçoit :

```typescript
    vehicle_photo_url?: string | null;
```

- [ ] **Step 3 : Propager jusqu'au paramètre de route**

Repérer l'endroit où `chauffeurAvatar` est passé en paramètre lors de la navigation vers `voyage-detail`, et ajouter à côté :

```typescript
  vehiclePhotoUrl: voyage.vehiclePhotoUrl || '',
```

Faire suivre la valeur depuis la jointure jusqu'à cet objet, en calquant exactement le trajet de `chauffeurAvatar`.

- [ ] **Step 4 : Vérifier**

Run: `npx tsc --noEmit`
Expected: aucune erreur

- [ ] **Step 5 : Commit**

```bash
git add src/lib/supabaseTrajets.ts "src/app/(protected)/(tabs)/voyage-detail.tsx"
git commit -m "feat(vehicule): transporte l'URL de la photo jusqu'au detail du trajet"
```

---

### Task 6 : Affichage côté client

**Files:**
- Modify: `src/app/(protected)/(tabs)/voyage-detail.tsx`
- Test: `src/app/(protected)/(tabs)/__tests__/voyage-detail.vehicle-photo.test.tsx`

- [ ] **Step 1 : Écrire les tests qui échouent**

```tsx
// La photo ne doit apparaître QUE lorsqu'elle existe. Un cadre vide ou un
// visuel générique à la place n'apporterait rien au client, qui cherche à
// reconnaître une voiture précise.

import React from 'react';
import { render } from '@testing-library/react-native';

const mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

import VoyageDetail from '../voyage-detail';

describe('voyage-detail — photo du véhicule', () => {
  beforeEach(() => {
    Object.keys(mockParams).forEach((k) => delete mockParams[k]);
    mockParams.chauffeurName = 'Awa';
  });

  it('affiche la photo quand le chauffeur en a une', () => {
    mockParams.vehiclePhotoUrl = 'https://cdn.test/vehicle-photos/clk_1/1.jpg';

    const { queryByLabelText } = render(<VoyageDetail />);

    expect(queryByLabelText('Photo du véhicule')).toBeTruthy();
  });

  it('n’affiche rien quand le chauffeur n’a pas de photo', () => {
    const { queryByLabelText } = render(<VoyageDetail />);

    expect(queryByLabelText('Photo du véhicule')).toBeNull();
  });
});
```

- [ ] **Step 2 : Lancer les tests, vérifier qu'ils échouent**

Run: `npx jest voyage-detail.vehicle-photo`
Expected: FAIL — le premier test ne trouve pas l'élément

- [ ] **Step 3 : Ajouter l'affichage**

Dans le bloc chauffeur, au-dessus de la ligne assemblant immatriculation / modèle / couleur :

```tsx
              {voyage.vehiclePhotoUrl ? (
                <Image
                  source={{ uri: voyage.vehiclePhotoUrl }}
                  accessibilityLabel="Photo du véhicule"
                  style={{
                    width: '100%',
                    aspectRatio: 16 / 9,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                />
              ) : null}
```

Et déclarer la valeur avec les autres champs issus des paramètres :

```typescript
    vehiclePhotoUrl: String(params.vehiclePhotoUrl || ''),
```

- [ ] **Step 4 : Lancer les tests**

Run: `npx jest voyage-detail.vehicle-photo`
Expected: PASS — 2 tests

- [ ] **Step 5 : Commit**

```bash
git add "src/app/(protected)/(tabs)/voyage-detail.tsx" "src/app/(protected)/(tabs)/__tests__/voyage-detail.vehicle-photo.test.tsx"
git commit -m "feat(vehicule): affiche la photo sur le detail du trajet"
```

---

### Task 7 : Vérification en production

**Files:** aucun

- [ ] **Step 1 : Vérifier le cadrage du bucket avec un vrai jeton**

Reprendre la méthode employée pour la migration 041. Avec un jeton de session Clerk valide dont le `sub` vaut `<clerkId>` :

```bash
# Dépôt dans son propre dossier — doit répondre 200
curl -X POST "$URL/storage/v1/object/vehicle-photos/<clerkId>/probe.jpg" \
  -H "apikey: $ANON" -H "Authorization: Bearer $JWT" \
  -H "Content-Type: image/jpeg" --data-binary @/tmp/px.jpg

# Dépôt dans le dossier d'un autre — doit répondre 403 AccessDenied
curl -X POST "$URL/storage/v1/object/vehicle-photos/autrui/pirate.jpg" \
  -H "apikey: $ANON" -H "Authorization: Bearer $JWT" \
  -H "Content-Type: image/jpeg" --data-binary @/tmp/px.jpg

# Lecture publique sans aucun jeton — doit répondre 200
curl -o /dev/null -w "%{http_code}" \
  "$URL/storage/v1/object/public/vehicle-photos/<clerkId>/probe.jpg"
```

Expected: `200`, puis `403 AccessDenied`, puis `200`

- [ ] **Step 2 : Nettoyer le fichier de test**

```bash
curl -X DELETE "$URL/storage/v1/object/vehicle-photos/<clerkId>/probe.jpg" \
  -H "apikey: $ANON" -H "Authorization: Bearer $JWT"
```

- [ ] **Step 3 : Vérifier la suite complète**

Run: `npm test && npx tsc --noEmit && npx expo lint`
Expected: toute la suite verte, typecheck sans erreur, lint code 0

- [ ] **Step 4 : Commit final**

```bash
git commit --allow-empty -m "test(vehicule): verification en production du cadrage du bucket"
```

---

## Notes d'implémentation

**Le premier segment du chemin porte la sécurité.** `{clerkId}/{timestamp}.{ext}` n'est pas une convention esthétique : la policy RLS compare ce segment au claim `sub`. Le modifier fait rejeter tous les dépôts en production, alors que les tests unitaires continuent de passer — d'où le test dédié en Task 2.

**Un fichier orphelin peut subsister.** Si le dépôt réussit mais que l'écriture du profil échoue, le fichier reste dans le bucket sans être référencé. Accepté par la spec ; un nettoyage périodique relève d'un autre chantier.

**La photo est lue en direct depuis le profil.** Changer de photo modifie l'affichage des anciens trajets. C'est voulu : elle sert à reconnaître le véhicule actuel.
