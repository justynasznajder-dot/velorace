-- Organizator techniczny: wyścigi z panelu admina używają tego organizer_id (patrz PLATFORM_ORGANIZER_DEFAULT_ID w src/lib/raceDb.ts).
-- Uruchom w Neon SQL Editor (lub: npm run db:seed-platform-organizer jeśli dodany skrypt).
-- Członkostwo: wszyscy aktywni użytkownicy z role = admin dostają is_owner = true dla tej organizacji.

INSERT INTO organizers (id, name, short_name, email, is_active)
VALUES (
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'Platforma VeloRace',
  'VeloRace',
  'kontakt@velorace.pl',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active;

INSERT INTO organizer_members (organizer_id, user_id, is_owner)
SELECT
  'a0000000-0000-4000-8000-000000000001'::uuid,
  u.id,
  true
FROM users u
WHERE u.role = 'admin'::user_role
  AND u.is_active = true
ON CONFLICT (organizer_id, user_id) DO UPDATE SET
  is_owner = EXCLUDED.is_owner;
