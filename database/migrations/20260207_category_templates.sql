-- Słownik szablonów kategorii PZKol (bez FK do race_categories).

CREATE TABLE IF NOT EXISTS category_templates (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  gender          CHAR(1) NULL,
  birth_year_min  SMALLINT NULL,
  birth_year_max  SMALLINT NULL,
  display_order   SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_category_templates_order ON category_templates(display_order);

INSERT INTO category_templates (name, gender, birth_year_min, birth_year_max, display_order) VALUES
  ('Żak', 'M', NULL, NULL, 0),
  ('Żakini', 'K', NULL, NULL, 1),
  ('Młodzik', 'M', NULL, NULL, 2),
  ('Młodziczka', 'K', NULL, NULL, 3),
  ('Junior Młodszy', 'M', NULL, NULL, 4),
  ('Juniorka Młodsza', 'K', NULL, NULL, 5),
  ('Junior', 'M', NULL, NULL, 6),
  ('Juniorka', 'K', NULL, NULL, 7),
  ('Orlik', 'M', NULL, NULL, 8),
  ('Orliczka', 'K', NULL, NULL, 9),
  ('Elita Mężczyzn', 'M', NULL, NULL, 10),
  ('Elita Kobiet', 'K', NULL, NULL, 11),
  ('Masters M20', 'M', NULL, NULL, 12),
  ('Masters M30', 'M', NULL, NULL, 13),
  ('Masters M40', 'M', NULL, NULL, 14),
  ('Masters M50', 'M', NULL, NULL, 15),
  ('Masters M60', 'M', NULL, NULL, 16),
  ('Masters M70', 'M', NULL, NULL, 17),
  ('Masters K30', 'K', NULL, NULL, 18),
  ('Masters K40', 'K', NULL, NULL, 19),
  ('Masters K50', 'K', NULL, NULL, 20),
  ('Masters K55', 'K', NULL, NULL, 21),
  ('Masters K60', 'K', NULL, NULL, 22)
ON CONFLICT (name) DO NOTHING;
