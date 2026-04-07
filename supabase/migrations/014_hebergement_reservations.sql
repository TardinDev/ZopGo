-- Migration 014: Hébergement reservations table
-- Permet aux clients de réserver des hébergements

CREATE TABLE IF NOT EXISTS hebergement_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hebergement_id UUID NOT NULL REFERENCES hebergements(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hebergeur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nombre_nuits INTEGER NOT NULL DEFAULT 1,
  prix_total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'acceptee', 'refusee', 'annulee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_heb_res_client ON hebergement_reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_heb_res_hebergeur ON hebergement_reservations(hebergeur_id);
CREATE INDEX IF NOT EXISTS idx_heb_res_hebergement ON hebergement_reservations(hebergement_id);

-- RLS
ALTER TABLE hebergement_reservations ENABLE ROW LEVEL SECURITY;

-- Le client peut voir ses réservations
CREATE POLICY "client_select_own_heb_reservations"
  ON hebergement_reservations FOR SELECT
  USING (client_id = auth.uid());

-- L'hébergeur peut voir les réservations de ses hébergements
CREATE POLICY "hebergeur_select_own_heb_reservations"
  ON hebergement_reservations FOR SELECT
  USING (hebergeur_id = auth.uid());

-- Le client peut créer une réservation
CREATE POLICY "client_insert_heb_reservation"
  ON hebergement_reservations FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- L'hébergeur peut mettre à jour le status
CREATE POLICY "hebergeur_update_heb_reservation_status"
  ON hebergement_reservations FOR UPDATE
  USING (hebergeur_id = auth.uid())
  WITH CHECK (hebergeur_id = auth.uid());

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_heb_reservation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_heb_reservation_updated_at
  BEFORE UPDATE ON hebergement_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_heb_reservation_updated_at();
