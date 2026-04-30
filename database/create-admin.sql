-- Utworzenie / aktualizacja konta administratora
-- Uruchom w PostgreSQL (np. Neon SQL Editor)

INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  is_active
)
VALUES (
  'admin@velorace.pl',
  NULL, -- ustaw hash hasla po wdrozeniu auth
  'Admin',
  'VeloRace',
  'admin',
  TRUE
)
ON CONFLICT (email)
DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = 'admin',
  is_active = TRUE,
  updated_at = NOW();
