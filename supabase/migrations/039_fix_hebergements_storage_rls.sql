-- Migration: Fix hebergements storage bucket RLS (broken under Clerk TPA)
-- Description: the `hebergements` storage bucket's INSERT/UPDATE/DELETE
-- policies (migration 011) check auth.role() = 'authenticated', which
-- reads the JWT `role` claim. Clerk-issued session tokens (Third Party
-- Auth, see src/lib/supabase.ts) carry no `role` claim, so auth.role()
-- never resolves to 'authenticated' and every real photo upload is
-- rejected with 403 "new row violates row-level security policy".
--
-- Confirmed live: minted a real Clerk session JWT (test user, code
-- 424242) and called the Supabase Storage REST API directly — INSERT
-- rejected with code AccessDenied. This is the exact bug already fixed
-- for the `avatars` bucket in migration 019 (C5); the hebergements bucket
-- was missed at the time.
--
-- Fix: use auth.jwt() ->> 'sub' IS NOT NULL, the pattern used everywhere
-- else in this project for "any authenticated Clerk user" checks (see
-- migration 019, notifications_insert). Photo paths are
-- `{hebergementId}/{timestamp}.{ext}` where hebergementId is a
-- client-generated temp id, not the uploader's clerk_id, so this can't be
-- folder-scoped to the uploader the way avatars are — any authenticated
-- hôte can attach photos to their own listing, matching the pre-existing
-- intended behavior.

DROP POLICY IF EXISTS "Authenticated users can upload hebergement images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update hebergement images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete hebergement images" ON storage.objects;

CREATE POLICY "Authenticated users can upload hebergement images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hebergements'
  AND (auth.jwt() ->> 'sub') IS NOT NULL
);

CREATE POLICY "Authenticated users can update hebergement images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hebergements'
  AND (auth.jwt() ->> 'sub') IS NOT NULL
);

CREATE POLICY "Authenticated users can delete hebergement images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hebergements'
  AND (auth.jwt() ->> 'sub') IS NOT NULL
);
