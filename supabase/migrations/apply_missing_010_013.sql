-- ============================================
-- ZopGo - Script complet : migrations 010 -> 013
-- ============================================
-- A executer dans le SQL Editor de Supabase
-- Idempotent : safe a relancer plusieurs fois
-- Corrige l'erreur "could not find the 'couleur' column of 'trajets'"
-- ============================================


-- ############################################
-- MIGRATION 010 : Trajets vehicle details
-- ############################################
ALTER TABLE public.trajets
  ADD COLUMN IF NOT EXISTS marque  TEXT,
  ADD COLUMN IF NOT EXISTS modele  TEXT,
  ADD COLUMN IF NOT EXISTS couleur TEXT;


-- ############################################
-- MIGRATION 011 : Hebergements images + storage
-- ############################################
ALTER TABLE public.hebergements
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hebergements',
  'hebergements',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public hebergement images are viewable by everyone" ON storage.objects;
CREATE POLICY "Public hebergement images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hebergements');

DROP POLICY IF EXISTS "Authenticated users can upload hebergement images" ON storage.objects;
CREATE POLICY "Authenticated users can upload hebergement images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hebergements' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update hebergement images" ON storage.objects;
CREATE POLICY "Authenticated users can update hebergement images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'hebergements' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete hebergement images" ON storage.objects;
CREATE POLICY "Authenticated users can delete hebergement images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hebergements' AND auth.role() = 'authenticated');


-- ############################################
-- MIGRATION 012 : Reservations + notifications.data + trajets.status 'complet'
-- ############################################
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trajet_id uuid NOT NULL REFERENCES public.trajets(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chauffeur_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_places integer NOT NULL DEFAULT 1,
  prix_total integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'en_attente'
    CHECK (status IN ('en_attente', 'acceptee', 'refusee', 'annulee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_trajet     ON public.reservations(trajet_id);
CREATE INDEX IF NOT EXISTS idx_reservations_client     ON public.reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_chauffeur  ON public.reservations(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status     ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created    ON public.reservations(created_at DESC);

DROP TRIGGER IF EXISTS set_reservations_updated_at ON public.reservations;
CREATE TRIGGER set_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their reservations" ON public.reservations;
CREATE POLICY "Users can view their reservations"
  ON public.reservations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Clients can create reservations" ON public.reservations;
CREATE POLICY "Clients can create reservations"
  ON public.reservations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their reservations" ON public.reservations;
CREATE POLICY "Users can update their reservations"
  ON public.reservations FOR UPDATE USING (true);

-- notifications.data jsonb (metadata reservation)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;

-- trajets.status : ajouter 'complet'
ALTER TABLE public.trajets DROP CONSTRAINT IF EXISTS trajets_status_check;
ALTER TABLE public.trajets ADD CONSTRAINT trajets_status_check
  CHECK (status IN ('en_attente', 'effectue', 'complet'));


-- ############################################
-- MIGRATION 013 : Direct messages
-- ############################################
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender      ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver    ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_reservation ON public.direct_messages(reservation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created     ON public.direct_messages(created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their direct messages" ON public.direct_messages;
CREATE POLICY "Users can view their direct messages"
  ON public.direct_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can send direct messages" ON public.direct_messages;
CREATE POLICY "Users can send direct messages"
  ON public.direct_messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update received messages" ON public.direct_messages;
CREATE POLICY "Users can update received messages"
  ON public.direct_messages FOR UPDATE USING (true);


-- ============================================
-- DONE ! Verification :
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'trajets' AND column_name IN ('marque','modele','couleur');
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'notifications' AND column_name = 'data';
--   SELECT to_regclass('public.reservations'), to_regclass('public.direct_messages');
-- ============================================
