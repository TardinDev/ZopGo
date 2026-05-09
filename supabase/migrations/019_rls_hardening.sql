-- ============================================
-- ZopGo - RLS hardening (security audit fixes)
-- ============================================
-- Closes 6 security holes flagged in the audit:
--   C1: reservations RLS was using(true) — anyone could read/modify others'
--   C2: direct_messages RLS was using(true) — full DM exposure
--   C3: livraisons RLS was using(true) — full delivery data exposure
--   C4: hebergement_reservations used auth.uid() — broken under Clerk TPA
--   C5: storage.objects (avatars) used auth.uid()::text — silent upload bypass
--   C6: notifications INSERT allowed any user to broadcast via recipient_role='all'
--
-- Convention: a row "belongs" to a Clerk user when one of its profile-id
-- columns matches `(SELECT id FROM profiles WHERE clerk_id = auth.jwt()->>'sub')`.
-- The Clerk JWT injected by src/lib/supabase.ts (Third Party Auth) provides
-- `sub` — the Clerk user id (e.g. user_3BiJperMi15jFL2IIfdbdVtrB6Q).
-- ============================================


-- ============================================
-- 1. reservations (trajets) — C1
-- ============================================
DROP POLICY IF EXISTS "Users can view their reservations" ON public.reservations;
DROP POLICY IF EXISTS "Clients can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update their reservations" ON public.reservations;
DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
DROP POLICY IF EXISTS "reservations_insert" ON public.reservations;
DROP POLICY IF EXISTS "reservations_update" ON public.reservations;

CREATE POLICY "reservations_select"
  ON public.reservations FOR SELECT
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR chauffeur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

-- Only the client themself can create a reservation in their own name.
CREATE POLICY "reservations_insert"
  ON public.reservations FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

-- Either party can update (client to cancel, chauffeur to accept/refuse).
-- Field-level enforcement happens in the app + DB triggers if added later.
CREATE POLICY "reservations_update"
  ON public.reservations FOR UPDATE
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR chauffeur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR chauffeur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );


-- ============================================
-- 2. direct_messages — C2
-- ============================================
DROP POLICY IF EXISTS "Users can view their direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.direct_messages;
DROP POLICY IF EXISTS "direct_messages_select" ON public.direct_messages;
DROP POLICY IF EXISTS "direct_messages_insert" ON public.direct_messages;
DROP POLICY IF EXISTS "direct_messages_update" ON public.direct_messages;

CREATE POLICY "direct_messages_select"
  ON public.direct_messages FOR SELECT
  USING (
    sender_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR receiver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

-- Only the sender themself can post a message.
CREATE POLICY "direct_messages_insert"
  ON public.direct_messages FOR INSERT
  WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

-- Only the receiver can update (e.g. mark as read).
CREATE POLICY "direct_messages_update"
  ON public.direct_messages FOR UPDATE
  USING (
    receiver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    receiver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );


-- ============================================
-- 3. livraisons — C3
-- ============================================
DROP POLICY IF EXISTS "Users can view their livraisons" ON public.livraisons;
DROP POLICY IF EXISTS "Clients can create livraisons" ON public.livraisons;
DROP POLICY IF EXISTS "Parties can update livraisons" ON public.livraisons;
DROP POLICY IF EXISTS "livraisons_select" ON public.livraisons;
DROP POLICY IF EXISTS "livraisons_insert" ON public.livraisons;
DROP POLICY IF EXISTS "livraisons_update" ON public.livraisons;

CREATE POLICY "livraisons_select"
  ON public.livraisons FOR SELECT
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR livreur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

CREATE POLICY "livraisons_insert"
  ON public.livraisons FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

CREATE POLICY "livraisons_update"
  ON public.livraisons FOR UPDATE
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR livreur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR livreur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );


-- ============================================
-- 4. hebergement_reservations — C4
-- ============================================
-- These were using auth.uid() which doesn't map to profiles.id under Clerk
-- TPA. As a result, every authenticated write was blocked AND no row was
-- ever protected (the comparison was always NULL = NULL = false).
DROP POLICY IF EXISTS "client_select_own_heb_reservations" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergeur_select_own_heb_reservations" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "client_insert_heb_reservation" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergeur_update_heb_reservation_status" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergement_reservations_select" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergement_reservations_insert" ON public.hebergement_reservations;
DROP POLICY IF EXISTS "hebergement_reservations_update" ON public.hebergement_reservations;

CREATE POLICY "hebergement_reservations_select"
  ON public.hebergement_reservations FOR SELECT
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR hebergeur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

CREATE POLICY "hebergement_reservations_insert"
  ON public.hebergement_reservations FOR INSERT
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );

CREATE POLICY "hebergement_reservations_update"
  ON public.hebergement_reservations FOR UPDATE
  USING (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR hebergeur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  )
  WITH CHECK (
    client_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
    OR hebergeur_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
  );


-- ============================================
-- 5. storage.objects (avatars bucket) — C5
-- ============================================
-- Avatar paths follow `{clerk_user_id}/{timestamp}.{ext}` (see
-- src/lib/supabaseAvatar.ts). The Clerk user id is what auth.jwt()->>'sub'
-- carries — auth.uid() is null/wrong under TPA.
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );


-- ============================================
-- 6. notifications INSERT — C6
-- ============================================
-- Was: with check (auth.jwt()->>'sub' is not null)
-- Problem: any authenticated user could insert a notification with
-- recipient_role='all' and trigger a broadcast via the SELECT policy
-- which lets every user see notifications where recipient_role='all'.
--
-- Fix: client-side INSERTs must target a single recipient_id and may
-- not set recipient_role to a broadcast value. The send-push Edge
-- Function uses the service role and bypasses RLS — broadcasts still
-- work for legitimate server-side flows.
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'sub') IS NOT NULL
    AND recipient_id IS NOT NULL
    AND (recipient_role IS NULL OR recipient_role NOT IN ('all', 'client', 'chauffeur', 'hebergeur'))
  );
