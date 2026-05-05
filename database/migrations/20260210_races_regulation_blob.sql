-- Regulamin PDF (object storage), przypisany bezpośrednio do wyścigu.
-- Nowe instalacje: od razu neutralne nazwy kolumn.
-- Istniejące bazy ze starymi nazwami (regulation_blob_*): uruchom 20260505_races_regulation_neutral_columns.sql
ALTER TABLE races
  ADD COLUMN IF NOT EXISTS regulation_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS regulation_file_url TEXT,
  ADD COLUMN IF NOT EXISTS regulation_file_name TEXT,
  ADD COLUMN IF NOT EXISTS regulation_uploaded_at TIMESTAMPTZ;
