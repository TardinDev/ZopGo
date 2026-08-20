# Photo de véhicule du chauffeur

**Date** : 2026-08-20
**État** : validé, prêt pour le plan d'implémentation

## Intention

Permettre au client de **reconnaître la voiture au point de rendez-vous**. La photo n'est ni un élément de profil décoratif, ni un outil de vérification interne : elle sert au moment précis où le client cherche son véhicule dans la rue.

Cette intention dicte deux choses : la photo doit être stockée côté serveur (sinon elle reste sur le téléphone du chauffeur et personne ne la voit), et elle doit apparaître là où le client la consulte avant le rendez-vous.

## État de l'existant

Constaté avant conception :

- `SettingsVehicle {id, label, type, plaque, isDefault}` vit dans Zustand `settingsStore`, persisté en **AsyncStorage uniquement**. Rien n'est envoyé à Supabase.
- La table `vehicles` existe en base (`owner_id`, `brand`, `model`, `plate_number`…) mais **aucun code mobile ne l'utilise**.
- `trajets` porte `immatriculation`, `modele`, `couleur`, recopiés à chaque trajet.
- `VoyageCard.tsx:33` assemble ces trois champs pour l'affichage en liste.
- `supabaseTrajets.ts:104` joint déjà le profil du chauffeur :
  `.select('*, profiles:chauffeur_id(name, avatar, rating, role, agency_name, agency_logo_url)')`
- `voyage-detail.tsx` reçoit les infos chauffeur par **paramètres de route** (`chauffeurName`, `chauffeurAvatar`, `chauffeurRating`…).

## Décisions

| Question | Décision | Raison |
|---|---|---|
| Rattachement | Profil du chauffeur | Un chauffeur roule avec un véhicule dans le cas général. Il dépose la photo une fois, elle sert tous ses trajets. |
| Stockage | Colonne `profiles.vehicle_photo_url` | Changement minimal. Évite de migrer les véhicules vers Supabase, chantier sans rapport avec la demande. |
| Bucket | Nouveau `vehicle-photos` | Mélanger avatars et photos de véhicules dans un même bucket rendrait les policies et le nettoyage confus. |
| Écran de dépôt | `vehicles-edit.tsx` | L'écran « Mes véhicules » est l'endroit où le chauffeur cherchera. |
| Affichage client | `voyage-detail.tsx` seul | La liste reste légère : une image par carte alourdirait le défilement et la consommation de données, ce qui compte au Gabon. |

## Architecture

### Base de données — migration 042

Colonne `vehicle_photo_url text` sur `profiles`, nullable.

Bucket `vehicle-photos`, public en lecture, avec des policies calquées sur celles durcies en migration 041 :

- `SELECT` : `bucket_id = 'vehicle-photos'` — lecture publique, les clients doivent voir la photo avant de réserver
- `INSERT` / `UPDATE` / `DELETE` : `bucket_id = 'vehicle-photos' AND (storage.foldername(name))[1] = auth.jwt() ->> 'sub'`

Le cadrage sur le dossier est **obligatoire dès la création**. Les migrations 040 et 041 ont montré qu'une policy permissive laissée en place annule silencieusement les policies cadrées, les règles se combinant en OU.

### Nouveau module — `src/lib/supabaseVehiclePhoto.ts`

Jumeau de `supabaseAvatar.ts`, même contrat :

- `uploadVehiclePhoto(clerkId, imageUri): Promise<string | null>` — lit le fichier en base64 (`fetch` + `blob` ne fonctionne pas en React Native), dépose sous `{clerkId}/{timestamp}.{ext}`, renvoie l'URL publique ou `null`
- `deleteVehiclePhoto(url): Promise<boolean>`

### Chauffeur — `vehicles-edit.tsx`

Zone photo au-dessus de la liste des véhicules : aperçu si une photo existe, bouton « Ajouter une photo » sinon. Indicateur de chargement pendant l'envoi, possibilité de remplacer ou supprimer. L'URL est persistée via `updateProfile({ vehiclePhotoUrl })`.

### Client — `voyage-detail.tsx`

Image en 16:9 pleine largeur dans le bloc chauffeur, au-dessus de la ligne `immatriculation · modèle · couleur`.

**Absente quand le chauffeur n'a pas de photo** : aucun cadre vide, aucun placeholder générique. Un espace vide est préférable à un visuel qui n'apporte rien.

### Flux de données

1. Chauffeur dépose → Storage → URL publique → `profiles.vehicle_photo_url`
2. `supabaseTrajets.ts:104` : ajouter `vehicle_photo_url` aux colonnes jointes
3. L'URL suit le même chemin que `chauffeurAvatar` : store → paramètres de route → `voyage-detail`

La photo est lue **en direct** depuis le profil, pas recopiée sur le trajet. Conséquence assumée : si le chauffeur change de photo, ses anciens trajets affichent la nouvelle. C'est le comportement souhaitable — la photo doit correspondre au véhicule actuel, puisqu'elle sert à le reconnaître.

## Gestion des erreurs

- Échec de lecture du fichier ou du dépôt : la photo précédente reste affichée, message d'erreur, aucun état intermédiaire incohérent
- Échec de l'écriture en base après un dépôt réussi : le fichier orphelin reste dans le bucket. Accepté — un nettoyage périodique relève d'un autre chantier
- Photo absente : cas nominal, pas une erreur

## Tests

- `supabaseVehiclePhoto` : dépôt réussi, échec de lecture du fichier, erreur Storage, suppression
- Persistance de l'URL sur le profil
- Rendu de `voyage-detail` : photo affichée quand l'URL existe, **rien de rendu** quand elle est absente
- Vérification en production, comme pour la migration 041 : dépôt dans son dossier accepté, dépôt dans celui d'un autre refusé, lecture publique sans jeton

## Hors périmètre

- Migration des véhicules du stockage local vers Supabase
- Support de plusieurs véhicules par chauffeur
- Modération ou validation du contenu des photos
- Nettoyage des fichiers orphelins

La table `vehicles` reste inutilisée. La faire vivre est un chantier distinct, sans rapport avec la demande.
