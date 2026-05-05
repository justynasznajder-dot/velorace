-- Kraj i limit miejsc: bez wartości z aplikacji = NULL w bazie (brak domyślnego PL z poziomu INSERT).
-- Uruchom na istniejącej bazie (Neon SQL Editor lub: npm run db:migrate-races-country-spots-nullable).
-- Idempotentne: ponowne uruchomienie jest bezpieczne.

ALTER TABLE races ALTER COLUMN country DROP DEFAULT;
ALTER TABLE races ALTER COLUMN country DROP NOT NULL;

ALTER TABLE races ALTER COLUMN spots_total DROP DEFAULT;
ALTER TABLE races ALTER COLUMN spots_total DROP NOT NULL;
