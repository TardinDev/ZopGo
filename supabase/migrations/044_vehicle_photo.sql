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
DROP POLICY IF EXISTS "vehicle_photos_public_read" ON storage.objects;
CREATE POLICY "vehicle_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-photos');

-- Écriture réservée au propriétaire du dossier.
DROP POLICY IF EXISTS "vehicle_photos_owner_insert" ON storage.objects;
CREATE POLICY "vehicle_photos_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "vehicle_photos_owner_update" ON storage.objects;
CREATE POLICY "vehicle_photos_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "vehicle_photos_owner_delete" ON storage.objects;
CREATE POLICY "vehicle_photos_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vehicle-photos'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );
