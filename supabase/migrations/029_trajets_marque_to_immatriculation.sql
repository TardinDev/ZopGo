-- Rename trajets.marque → trajets.immatriculation.
-- The column was originally created in migration 010 to store the vehicle brand
-- (Toyota, Honda, …) alongside model and color. Product decision: the brand
-- carries little signal compared to the actual license plate, which uniquely
-- identifies the vehicle a passenger boards. The plate is now mandatory at
-- publish time (validated client-side in trajets.tsx). Existing rows keep
-- whatever string was stored — drivers will overwrite next time they publish.

ALTER TABLE trajets
  RENAME COLUMN marque TO immatriculation;
