# VeloRace — Portal wyścigów kolarskich

Portal do zarządzania wyścigami kolarskimi zbudowany w **Next.js 14** (App Router) + **TypeScript**.

---

## 🚀 Uruchomienie

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom tryb dev
npm run dev

# 3. Otwórz http://localhost:3000
```

---

## 📁 Struktura projektu

```
src/
├── app/                        # Next.js App Router — strony
│   ├── layout.tsx              # Root layout (html, body, globals.css)
│   ├── page.tsx                # Strona główna
│   ├── page.module.css         # Layout grid (main + sidebar)
│   ├── not-found.tsx           # 404
│   ├── wyniki/                 # /wyniki — lista wyników
│   ├── kalendarz/              # /kalendarz — kalendarz wyścigów
│   ├── live/                   # /live — live timing + stream
│   ├── regulaminy/             # /regulaminy — dokumenty
│   ├── rankingi/               # /rankingi — rankingi sezonowe
│   ├── kontakt/                # /kontakt
│   ├── zapisy/
│   │   ├── page.tsx            # /zapisy — lista otwartych zapisów
│   │   └── [id]/page.tsx       # /zapisy/[id] — formularz zapisu
│   └── wysciegi/
│       └── [id]/page.tsx       # /wysciegi/[id] — szczegóły wyścigu
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx + .module.css
│   │   └── Footer.tsx + .module.css
│   ├── home/
│   │   ├── Notice.tsx          # Baner z alertem (zamykany)
│   │   ├── QuickLinks.tsx      # 3 przyciski: Wyniki, Zgłoszenia, Live
│   │   └── CountdownWidget.tsx # Odliczanie do następnego wyścigu
│   ├── races/
│   │   └── UpcomingRaces.tsx   # Lista nadchodzących wyścigów
│   ├── results/
│   │   └── LatestResults.tsx   # Ostatnie wyniki z podium
│   ├── live/
│   │   └── LiveWidget.tsx      # Live timing sidebar
│   ├── rankings/
│   │   └── RankingsWidget.tsx  # Rankingi z zakładkami
│   └── shared/
│       ├── Widget.tsx          # Wrapper z nagłówkiem
│       ├── DocumentsList.tsx   # Lista dokumentów PDF
│       └── RiderSearch.tsx     # Wyszukiwarka zawodnika
│
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   └── data.ts                 # Mock data + helper functions
│
└── styles/
    └── globals.css             # CSS variables, reset, animacje
```

---

## 🎨 Design

- **Kolory**: Czarny `#0C0C0C` + czerwony `#D40000` jako akcent
- **Fonty**: Barlow Condensed (nagłówki) + Barlow (tekst) — Google Fonts
- **CSS**: CSS Modules (`.module.css`) per komponent — brak Tailwind, pełna kontrola

---

## 🔌 Następne kroki / integracje

### Backend / API
- Zastąp dane w `src/lib/data.ts` wywołaniami do własnego API lub Supabase
- Dodaj `src/app/api/` routes dla operacji serwerowych

### Autentykacja
```bash
npm install next-auth
```
Skonfiguruj w `src/app/api/auth/[...nextauth]/route.ts`

### Płatności (Przelewy24 / Stripe)
```bash
npm install stripe
```

### Real-time live timing (WebSocket)
```bash
npm install pusher-js
# lub
npm install @supabase/supabase-js  # Supabase Realtime
```

### Aplikacja mobilna
Projekt jest gotowy do opakowania w **Capacitor**:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init
npx cap add android
```

---

## 📱 Role użytkowników (do zaimplementowania)

| Rola | Opis |
|------|------|
| Zawodnik | Zapisy, wyniki własne, profil |
| Trener | Widok drużyny, wycofania |
| Sędzia liniowy | App mobilna — raportowanie incydentów |
| Sędzia główny | Protokół, kary, DQ |
| Komisarz tech. | Kontrole sprzętu |
| Biuro zawodów | Pełny panel zarządzania |
| Organizator | Kreator wyścigów, płatności |
| Administrator | Zarządzanie platformą |
