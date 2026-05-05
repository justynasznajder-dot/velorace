-- Regulamin PDF w Vercel Blob, przypisany bezpośrednio do wyścigu.
ALTER TABLE races
  ADD COLUMN IF NOT EXISTS regulation_blob_path TEXT,
  ADD COLUMN IF NOT EXISTS regulation_blob_url TEXT,
  ADD COLUMN IF NOT EXISTS regulation_file_name TEXT,
  ADD COLUMN IF NOT EXISTS regulation_uploaded_at TIMESTAMPTZ;
