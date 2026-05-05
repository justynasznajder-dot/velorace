-- Tryb wgrywania PDF wyników: wg kategorii startowych lub wg fal startu (folder w Blob: wyniki/{slug}/...)
ALTER TABLE races
  ADD COLUMN IF NOT EXISTS results_pdf_slot_mode TEXT
  CHECK (results_pdf_slot_mode IS NULL OR results_pdf_slot_mode IN ('category', 'wave'));

COMMENT ON COLUMN races.results_pdf_slot_mode IS 'category = jeden PDF na kategorię (wyniki/{slug}/kategoria/n/); wave = jeden PDF na falę (wyniki/{slug}/fala/n/). NULL = domyślnie kategorie, jeśli są.';
