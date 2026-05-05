-- Odpowiednik skryptu scripts/create-admin-user.mjs — do wklejenia w Neon SQL Editor.
-- PRZED URUCHOMIENIEM: podmień hasło w dwóch miejscach poniżej (to samo w obu liniach z hasłem).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  is_active
)
VALUES (
  'rafal.makowski@velorace.pl',
  crypt('TUTAJ_WPISZ_SILNE_HASLO', gen_salt('bf')),
  'Rafał',
  'Makowski',
  'admin',
  TRUE
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = crypt('TUTAJ_WPISZ_SILNE_HASLO', gen_salt('bf')),
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = TRUE,
  updated_at = NOW();
