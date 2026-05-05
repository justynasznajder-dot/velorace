# VeloRace Context v3 (aktualny)

> Ostatnia aktualizacja: 2026-05-05  
> Źródło prawdy dla schematu DB: `database/schema.sql`

## 1. Stack i architektura

- Framework: Next.js 14 (App Router) + TypeScript
- Baza: PostgreSQL (Neon), dostęp przez `@neondatabase/serverless`
- Stylowanie: CSS Modules + `globals.css`
- Upload plików wyników: Vercel Blob
- Główna logika backendowa: `src/lib/raceDb.ts`

## 2. Kluczowe moduły aplikacji

- `src/lib/raceDb.ts`:
  - CRUD wyścigów dla panelu admina
  - kategorie i fale startu
  - kontekst PDF wyników (`getRaceResultsPdfContext`)
- `src/lib/results.ts`:
  - parsery ścieżek blob
  - budowa prefiksów dla wyników PDF (`wyniki/{slug}/...`)
- `src/components/admin/*`:
  - `AdminAddRaceTab`, `AdminEditRaceTab`, `AdminResultsTab`, `AdminHistoryTab`
- `src/app/api/admin/*`:
  - endpointy panelu admina

## 3. Aktualny schemat bazy (skrót)

### Tabele główne

- `users`
- `organizers`
- `organizer_members`
- `races`
- `race_categories`
- `race_start_waves`
- `race_start_wave_categories`
- `registrations`
- `payments`
- `results`
- `live_timing`
- `incidents`
- `documents`
- `ranking_seasons`
- `ranking_points`
- `race_staff`
- `notifications`

### Ważne pola w `races`

- `id` (UUID, PK)
- `name`, `slug`, `race_date`, `city`
- `race_type`, `status`
- `distance_km`, `lap_count`, `laps_distance_km`
- `registration_opens`, `registration_closes`
- `results_pdf_slot_mode` (`NULL | 'category' | 'wave'`)

## 4. Kategorie i fale startu

### Kategorie

- Definicje kategorii są w `race_categories`
- Powiązanie: `race_categories.race_id -> races.id`
- Kolejność: `display_order`

### Fale startu

- Definicja fali: `race_start_waves`
  - `race_id`, `start_time`, `sort_order`
- Powiązanie kategorii do fal: `race_start_wave_categories`
  - `wave_id -> race_start_waves.id`
  - `category_id -> race_categories.id`
- Ograniczenie: jedna kategoria może należeć tylko do jednej fali
  - `UNIQUE INDEX idx_race_start_wave_categories_one_wave_per_category ON category_id`

## 5. Wyniki PDF (Blob) - aktualna logika

### Tryby slotów

- `category`: sloty budowane z kategorii wyścigu
- `wave`: sloty budowane z fal startu
- tryb zapisany w `races.results_pdf_slot_mode`
- fallback:
  - jeśli brak kolumny `results_pdf_slot_mode` w DB, backend działa w trybie kompatybilnym
  - jeśli brak kategorii i fal, używany legacy slot 1..5

### Ścieżki Blob

- Nowy format:
  - `wyniki/{slug}/kategoria/{slot}/plik.pdf`
  - `wyniki/{slug}/fala/{slot}/plik.pdf`
- Legacy (obsługiwany przy odczycie):
  - `wyniki/{raceId}/{slot}/plik.pdf`
  - `wyniki/{slot}/plik.pdf`

## 6. Endpointy API (admin + wyniki)

### Admin races

- `GET /api/admin/races` - lista wyścigów (do UI pomocniczego)
- `POST /api/admin/races` - dodanie wyścigu
- `GET /api/admin/races/database?year=YYYY` - lista z DB (filtrowana po roku, gdy podany `year`)
- `GET /api/admin/races/[id]` - szczegóły wyścigu do edycji
- `PATCH /api/admin/races/[id]` - zapis zmian

### Sloty wyników PDF

- `GET /api/admin/races/[id]/results-slots`
  - zwraca `slug`, `resultsPdfSlotMode`, `effectiveMode`, `categorySlots`, `waveSlots`
- `PATCH /api/admin/races/[id]/results-pdf-mode`
  - body: `{ "mode": "category" | "wave" }`

### Upload / odczyt wyników

- `POST /api/admin/results/upload`
  - form-data: `raceId`, `position`, `mode`, `file`
- `GET /api/results?raceId=...`
  - zwraca `urls`, `downloadUrls`, `fileNames`, `labels`, `resultsPdfMode`, `slotCount`

## 7. Panel Admin - aktualne zasady list

- `Edytuj wyścig`: tylko bieżący rok
- `Wstaw wyniki`: tylko bieżący rok
- `Historia`: tylko lata wcześniejsze
- We wszystkich 3 listach kolejność: od najnowszego do najstarszego

## 8. Walidacje UX w formularzach wyścigu

- Brak daty: browser/HTML5 oznacza pole i przewija do błędu
- Pusta nazwa kategorii:
  - pole nazwy kategorii zaznaczane na czerwono
  - formularz przewija i focusuje pierwszy błędny input
- Brak jakiejkolwiek kategorii:
  - brak toasta błędu
  - przycisk `+ Dodaj kategorię` dostaje czerwone obramowanie

## 9. Uwaga operacyjna (migracje)

- Dla pełnej funkcji trybu PDF zalecana migracja:
  - `database/migrations/20260209_races_results_pdf_slot_mode.sql`
- Kod ma fallback dla środowisk, gdzie kolumna `results_pdf_slot_mode` jeszcze nie istnieje.

## 10. Pliki, które najczęściej trzeba sprawdzać przy regresjach

- `src/components/admin/AdminResultsTab.tsx`
- `src/components/admin/AdminEditRaceTab.tsx`
- `src/components/admin/AdminHistoryTab.tsx`
- `src/components/results/ResultsCategoriesBody.tsx`
- `src/lib/raceDb.ts`
- `src/lib/results.ts`
- `src/app/api/results/route.ts`
- `src/app/api/admin/results/upload/route.ts`

