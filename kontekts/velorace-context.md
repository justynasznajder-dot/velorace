# VeloRace — Pełny kontekst aplikacji

> Plik kontekstowy dla AI. Zawiera architekturę, strukturę plików, komponenty, typy danych i schemat bazy danych.
> Wygenerowano: 2025

---

## 1. Opis projektu

**VeloRace** to platforma SaaS do zarządzania wyścigami kolarskimi. Umożliwia:
- Publiczny portal: zapisy na wyścigi, wyniki, live timing, regulaminy
- Panel wewnętrzny: różne widoki per rola (biuro zawodów, sędzia, komisarz, trener itd.)
- Aplikacja mobilna (planowana): real-time komunikacja sędziów/biura zawodów

**Stack technologiczny:**
- Framework: **Next.js 14** (App Router, TypeScript)
- Baza danych: **Neon** (PostgreSQL w chmurze)
- ORM: (do dodania — Prisma lub Drizzle)
- Stylowanie: **CSS Modules** (bez Tailwind)
- Fonty: Barlow Condensed + Barlow (Google Fonts)
- Kolory: czarny `#0C0C0C` + czerwony `#D40000`
- Auth: (do dodania — NextAuth.js)
- Płatności: (do dodania — Przelewy24 / Stripe)
- Real-time: (do dodania — Pusher / Supabase Realtime)
- Deployment: Vercel

---

## 2. Struktura plików

```
velorace/
├── package.json
├── tsconfig.json
├── next.config.js
├── .gitignore
├── README.md
├── database/
│   └── schema.sql                  ← pełny schemat PostgreSQL + seed data
└── src/
    ├── styles/
    │   └── globals.css             ← CSS variables, reset, animacje globalne
    ├── lib/
    │   ├── types.ts                ← TypeScript interfaces (Race, Result, LiveRace itd.)
    │   └── data.ts                 ← Mock data + helper functions
    ├── app/                        ← Next.js App Router
    │   ├── layout.tsx              ← Root layout (html, body, import globals.css)
    │   ├── page.tsx                ← Strona główna /
    │   ├── page.module.css         ← Grid layout: main (1fr) + sidebar (320px)
    │   ├── not-found.tsx           ← 404
    │   ├── wyniki/
    │   │   ├── page.tsx            ← /wyniki — lista wyników wyścigów
    │   │   └── page.module.css
    │   ├── kalendarz/
    │   │   └── page.tsx            ← /kalendarz — pełny kalendarz wyścigów
    │   ├── live/
    │   │   └── page.tsx            ← /live — live timing + embed streamu
    │   ├── regulaminy/
    │   │   └── page.tsx            ← /regulaminy — dokumenty do pobrania
    │   ├── rankingi/
    │   │   └── page.tsx            ← /rankingi — rankingi sezonowe
    │   ├── kontakt/
    │   │   ├── page.tsx
    │   │   └── page.module.css
    │   ├── zapisy/
    │   │   ├── page.tsx            ← /zapisy — lista otwartych zapisów z paskiem miejsc
    │   │   ├── page.module.css
    │   │   └── [id]/
    │   │       ├── page.tsx        ← /zapisy/[id] — formularz zapisu na konkretny wyścig
    │   │       └── page.module.css
    │   └── wysciegi/
    │       └── [id]/
    │           ├── page.tsx        ← /wysciegi/[id] — szczegóły wyścigu + profil trasy
    │           └── page.module.css
    └── components/
        ├── layout/
        │   ├── Navbar.tsx + .module.css    ← sticky nav, aktywny link, live dot
        │   └── Footer.tsx + .module.css    ← 4 kolumny linków
        ├── home/
        │   ├── Notice.tsx + .module.css    ← zamykany baner alertu
        │   ├── QuickLinks.tsx + .module.css← 3 przyciski: Wyniki, Zgłoszenia, Live
        │   └── CountdownWidget.tsx + .css  ← odliczanie do następnego wyścigu (client)
        ├── races/
        │   └── UpcomingRaces.tsx + .css    ← lista wyścigów z datą, meta, tagami statusu
        ├── results/
        │   └── LatestResults.tsx + .css    ← ostatnie wyniki z podium i stopką PDF
        ├── live/
        │   └── LiveWidget.tsx + .css       ← sidebar live timing z incydentami
        ├── rankings/
        │   └── RankingsWidget.tsx + .css   ← zakładki: Indyw./Drużyny/Masters (client)
        └── shared/
            ├── Widget.tsx + .css           ← wrapper z nagłówkiem i linkiem "więcej"
            ├── DocumentsList.tsx + .css    ← lista dokumentów PDF z przyciskiem pobierz
            └── RiderSearch.tsx + .css      ← formularz wyszukiwarki zawodnika (client)
```

---

## 3. CSS Variables (globals.css)

```css
:root {
  --black:   #0C0C0C;   /* tło główne */
  --dark:    #111111;   /* tło sekcji */
  --surface: #171717;   /* karty, widgety */
  --surf2:   #1D1D1D;   /* nagłówki widgetów, hover */
  --border:  #272727;   /* linie podziału */
  --red:     #D40000;   /* akcent główny */
  --red-b:   #FF1A1A;   /* akcent jasny (hover) */
  --red-dim: rgba(212,0,0,0.12); /* tło tagów */
  --white:   #FFFFFF;
  --text:    #E2E2E2;   /* tekst główny */
  --muted:   #636363;   /* tekst drugorzędny */
  --stone:   #444444;   /* tekst trzeciorzędny */
}
```

---

## 4. TypeScript Types (src/lib/types.ts)

```typescript
type RaceStatus = 'open' | 'soon' | 'live' | 'finished'
type RaceCategory = 'Elita/U23' | 'Masters 30+' | 'U19/Elita' | 'Open' | 'Open Gravel'

interface Race {
  id: string
  name: string
  date: string           // ISO "2025-05-12"
  city: string
  distance: number       // km
  category: RaceCategory
  status: RaceStatus
  spotsTotal: number
  spotsTaken: number
  elevationGain?: number
  maxElevation?: number
  type?: 'road' | 'criterium' | 'gravel' | 'mountain'
}

interface ResultEntry {
  position: number
  riderName: string
  team: string
  time: string           // "3:21:44"
  gap: string            // "+0:13" lub "—"
  bibNumber?: number
}

interface RaceResult {
  raceId: string
  raceName: string
  date: string
  distance: number
  totalRiders: number
  entries: ResultEntry[]
}

interface LiveEntry {
  position: number
  bibNumber: number
  riderName: string
  team: string
  time: string
  gap: string
  gapTrend?: 'gaining' | 'losing' | 'stable'
}

interface LiveIncident {
  id: string
  timestamp: string
  km: number
  type: 'crash' | 'withdrawal' | 'penalty' | 'mechanical' | 'info'
  text: string
}

interface LiveRace {
  raceId: string
  raceName: string
  city: string
  currentKm: number
  totalKm: number
  currentLap?: number
  totalLaps?: number
  status: 'live' | 'finished' | 'not_started'
  riders: LiveEntry[]
  incidents: LiveIncident[]
}

type RankingType = 'individual' | 'team' | 'masters'

interface RankingEntry {
  position: number
  name: string
  team?: string
  points: number
  wins?: number
  podiums?: number
}

type DocType = 'regulation' | 'startlist' | 'map' | 'results_pdf' | 'other'

interface Document {
  id: string
  name: string
  raceId?: string
  type: DocType
  fileSizeMb: number
  addedDate: string
  downloadUrl: string
}
```

---

## 5. Helper functions (src/lib/data.ts)

```typescript
getNextRace()     // → Race | undefined — najbliższy wyścig ze statusem open/soon
spotsLeft(race)   // → number — wolne miejsca
formatDate(iso)   // → { day, month, full } — np. { day: "12", month: "MAJ", full: "12 maja 2025" }
docTypeIcon(type) // → string emoji ikony dla typu dokumentu
```

---

## 6. Role użytkowników

| Rola | Klucz | Opis |
|------|-------|------|
| Zawodnik | `rider` | Zapisy, wyniki własne, profil, historia startów |
| Trener | `coach` | Widok swojej drużyny, wycofania zawodników |
| Sędzia liniowy | `judge_line` | App mobilna — raportowanie incydentów na trasie |
| Sędzia główny | `judge_chief` | Protokół wyścigu, kary czasowe, wykluczenia (DQ) |
| Komisarz techniczny | `commissaire` | Lista kontrolna sprzętu, naruszenia tech. |
| Biuro zawodów | `race_office` | Pełny panel: numery startowe, grupy, listy startowe |
| Speaker | `speaker` | Podgląd live: pozycje, incydenty, czasy |
| Organizator | `organizer` | Kreator wyścigu, regulaminy, płatności, dokumenty |
| Administrator | `admin` | Zarządzanie całą platformą i organizatorami |

---

## 7. Strony i routing

| URL | Komponent | Opis |
|-----|-----------|------|
| `/` | `app/page.tsx` | Strona główna: notice, quicklinks, wyścigi, wyniki, dokumenty + sidebar |
| `/wyniki` | `app/wyniki/page.tsx` | Lista wyników |
| `/kalendarz` | `app/kalendarz/page.tsx` | Pełny kalendarz wyścigów |
| `/live` | `app/live/page.tsx` | Live timing + embed streamu |
| `/regulaminy` | `app/regulaminy/page.tsx` | Dokumenty do pobrania |
| `/rankingi` | `app/rankingi/page.tsx` | Rankingi sezonowe |
| `/kontakt` | `app/kontakt/page.tsx` | Dane kontaktowe |
| `/zapisy` | `app/zapisy/page.tsx` | Lista otwartych zapisów z paskiem wypełnienia |
| `/zapisy/[id]` | `app/zapisy/[id]/page.tsx` | Formularz zapisu + info o wyścigu sidebar |
| `/wysciegi/[id]` | `app/wysciegi/[id]/page.tsx` | Szczegóły wyścigu + profil trasy SVG |

---

## 8. Komponenty — szczegóły

### Navbar
- Sticky, czarne tło, czerwona linia na dole (border-bottom)
- Aktywny link: kolor biały + czerwona kreska pod spodem (::after)
- Link "Live" ma animowaną czerwoną kropkę
- Prawa strona: wyszukiwarka + przycisk "Zaloguj się"

### Widget (shared wrapper)
- Nagłówek z czerwonym paskiem 3px po lewej (::before)
- Opcjonalny link "więcej" po prawej

### QuickLinks
- 3 przyciski w rzędzie (grid 3 kolumny)
- Ikona 48px w czarnym tle + label 18px + subtitle
- Hover: czerwona ramka ikony + ciemniejsze tło

### UpcomingRaces
- Grid: data (56px) | info | dystans+miejsca
- Kolumna daty: dzień 26px bold + miesiąc czerwony
- Tagi statusu: `open` (czerwony), `soon` (szary), `live` (pulsujący czerwony)
- Hover: strzałka → pojawia się animowana

### LiveWidget
- Czerwony nagłówek z nazwą wyścigu i statusem km
- Każdy zawodnik: pozycja (czerwona) | imię/drużyna | czas/gap
- gap "gaining" = zielony
- Incydent: czerwony pasek z lewej strony z opisem
- Stopka: "Pełny live timing →" — hover zmienia tło na czerwone

### RankingsWidget (client)
- 3 zakładki: Indyw. / Drużyny / Masters
- Pozycje 1-3: czerwone, reszta szare
- Kliknięcie zakładki zmienia dane (useState)

### CountdownWidget (client)
- useEffect + setInterval co 60s
- Target: data następnego wyścigu o 8:00
- Format: DD : HH : MM

---

## 9. Następne kroki do implementacji

### Priorytet 1 — Backend
```bash
npm install @neondatabase/serverless
npm install drizzle-orm drizzle-kit   # lub prisma
```
- Zastąp `src/lib/data.ts` (mock) wywołaniami do bazy przez `src/lib/db.ts`
- Dodaj `src/app/api/` routes

### Priorytet 2 — Auth
```bash
npm install next-auth @auth/core
```
- Plik: `src/app/api/auth/[...nextauth]/route.ts`
- Middleware: `src/middleware.ts` — ochrona tras per rola

### Priorytet 3 — Płatności
```bash
npm install # Przelewy24 SDK lub stripe
```
- Route: `src/app/api/payments/`

### Priorytet 4 — Real-time live timing
```bash
npm install pusher-js
# lub
npm install @supabase/supabase-js
```
- Zastąp statyczny `LIVE_RACE` w `LiveWidget.tsx` WebSocket subskrypcją

### Priorytet 5 — Aplikacja mobilna
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init VeloRace pl.velorace.app
npx cap add android
```

---

## 10. Zmienne środowiskowe (.env.local)

```bash
# Baza danych
DATABASE_URL="postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/velorace?sslmode=require"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="twoj-sekret-min-32-znaki"

# Płatności
PRZELEWY24_MERCHANT_ID=""
PRZELEWY24_POS_ID=""
PRZELEWY24_CRC=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Real-time
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
```
