# Hébergement — tarif nuit / semaine / mois + vérification photos

Date : 2026-06-07
Statut : approuvé par l'utilisateur

## Objectif

1. À la publication d'une annonce, l'hébergeur choisit si le prix est **par nuit, par semaine ou par mois**.
2. Vérifier et durcir le chargement des photos à la publication.
3. Tests Jest pour chaque morceau.

## Décisions

- **Un seul prix + une période** (pas de multi-prix simultanés).
- **Compteur de réservation adapté** à la période côté client.
- Photos : pas de bug précis signalé → vérifier permissions + flux + durcir l'erreur partielle.

## 1. Données — migration `037_hebergements_periode_tarif.sql`

```sql
ALTER TABLE public.hebergements
  ADD COLUMN IF NOT EXISTS periode_tarif text NOT NULL DEFAULT 'nuit';
ALTER TABLE public.hebergements
  ADD CONSTRAINT hebergements_periode_tarif_check
  CHECK (periode_tarif IN ('nuit','semaine','mois'));
```

- Rétro-compatible : annonces existantes → `'nuit'`.
- La colonne `prix_par_nuit` reste le **montant** (désormais « prix pour la période choisie »). Pas de renommage (trop invasif, gain cosmétique seulement).

## 2. Source unique : `src/utils/tarifPeriode.ts`

Module pur. Type `TarifPeriode = 'nuit' | 'semaine' | 'mois'`. Pour chaque période :
- `label` : `Nuit` / `Semaine` / `Mois`
- `suffixe` : `nuit` / `semaine` / `mois` (pour `… FCFA/{suffixe}`)
- `joursParUnite` : 1 / 7 / 30
- `maxUnites` : 30 / 12 / 12
- helpers : `periodeLabel`, `periodeSuffixe`, `uniteLabel(n)` (pluriel), `dureeEnNuits(periode, nbUnites)`, `isTarifPeriode(x)`.

## 3. Hébergeur — `mes-hebergements.tsx` + `hebergementsStore`

- `HebergementFormData.periodeTarif: TarifPeriode` (défaut `'nuit'`).
- Sélecteur segmenté Nuit/Semaine/Mois ; label du champ prix adapté.
- `addListing` → `insertHebergement({ ..., periode_tarif })`.
- Liste annonces actives + notif push : suffixe correct.

## 4. Client — découverte (`hebergementsDiscoveryStore`, `HebergementCard`)

- `price: "{prix} FCFA/{suffixe}"`. Carte inchangée (lit `price`).
- `periodeTarif` ajouté au type `Hebergement` + passé en param navigation.

## 5. Client — détail / réservation (`hebergement-detail.tsx`)

- Compteur libellé selon période, pluriel correct, plafond = `maxUnites`.
- `total = prix × nbUnités`.
- `nombre_nuits` stocké = `dureeEnNuits(periode, nbUnités)` ; `date_depart` calculée sur cette durée. **Aucune migration réservations.**

## 6. Photos — vérification / durcissement

- Vérifier `NSPhotoLibraryUsageDescription` / permissions Android dans `app.json`.
- Flux `expo-image-picker` → `uploadHebergementImage` → garde anti-publication-sans-photo (déjà là).
- Durcir : message si **certaines** photos échouent (aujourd'hui tout-ou-rien).

## 7. Tests Jest

- `tarifPeriode` (labels/suffixe/jours/pluriel/dureeEnNuits/isTarifPeriode).
- `hebergementsStore` : form + addListing transmettent `periodeTarif`.
- `hebergementsDiscoveryStore` : chaîne `price` selon période.
- `supabaseHebergements` : insert inclut `periode_tarif`.
- `supabaseHebergementImages` : upload succès + échec.

## Hors périmètre (YAGNI)

Multi-prix simultanés ; moteur de calendrier anti-chevauchement.
