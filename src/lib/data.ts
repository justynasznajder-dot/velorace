import type { Race, RaceResult, LiveRace, RankingEntry, Document } from './types'

// ── Races (statyczny fallback; kalendarz publiczny może też brać dane z API / bazy) ──
export const RACES: Race[] = []

// ── Latest results (puste — wyniki z Blob / panel admina po dodaniu wyścigu) ──
export const LATEST_RESULTS: RaceResult[] = []

export function getLatestResultByRaceId(raceId: string): RaceResult | undefined {
  return LATEST_RESULTS.find(r => r.raceId === raceId)
}

// ── Live race ──────────────────────────────────────────
export const LIVE_RACE: LiveRace = {
  raceId: 'dolnoslaski-criterium-2025',
  raceName: 'Dolnośląski Criterium',
  city: 'Wrocław',
  currentKm: 34,
  totalKm: 60,
  currentLap: 7,
  totalLaps: 12,
  status: 'live',
  riders: [
    { position: 1, bibNumber: 42, riderName: 'Kowalski M.',    team: 'Team Silesia',  time: '1:24:38', gap: '—',     gapTrend: 'stable'  },
    { position: 2, bibNumber: 17, riderName: 'Nowak P.',       team: 'Kraków Velo',   time: '1:24:51', gap: '+0:13', gapTrend: 'gaining' },
    { position: 3, bibNumber: 8,  riderName: 'Wiśniewski T.',  team: 'WKK Wrocław',   time: '1:24:59', gap: '+0:21', gapTrend: 'stable'  },
    { position: 4, bibNumber: 23, riderName: 'Adamski R.',     team: 'Legia Bike',    time: '1:25:22', gap: '+0:44', gapTrend: 'losing'  },
    { position: 5, bibNumber: 31, riderName: 'Jabłoński S.',   team: 'Pogoń Cycling', time: '1:25:30', gap: '+0:52', gapTrend: 'stable'  },
  ],
  incidents: [
    {
      id: 'inc-1',
      timestamp: '14:23:07',
      km: 34,
      type: 'crash',
      text: '#88 Zając — kraksa, wycofany z wyścigu',
    },
  ],
}

// ── Rankings ───────────────────────────────────────────
export const RANKINGS_INDIVIDUAL: RankingEntry[] = [
  { position: 1, name: 'M. Kowalski',    team: 'Team Silesia',  points: 284, wins: 3, podiums: 5 },
  { position: 2, name: 'P. Nowak',       team: 'Kraków Velo',   points: 241, wins: 2, podiums: 4 },
  { position: 3, name: 'T. Wiśniewski',  team: 'WKK Wrocław',   points: 219, wins: 1, podiums: 4 },
  { position: 4, name: 'R. Adamski',     team: 'Legia Bike',    points: 198, wins: 1, podiums: 2 },
  { position: 5, name: 'S. Jabłoński',   team: 'Pogoń Cycling', points: 175, wins: 0, podiums: 3 },
]

export const RANKINGS_TEAM: RankingEntry[] = [
  { position: 1, name: 'Team Silesia',  points: 612, wins: 5 },
  { position: 2, name: 'Kraków Velo',   points: 544, wins: 3 },
  { position: 3, name: 'WKK Wrocław',   points: 489, wins: 2 },
  { position: 4, name: 'CCC Dev.',      points: 421, wins: 2 },
  { position: 5, name: 'Legia Bike',    points: 388, wins: 1 },
]

export const RANKINGS_MASTERS: RankingEntry[] = [
  { position: 1, name: 'A. Brzozowski',  team: 'Masters PL',    points: 198, wins: 2 },
  { position: 2, name: 'J. Karpowicz',   team: 'Velo Masters',  points: 176, wins: 1 },
  { position: 3, name: 'R. Stępień',     team: 'Kraków Velo',   points: 154, wins: 1 },
  { position: 4, name: 'M. Dąbrowski',   team: 'Silesia 30+',   points: 132, wins: 0 },
  { position: 5, name: 'T. Kulczyk',     team: 'Poznan Bike',   points: 118, wins: 0 },
]

// ── Documents ──────────────────────────────────────────
export const DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    name: 'Regulamin — Tour de Silesia 2025',
    raceId: 'tour-silesia-2025-e1',
    type: 'regulation',
    fileSizeMb: 1.2,
    addedDate: '2025-04-28',
    downloadUrl: '/docs/regulamin-tour-de-silesia-2025.pdf',
  },
  {
    id: 'doc-2',
    name: 'Lista startowa — Kraków Grand Prix',
    raceId: 'krakow-gp-2025',
    type: 'startlist',
    fileSizeMb: 0.4,
    addedDate: '2025-05-10',
    downloadUrl: '/docs/lista-krakow-gp-2025.pdf',
  },
  {
    id: 'doc-3',
    name: 'Mapa trasy — Etap 1 Tour de Silesia',
    raceId: 'tour-silesia-2025-e1',
    type: 'map',
    fileSizeMb: 3.8,
    addedDate: '2025-05-01',
    downloadUrl: '/docs/mapa-tour-silesia-e1.pdf',
  },
  {
    id: 'doc-4',
    name: 'Regulamin — Kraków Grand Prix 2025',
    raceId: 'krakow-gp-2025',
    type: 'regulation',
    fileSizeMb: 0.9,
    addedDate: '2025-04-25',
    downloadUrl: '/docs/regulamin-krakow-gp-2025.pdf',
  },
]

// ── Helpers ────────────────────────────────────────────
export function getNextRace(): Race | undefined {
  const today = new Date()
  return RACES
    .filter(r => r.status === 'open' || r.status === 'soon')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .find(r => new Date(r.date) >= today)
}

export function spotsLeft(race: Race): number {
  return race.spotsTotal - race.spotsTaken
}

export function formatDate(isoDate: string): { day: string; month: string; full: string } {
  const d = new Date(isoDate)
  const months = ['STY','LUT','MAR','KWI','MAJ','CZE','LIP','SIE','WRZ','PAŹ','LIS','GRU']
  return {
    day: String(d.getDate()),
    month: months[d.getMonth()],
    full: d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export function docTypeIcon(type: Document['type']): string {
  const map: Record<Document['type'], string> = {
    regulation: '📄',
    startlist:  '📋',
    map:        '🗺️',
    results_pdf:'🏆',
    other:      '📁',
  }
  return map[type]
}
