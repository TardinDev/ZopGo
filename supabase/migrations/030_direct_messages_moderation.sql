-- ============================================
-- ZopGo — Modération des messages directs (030)
-- ============================================
-- Donne à l'admin la capacité de MASQUER un message (soft-delete) depuis
-- le back-office, et corrige une lacune : depuis le hardening RLS (019),
-- la table direct_messages n'avait AUCUNE policy admin — la liste admin
-- était donc vide. On ajoute ici :
--   1. Les colonnes de masquage (deleted_at + hidden_by_admin).
--   2. Une policy SELECT user mise à jour : un message masqué disparaît
--      pour LES DEUX participants dans l'app mobile (filtré par RLS, donc
--      aucun changement de code mobile requis).
--   3. Les policies admin SELECT (voir tout, y compris masqué) + UPDATE
--      (masquer / réafficher).

-- ─── 1. Colonnes ────────────────────────────────────────────────────
ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by_admin boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_direct_messages_deleted
  ON public.direct_messages(deleted_at);

-- ─── 2 & 3. RLS ─────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.direct_messages') IS NULL THEN
    RAISE NOTICE 'Skipping direct_messages moderation RLS — table does not exist (apply migration 013 first).';
    RETURN;
  END IF;

  -- Policy SELECT user : on ajoute `deleted_at IS NULL` pour que les
  -- messages masqués par l'admin disparaissent côté mobile (émetteur ET
  -- destinataire).
  EXECUTE 'DROP POLICY IF EXISTS "direct_messages_select" ON public.direct_messages';
  EXECUTE $POLICY$
    CREATE POLICY "direct_messages_select"
      ON public.direct_messages FOR SELECT
      USING (
        deleted_at IS NULL
        AND (
          sender_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
          OR receiver_id IN (SELECT id FROM public.profiles WHERE clerk_id = (auth.jwt() ->> 'sub'))
        )
      )
  $POLICY$;

  -- Admin : lecture de TOUS les messages, masqués compris (pour modérer).
  EXECUTE 'DROP POLICY IF EXISTS "admin_direct_messages_select" ON public.direct_messages';
  EXECUTE $POLICY$
    CREATE POLICY "admin_direct_messages_select"
      ON public.direct_messages FOR SELECT
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
  $POLICY$;

  -- Admin : masquer / réafficher (soft-delete réversible).
  EXECUTE 'DROP POLICY IF EXISTS "admin_direct_messages_update" ON public.direct_messages';
  EXECUTE $POLICY$
    CREATE POLICY "admin_direct_messages_update"
      ON public.direct_messages FOR UPDATE
      USING ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
      WITH CHECK ((auth.jwt() ->> 'admin_role') IN ('admin', 'super_admin'))
  $POLICY$;
END $$;
