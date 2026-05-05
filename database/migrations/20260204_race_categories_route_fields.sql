-- Uruchom w Neon SQL Editor jeśli baza powstała przed dodaniem pól kategorii trasy.
ALTER TABLE race_categories
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS lap_count SMALLINT,
  ADD COLUMN IF NOT EXISTS laps_distance_km NUMERIC(5,2);
