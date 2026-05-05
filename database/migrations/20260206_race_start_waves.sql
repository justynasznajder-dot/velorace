-- Fale startu (wspólny czas dla wielu kategorii). Uruchom w Neon po wdrożeniu kodu.

CREATE TABLE IF NOT EXISTS race_start_waves (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id         UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  start_time      TIME NOT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_race_start_waves_race ON race_start_waves(race_id);

CREATE TABLE IF NOT EXISTS race_start_wave_categories (
  wave_id         UUID NOT NULL REFERENCES race_start_waves(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES race_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (wave_id, category_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_race_start_wave_categories_one_wave_per_category
  ON race_start_wave_categories(category_id);
