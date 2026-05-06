# VeloRace Context v4 (aktualny)

> Ostatnia aktualizacja: 2026-05-06 (v5 — uzupełniony o pełną dokumentację tabel, relacje, flow i dane seed)  
> Źródło prawdy dla schematu DB: `database/schema.sql`

## 1. Stack i architektura

- Framework: Next.js 14 (App Router) + TypeScript
- Baza: PostgreSQL (Neon), dostęp przez `@neondatabase/serverless`
- Stylowanie: CSS Modules + `globals.css`
- Upload plików (wyniki, listy startowe, regulamin): Cloudflare R2
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

## 3. Aktualny schemat bazy

**Łącznie: 18 tabel + 1 widok (`ranking_individual`)**

### `users` — Użytkownicy

Centralna tabela systemu. Jeden użytkownik może być zawodnikiem i trenerem tylko przez zmianę kolumny `role` — wielorolowość na poziomie organizacji obsługuje `organizer_members`. `password_hash = NULL` oznacza konto OAuth.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `email` | TEXT | NO | — | Unikalny, używany do logowania |
| `password_hash` | TEXT | YES | — | bcrypt; NULL gdy tylko OAuth |
| `first_name` | TEXT | NO | — | Imię |
| `last_name` | TEXT | NO | — | Nazwisko |
| `phone` | TEXT | YES | — | Telefon kontaktowy |
| `birth_date` | DATE | YES | — | Wymagana do weryfikacji kategorii wiekowej |
| `license_number` | TEXT | YES | — | Numer licencji PZKol — unikalny |
| `club` | TEXT | YES | — | Nazwa klubu/drużyny |
| `nationality` | CHAR(2) | YES | 'PL' | ISO 3166-1 alpha-2 |
| `role` | user_role | NO | 'rider' | Rola w systemie (ENUM) |
| `avatar_url` | TEXT | YES | — | URL zdjęcia profilowego |
| `is_active` | BOOLEAN | NO | TRUE | Czy konto aktywne |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Data rejestracji |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Ostatnia modyfikacja (auto trigger) |

### `organizers` — Organizatorzy

Podmioty organizujące wyścigi (kluby, federacje, firmy). Jeden organizator → wiele wyścigów. Wielu użytkowników może zarządzać jednym organizatorem przez `organizer_members`.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `name` | TEXT | NO | — | Pełna nazwa |
| `short_name` | TEXT | YES | — | Skrót (np. SCC) |
| `logo_url` | TEXT | YES | — | URL logo |
| `website` | TEXT | YES | — | Strona internetowa |
| `email` | TEXT | YES | — | Email kontaktowy |
| `phone` | TEXT | YES | — | Telefon |
| `address` | TEXT | YES | — | Adres siedziby |
| `is_active` | BOOLEAN | NO | TRUE | Czy aktywny na platformie |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Data rejestracji |

### `organizer_members` — Członkowie organizacji

Tabela łącząca (M:M): użytkownik ↔ organizator. PK złożony: `(organizer_id, user_id)`.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `organizer_id` | UUID | NO | — | FK → organizers.id (CASCADE) |
| `user_id` | UUID | NO | — | FK → users.id (CASCADE) |
| `is_owner` | BOOLEAN | NO | FALSE | Czy właściciel konta organizatora |

### `races` — Wyścigi

Główna tabela. Cykl życia statusu: `draft → published → registration_open → registration_closed → live → finished`.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `organizer_id` | UUID | YES | — | FK → organizers.id (SET NULL) |
| `name` | TEXT | NO | — | Pełna nazwa |
| `slug` | TEXT | NO | — | URL-friendly identyfikator — UNIQUE |
| `edition_year` | SMALLINT | YES | — | Rok edycji |
| `race_type` | race_type | NO | 'road' | Typ wyścigu (ENUM) |
| `status` | race_status | NO | 'draft' | Status wyścigu (ENUM) |
| `race_date` | DATE | NO | — | Data wyścigu |
| `race_time_start` | TIME | YES | — | Godzina startu (bez strefy) |
| `city` | TEXT | NO | — | Miasto startu/mety |
| `region` | TEXT | YES | — | Województwo/region |
| `country` | CHAR(2) | YES | 'PL' | ISO 3166-1 alpha-2 |
| `distance_km` | NUMERIC(6,2) | YES | — | Dystans w km |
| `elevation_gain_m` | INT | YES | — | Suma przewyższeń w m |
| `max_elevation_m` | INT | YES | — | Maks. wysokość npm |
| `lap_count` | SMALLINT | YES | — | Liczba okrążeń (criterium) |
| `laps_distance_km` | NUMERIC(5,2) | YES | — | Długość jednego okrążenia |
| `spots_total` | INT | YES | — | Łączna liczba miejsc startowych |
| `entry_fee_pln` | NUMERIC(8,2) | YES | — | Opłata startowa PLN |
| `description` | TEXT | YES | — | Opis wyścigu |
| `registration_opens` | TIMESTAMPTZ | YES | — | Data/czas otwarcia zapisów |
| `registration_closes` | TIMESTAMPTZ | YES | — | Data/czas zamknięcia zapisów |
| `gpx_url` | TEXT | YES | — | URL pliku GPX trasy |
| `cover_image_url` | TEXT | YES | — | URL zdjęcia okładkowego |
| `results_pdf_slot_mode` | TEXT | YES | — | `NULL \| 'category' \| 'wave'` |
| `regulation_storage_path` | TEXT | YES | — | Ścieżka w R2 |
| `regulation_file_url` | TEXT | YES | — | Publiczny URL regulaminu |
| `regulation_file_name` | TEXT | YES | — | Oryginalna nazwa pliku |
| `regulation_uploaded_at` | TIMESTAMPTZ | YES | — | Czas uploadu |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Data utworzenia |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Ostatnia modyfikacja (auto trigger) |

### `race_categories` — Kategorie startowe

Wyścig może mieć wiele kategorii (np. Elita, U23, Masters 30+). Pola `distance_km`, `lap_count`, `laps_distance_km`, `entry_fee_pln` **nadpisują** wartości z `races` — jeśli NULL, obowiązuje wartość z tabeli `races`. Numery startowe przydzielane są z zakresu `bib_start`.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `race_id` | UUID | NO | — | FK → races.id (CASCADE) |
| `name` | TEXT | NO | — | Nazwa (np. "Masters 30+") |
| `min_age` | SMALLINT | YES | — | Minimalny wiek |
| `max_age` | SMALLINT | YES | — | Maksymalny wiek |
| `gender` | CHAR(1) | YES | — | 'M', 'F', NULL = open |
| `entry_fee_pln` | NUMERIC(8,2) | YES | — | Własna opłata (nadpisuje races) |
| `spots_total` | INT | YES | — | Limit miejsc (NULL = brak limitu) |
| `bib_start` | INT | YES | — | Pierwsza numeracja startowa |
| `display_order` | SMALLINT | NO | 0 | Kolejność wyświetlania |
| `distance_km` | NUMERIC(6,2) | YES | — | Dystans kategorii (nadpisuje races) |
| `lap_count` | SMALLINT | YES | — | Liczba okrążeń (nadpisuje races) |
| `laps_distance_km` | NUMERIC(5,2) | YES | — | Długość okrążenia (nadpisuje races) |

### `category_templates` — Szablony kategorii

Słownik globalnych kategorii PZKol. Admin wybiera z dropdownu — dane kopiują się do `race_categories` i można je nadpisać per wyścig. `birth_year_min` = starszy rocznik (np. 2014), `birth_year_max` = młodszy (np. 2015).

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | SERIAL | NO | autoincrement | PK |
| `name` | TEXT | NO | — | Nazwa (np. "Masters – M40") |
| `gender` | CHAR(1) | YES | — | 'M', 'K', NULL = open |
| `birth_year_min` | SMALLINT | YES | — | Starszy rocznik przedziału |
| `birth_year_max` | SMALLINT | YES | — | Młodszy rocznik przedziału |
| `display_order` | SMALLINT | NO | 0 | Kolejność w dropdownie |

### `race_start_waves` — Fale startu

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `race_id` | UUID | NO | — | FK → races.id (CASCADE) |
| `start_time` | TIME | NO | — | Godzina startu fali |
| `sort_order` | SMALLINT | NO | 0 | Kolejność fal |
| `created_at` | TIMESTAMPTZ | NO | NOW() | — |

### `race_start_wave_categories` — Powiązanie kategorii z falami

PK złożony: `(wave_id, category_id)`. Jedna kategoria może należeć tylko do jednej fali — `UNIQUE INDEX idx_race_start_wave_categories_one_wave_per_category ON (category_id)`.

| Kolumna | Typ | Nullable | Opis |
|---------|-----|----------|------|
| `wave_id` | UUID | NO | FK → race_start_waves.id (CASCADE) |
| `category_id` | UUID | NO | FK → race_categories.id (CASCADE) |

### `registrations` — Zapisy

Jeden zawodnik → jeden wyścig max raz (`UNIQUE race_id + user_id`). Cykl statusu: `pending → confirmed → (withdrawn / dns / dnf / dq)`.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `race_id` | UUID | NO | — | FK → races.id (CASCADE) |
| `user_id` | UUID | NO | — | FK → users.id (CASCADE) |
| `category_id` | UUID | YES | — | FK → race_categories.id (SET NULL) |
| `status` | registration_status | NO | 'pending' | Status zapisu (ENUM) |
| `bib_number` | INT | YES | — | Numer startowy przydzielony przez biuro |
| `registered_at` | TIMESTAMPTZ | NO | NOW() | Data złożenia zapisu |
| `confirmed_at` | TIMESTAMPTZ | YES | — | Data potwierdzenia (po opłacie) |
| `withdrawn_at` | TIMESTAMPTZ | YES | — | Data wycofania |
| `withdrawal_reason` | TEXT | YES | — | Powód wycofania |
| `notes` | TEXT | YES | — | Notatki biura zawodów |

### `payments` — Płatności

Jeden zapis może mieć wiele płatności (np. ponowna próba). Provider domyślny: Przelewy24; obsługiwany też Stripe.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `registration_id` | UUID | NO | — | FK → registrations.id (CASCADE) |
| `amount_pln` | NUMERIC(8,2) | NO | — | Kwota w PLN |
| `status` | payment_status | NO | 'pending' | Status (ENUM) |
| `provider` | TEXT | YES | 'przelewy24' | 'przelewy24' lub 'stripe' |
| `provider_order_id` | TEXT | YES | — | ID zamówienia u providera |
| `provider_session_id` | TEXT | YES | — | ID sesji płatności |
| `paid_at` | TIMESTAMPTZ | YES | — | Czas potwierdzenia |
| `refunded_at` | TIMESTAMPTZ | YES | — | Czas zwrotu |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Data utworzenia |

### `results` — Wyniki

Oficjalne wyniki po zakończeniu wyścigu. Mogą być powiązane z zapisem (`registration_id`) lub wprowadzone manualnie (`user_id` bez `registration_id`).

> ⚠️ Kolumna `status` używa ENUM `registration_status` (nie własnego) — domyślnie `'confirmed'`.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `race_id` | UUID | NO | — | FK → races.id (CASCADE) |
| `registration_id` | UUID | YES | — | FK → registrations.id (SET NULL) |
| `user_id` | UUID | YES | — | FK → users.id (SET NULL) |
| `category_id` | UUID | YES | — | FK → race_categories.id (SET NULL) |
| `bib_number` | INT | YES | — | Numer startowy |
| `position_overall` | INT | YES | — | Pozycja generalna |
| `position_cat` | INT | YES | — | Pozycja w kategorii |
| `finish_time` | INTERVAL | YES | — | Czas ukończenia |
| `gap_to_leader` | INTERVAL | YES | — | Strata do lidera |
| `avg_speed_kmh` | NUMERIC(5,2) | YES | — | Średnia prędkość km/h |
| `status` | registration_status | NO | 'confirmed' | Status ukończenia (dns/dnf/dq) |
| `chip_time` | INTERVAL | YES | — | Czas elektroniczny (chip) |
| `gun_time` | INTERVAL | YES | — | Czas pistoletowy (gun) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | — |

### `live_timing` — Live timing

Upsertowany po każdym punkcie pomiarowym: `INSERT ... ON CONFLICT (race_id, bib_number) DO UPDATE`. Po zakończeniu wyścigu dane archiwizowane do `results`.

> ⚠️ Kolumna `status` używa ENUM `registration_status` — domyślnie `'confirmed'`.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | gen_random_uuid() | PK |
| `race_id` | UUID | NO | — | FK → races.id (CASCADE) |
| `bib_number` | INT | NO | — | Numer startowy — UNIQUE per wyścig |
| `user_id` | UUID | YES | — | FK → users.id (SET NULL) |
| `position` | INT | YES | — | Aktualna pozycja |
| `elapsed_time` | INTERVAL | YES | — | Czas od startu |
| `gap_to_leader` | INTERVAL | YES | — | Strata do prowadzącego |
| `current_km` | NUMERIC(6,2) | YES | — | Przebyta odległość km |
| `current_lap` | SMALLINT | YES | — | Bieżące okrążenie |
| `avg_speed_kmh` | NUMERIC(5,2) | YES | — | Bieżąca średnia prędkość |
| `status` | registration_status | YES | 'confirmed' | Status zawodnika w wyścigu |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Czas ostatniej aktualizacji (RFID/GPS) |

### `incidents` — Incydenty

Zdarzenia zgłaszane przez sędziów liniowych. `affected_bibs` to tablica `INT[]` numerów startowych. Dostępne publicznie (`is_public = TRUE`) lub tylko dla personelu.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `race_id` | UUID | NO | — | FK → races.id (CASCADE) |
| `reported_by` | UUID | YES | — | FK → users.id (SET NULL) — sędzia/komisarz |
| `incident_type` | incident_type | NO | — | Typ incydentu (ENUM) |
| `km_position` | NUMERIC(6,2) | YES | — | Kilometr trasy |
| `description` | TEXT | NO | — | Opis incydentu |
| `affected_bibs` | INT[] | YES | — | Tablica numerów startowych |
| `is_public` | BOOLEAN | NO | TRUE | Czy widoczny na live feed |
| `occurred_at` | TIMESTAMPTZ | NO | NOW() | Czas wystąpienia |
| `created_at` | TIMESTAMPTZ | NO | NOW() | Czas zapisu w bazie |

### `documents` — Dokumenty

Pliki do pobrania powiązane z wyścigiem lub organizatorem. Fizyczne pliki w Cloudflare R2 (URL w `file_url`).

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `race_id` | UUID | YES | — | FK → races.id (CASCADE); NULL = dokument ogólny |
| `organizer_id` | UUID | YES | — | FK → organizers.id (CASCADE) |
| `name` | TEXT | NO | — | Wyświetlana nazwa |
| `doc_type` | doc_type | NO | — | Typ dokumentu (ENUM) |
| `file_url` | TEXT | NO | — | URL do pobrania (R2/CDN) |
| `file_size_mb` | NUMERIC(6,2) | YES | — | Rozmiar w MB |
| `is_public` | BOOLEAN | NO | TRUE | Czy dostępny publicznie |
| `added_at` | TIMESTAMPTZ | NO | NOW() | Data dodania |

### `ranking_seasons` — Sezony rankingowe

Jeden sezon = zazwyczaj jeden rok. `is_active = TRUE` = aktualnie trwający sezon.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `year` | SMALLINT | NO | — | Rok sezonu — UNIQUE |
| `name` | TEXT | NO | — | Nazwa (np. "Sezon 2025") |
| `is_active` | BOOLEAN | NO | FALSE | Czy aktualny sezon |
| `started_at` | DATE | YES | — | Data rozpoczęcia |
| `ended_at` | DATE | YES | — | Data zakończenia |

### `ranking_points` — Punkty rankingowe

Jeden rekord = jeden wyścig jednego zawodnika. `UNIQUE (season_id, race_id, user_id)`. Do sumarycznego rankingu służy widok `ranking_individual`.

> ⚠️ FK `category_id → race_categories.id` ma `ON DELETE NO ACTION` — jedyny FK bez CASCADE/SET NULL. Usunięcie powiązanej kategorii zwróci błąd — należy najpierw usunąć punkty.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `season_id` | UUID | NO | — | FK → ranking_seasons.id (CASCADE) |
| `race_id` | UUID | NO | — | FK → races.id (CASCADE) |
| `user_id` | UUID | NO | — | FK → users.id (CASCADE) |
| `category_id` | UUID | YES | — | FK → race_categories.id (**NO ACTION**) |
| `points` | INT | NO | 0 | Przyznane punkty |
| `position` | INT | YES | — | Pozycja w wyścigu (kontekst) |
| `awarded_at` | TIMESTAMPTZ | NO | NOW() | Data przyznania |

### `race_staff` — Personel wyścigu

Przypisanie użytkowników do ról w danym wyścigu. PK złożony: `(race_id, user_id, role)` — jeden użytkownik może pełnić wiele ról.

| Kolumna | Typ | Nullable | Opis |
|---------|-----|----------|------|
| `race_id` | UUID | NO | FK → races.id (CASCADE) |
| `user_id` | UUID | NO | FK → users.id (CASCADE) |
| `role` | user_role | NO | Rola w tym wyścigu (ENUM) |
| `notes` | TEXT | YES | Uwagi (np. sektor odpowiedzialności) |

### `notifications` — Powiadomienia

Push/in-app dla użytkowników. `user_id = NULL` = broadcast do wszystkich.

| Kolumna | Typ | Nullable | Default | Opis |
|---------|-----|----------|---------|------|
| `id` | UUID | NO | uuid_generate_v4() | PK |
| `user_id` | UUID | YES | — | FK → users.id (CASCADE); NULL = broadcast |
| `race_id` | UUID | YES | — | FK → races.id (CASCADE); NULL = ogólne |
| `title` | TEXT | NO | — | Tytuł |
| `body` | TEXT | NO | — | Treść |
| `type` | TEXT | YES | — | 'incident' / 'result' / 'registration' / 'info' |
| `is_read` | BOOLEAN | NO | FALSE | Czy przeczytane |
| `sent_at` | TIMESTAMPTZ | NO | NOW() | Czas wysłania |

### Wszystkie pola w `races`

| Kolumna | Typ | Nullable | Default / Uwagi |
|---------|-----|----------|-----------------|
| `id` | uuid | NO | uuid_generate_v4() — PK |
| `organizer_id` | uuid | YES | FK → `organizers.id` ON DELETE SET NULL |
| `name` | text | NO | — |
| `slug` | text | NO | UNIQUE |
| `edition_year` | smallint | YES | — |
| `race_type` | enum `race_type` | NO | `'road'` |
| `status` | enum `race_status` | NO | `'draft'` |
| `race_date` | date | NO | — |
| `race_time_start` | time | YES | czas startu bez strefy czasowej |
| `city` | text | NO | — |
| `region` | text | YES | — |
| `country` | char(2) | YES | domyślnie `'PL'` |
| `distance_km` | numeric(6) | YES | — |
| `elevation_gain_m` | integer | YES | — |
| `max_elevation_m` | integer | YES | — |
| `lap_count` | smallint | YES | — |
| `laps_distance_km` | numeric(5) | YES | — |
| `spots_total` | integer | YES | — |
| `entry_fee_pln` | numeric(8) | YES | — |
| `description` | text | YES | — |
| `registration_opens` | timestamptz | YES | — |
| `registration_closes` | timestamptz | YES | — |
| `gpx_url` | text | YES | — |
| `cover_image_url` | text | YES | — |
| `results_pdf_slot_mode` | text | YES | `NULL \| 'category' \| 'wave'` |
| `regulation_storage_path` | text | YES | ścieżka w R2 |
| `regulation_file_url` | text | YES | publiczny URL |
| `regulation_file_name` | text | YES | oryginalna nazwa pliku |
| `regulation_uploaded_at` | timestamptz | YES | — |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

## 4. Enumeracje (typy własne PostgreSQL)

Wszystkie enumeracje zdefiniowane w schema `public`:

### `user_role`
`rider` | `coach` | `judge_line` | `judge_chief` | `commissaire` | `race_office` | `organizer` | `speaker` | `admin`

Używany w: `users.role`

### `race_status`
`draft` | `published` | `registration_open` | `registration_closed` | `live` | `finished` | `cancelled`

Używany w: `races.status`

### `race_type`
`road` | `criterium` | `gravel` | `mountain` | `track` | `cyclocross`

Używany w: `races.race_type`

### `registration_status`
`pending` | `confirmed` | `withdrawn` | `dns` | `dnf` | `dq`

Używany w: `registrations.status`, `results.status` (default `'confirmed'`), `live_timing.status` (default `'confirmed'`)

> ⚠️ Ten enum jest współdzielony przez 3 tabele — `results` i `live_timing` używają go jako statusu technicznego, nie rejestracyjnego.

### `payment_status`
`pending` | `paid` | `refunded` | `failed`

Używany w: `payments.status`

### `doc_type`
`regulation` | `startlist` | `map` | `results_pdf` | `other`

Używany w: `documents.doc_type`

### `incident_type`
`crash` | `withdrawal` | `mechanical` | `penalty` | `dq` | `info`

Używany w: `incidents.incident_type`

---

## 5. Widoki (Views)

### `ranking_individual`

Widok agregujący dane rankingowe zawodników. Nie jest tabelą — nie ma własnego PK ani indeksów.

Kolumny widoku:

| Kolumna | Typ | Opis |
|---------|-----|------|
| `season_id` | uuid | powiązanie z `ranking_seasons` |
| `year` | smallint | rok sezonu |
| `user_id` | uuid | powiązanie z `users` |
| `rider_name` | text | imię i nazwisko zawodnika |
| `club` | text | klub |
| `total_points` | bigint | suma punktów w sezonie |
| `races_counted` | bigint | liczba wyścigów punktowanych |
| `wins` | bigint | liczba zwycięstw |
| `podiums` | bigint | liczba podium |
| `position` | bigint | pozycja w rankingu |

---

## 6. Uwagi o kluczach obcych i integralności danych

### Reguły usuwania (ON DELETE)

Większość FK używa `CASCADE` lub `SET NULL`. Wyjątek:

| FK | Reguła | Konsekwencja |
|----|--------|--------------|
| `ranking_points.category_id → race_categories.id` | **NO ACTION** | Usunięcie kategorii powiązanej z punktami rankingowymi zwróci błąd FK — należy najpierw usunąć punkty |
| `races.organizer_id → organizers.id` | SET NULL | Usunięcie organizatora nie usuwa wyścigu |
| `incidents.reported_by → users.id` | SET NULL | Usunięcie użytkownika nie usuwa zgłoszenia incydentu |

### Redundantne indeksy

UNIQUE constraint w PostgreSQL automatycznie tworzy indeks. Poniższe pary są zduplikowane (oba indeksy istnieją równocześnie):

| Tabela | Kolumna | Indeks UNIQUE | Indeks ręczny |
|--------|---------|---------------|---------------|
| `users` | `email` | `users_email_key` | `idx_users_email` |
| `users` | `license_number` | `users_license_number_key` | `idx_users_license` |
| `races` | `slug` | `races_slug_key` | `idx_races_slug` |

Nie powoduje błędów, ale każdy duplikat spowalnia INSERT/UPDATE i zajmuje miejsce.

---

## 7. Relacje między tabelami

| Tabela źródłowa | Tabela docelowa | Typ | Opis |
|-----------------|-----------------|-----|------|
| `organizers` | `races` | 1→N | Organizator prowadzi wiele wyścigów |
| `organizers` | `organizer_members` | 1→N | Organizator ma wielu członków |
| `users` | `organizer_members` | 1→N | Użytkownik może zarządzać wieloma organizatorami |
| `races` | `race_categories` | 1→N | Wyścig ma wiele kategorii startowych |
| `races` | `race_start_waves` | 1→N | Wyścig ma wiele fal startu |
| `race_start_waves` | `race_start_wave_categories` | 1→N | Fala grupuje wiele kategorii |
| `race_categories` | `race_start_wave_categories` | 1→1 | Kategoria należy max do jednej fali |
| `races` | `registrations` | 1→N | Wyścig przyjmuje wiele zapisów |
| `users` | `registrations` | 1→N | Zawodnik zapisuje się na wiele wyścigów |
| `race_categories` | `registrations` | 1→N | Kategoria skupia wielu zawodników |
| `registrations` | `payments` | 1→N | Zapis może mieć wiele prób płatności |
| `races` | `results` | 1→N | Wyścig ma wiele wyników |
| `registrations` | `results` | 1→1 | Zapis ma jeden wynik końcowy |
| `users` | `results` | 1→N | Zawodnik może mieć wyniki z wielu wyścigów |
| `races` | `live_timing` | 1→N | Wyścig ma wiele rekordów live timingu |
| `races` | `incidents` | 1→N | Wyścig może mieć wiele incydentów |
| `users` | `incidents` | 1→N | Sędzia może zgłosić wiele incydentów |
| `races` | `documents` | 1→N | Wyścig może mieć wiele dokumentów |
| `organizers` | `documents` | 1→N | Organizator może mieć dokumenty ogólne |
| `ranking_seasons` | `ranking_points` | 1→N | Sezon gromadzi wszystkie punkty |
| `races` | `ranking_points` | 1→N | Wyścig generuje punkty rankingowe |
| `users` | `ranking_points` | 1→N | Zawodnik zbiera punkty z wielu wyścigów |
| `races` | `race_staff` | 1→N | Wyścig ma przypisany personel |
| `users` | `race_staff` | 1→N | Użytkownik może być personelem wielu wyścigów |
| `users` | `notifications` | 1→N | Użytkownik otrzymuje powiadomienia |

---

## 8. Kluczowe flow aplikacji

### Zapis zawodnika na wyścig (z płatnością)

1. `INSERT INTO registrations` → `status = 'pending'`
2. `INSERT INTO payments` → `status = 'pending'` + redirect do Przelewy24/Stripe
3. Webhook płatności → `UPDATE payments SET status = 'paid'`
4. `UPDATE registrations SET status = 'confirmed', confirmed_at = NOW()`
5. `INSERT INTO notifications` + wysyłka email

### Przydzielanie numerów startowych (biuro zawodów)

1. `SELECT` z `registrations WHERE race_id = X AND status = 'confirmed' ORDER BY category_id, registered_at`
2. `UPDATE registrations SET bib_number = (bib_start + row_number)` per kategoria
3. Inicjalizacja rekordów w `live_timing` dla każdego zawodnika

### Live timing (podczas wyścigu)

1. Transponder RFID/GPS wysyła pozycję do API
2. `INSERT INTO live_timing ON CONFLICT (race_id, bib_number) DO UPDATE`
3. WebSocket broadcast do klientów (Pusher / Supabase Realtime)
4. Frontend odbiera event → aktualizuje widok bez przeładowania

### Obliczanie rankingu (po wyścigu)

1. `INSERT INTO ranking_points` — punkty per pozycja per kategoria per sezon
2. Widok `ranking_individual` agreguje `SUM(points)` z `RANK() OVER (PARTITION BY season_id ORDER BY SUM(points) DESC)`
3. Query: `SELECT * FROM ranking_individual WHERE year = 2025 ORDER BY position`

---

## 9. Dane testowe (seed)

Plik `database/schema.sql` zawiera dane startowe:

- **1 organizator**: Silesia Cycling Club
- **1 sezon rankingowy**: 2025
- **6 użytkowników**: admin, 3 zawodników, sędzia główny, biuro zawodów
- **3 wyścigi**: Tour de Silesia E1, Kraków GP, Dolnośląski Criterium
- **5 kategorii startowych**
- **3 zapisy testowe** (zawodnicy na Tour de Silesia)
- **3 dokumenty** (regulaminy, mapa)
- **Personel wyścigu** (sędzia + biuro)

> Stan bazy po audycie 2026-05-06: 8 wyścigów live, 41 kategorii, 1 użytkownik, 1 organizator — reszta tabel pusta (środowisko testowe).

---

## 10. Kategorie i fale startu

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

## 11. Wyniki PDF (Blob) - aktualna logika

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

## 12. Endpointy API (admin + wyniki)

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

## 13. Panel Admin - aktualne zasady list

- `Edytuj wyścig`: tylko bieżący rok
- `Wstaw wyniki`: tylko bieżący rok
- `Historia`: tylko lata wcześniejsze
- We wszystkich 3 listach kolejność: od najnowszego do najstarszego

## 14. Walidacje UX w formularzach wyścigu

- Brak daty: browser/HTML5 oznacza pole i przewija do błędu
- Pusta nazwa kategorii:
  - pole nazwy kategorii zaznaczane na czerwono
  - formularz przewija i focusuje pierwszy błędny input
- Brak jakiejkolwiek kategorii:
  - brak toasta błędu
  - przycisk `+ Dodaj kategorię` dostaje czerwone obramowanie

## 15. Uwaga operacyjna (migracje)

- Dla pełnej funkcji trybu PDF zalecana migracja:
  - `database/migrations/20260209_races_results_pdf_slot_mode.sql`
- Kod ma fallback dla środowisk, gdzie kolumna `results_pdf_slot_mode` jeszcze nie istnieje.

## 16. Pliki, które najczęściej trzeba sprawdzać przy regresjach

- `src/components/admin/AdminResultsTab.tsx`
- `src/components/admin/AdminEditRaceTab.tsx`
- `src/components/admin/AdminHistoryTab.tsx`
- `src/components/results/ResultsCategoriesBody.tsx`
- `src/lib/raceDb.ts`
- `src/lib/results.ts`
- `src/app/api/results/route.ts`
- `src/app/api/admin/results/upload/route.ts`

## 17. Uzupełnienia po zmianach w kodzie

### Storage / pliki

- Warstwa storage jest oparta o Cloudflare R2 (`src/lib/objectStore.ts`).
- Publiczny dostęp do plików:
  - przez `R2_PUBLIC_BASE_URL` (gdy bucket publiczny), albo
  - przez proxy `GET /api/storage/file?key=...` (fallback dla bucketu prywatnego).

### Ścieżki plików w storage

- Wyniki PDF:
  - aktualny root: `wyscigi_{rok}/...`
  - legacy root nadal wspierany przy odczycie: `wyniki/...`
- Listy startowe:
  - `listy_startowe/{rok}/{slug}/kategorie/{categoryId}/plik.pdf`
- Regulamin:
  - `wyscigi_{rok}/{slug}/regulamin/plik.pdf`

### Dodatkowe endpointy API

- Szablony kategorii:
  - `GET /api/category-templates`
- Regulamin wyścigu (PDF):
  - `POST /api/admin/races/[id]/regulation/upload`
  - `DELETE /api/admin/races/[id]/regulation/upload`
- Listy startowe (PDF per kategoria):
  - `POST /api/admin/races/[id]/startlists/upload`
  - `DELETE /api/admin/races/[id]/startlists/upload?categoryId=...`
  - `GET /api/startlists?raceId=...`
- Operacje na wynikach:
  - `DELETE /api/admin/races/[id]/results` (usuwa wszystkie pliki wyników dla wyścigu)
- Auth:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- Kontakt:
  - `POST /api/contact` (SMTP/Nodemailer)

### Dodatkowe migracje operacyjne

- `database/migrations/20260207_category_templates.sql` - tabela i seed szablonów kategorii.
- `database/migrations/20260210_races_regulation_blob.sql` - dodanie kolumn regulaminu.
- `database/migrations/20260505_races_regulation_neutral_columns.sql` - rename kolumn `regulation_blob_*` do neutralnych `regulation_*`.

### Dodatkowe zachowanie UX

- `AdminEditRaceTab` ma modal ochrony przed utratą danych:
  - akcje: zapisz / odrzuć / anuluj.

