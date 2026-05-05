-- Neutralne nazwy kolumn regulaminu (storage / URL pliku zamiast „blob”).
-- Bezpieczne dla baz, które już mają nowe nazwy (pomija rename).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'races' AND column_name = 'regulation_blob_path'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'races' AND column_name = 'regulation_storage_path'
  ) THEN
    ALTER TABLE races RENAME COLUMN regulation_blob_path TO regulation_storage_path;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'races' AND column_name = 'regulation_blob_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'races' AND column_name = 'regulation_file_url'
  ) THEN
    ALTER TABLE races RENAME COLUMN regulation_blob_url TO regulation_file_url;
  END IF;
END $$;
