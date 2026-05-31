-- ============================================
-- ZopGo — Équipements / aménités des hébergements (032)
-- ============================================
-- L'hébergeur déclare à la création les services qu'il propose (Wi-Fi,
-- climatisation, eau chaude, groupe électrogène, parking, …). Le client
-- voit exactement ces équipements sur la fiche détail. Stocké comme un
-- tableau de clés canoniques (voir src/constants/amenities.ts).

ALTER TABLE public.hebergements
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}';
