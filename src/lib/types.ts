// ── Races ──────────────────────────────────────────────
export type RaceStatus = 'open' | 'soon' | 'live' | 'finished'
export type RaceCategory = 'Elita/U23' | 'Masters 30+' | 'U19/Elita' | 'Open' | 'Open Gravel'

export interface Race {
  id: string
  name: string
  date: string          // ISO date string
  city: string
  distance: number      // km
  category: RaceCategory
  status: RaceStatus
  spotsTotal: number
  spotsTaken: number
  elevationGain?: number   // metres
  maxElevation?: number    // metres
  type?: 'road' | 'criterium' | 'gravel' | 'mountain'
}

// ── Results ────────────────────────────────────────────
export interface ResultEntry {
  position: number
  riderName: string
  team: string
  time: string          // e.g. "3:21:44"
  gap: string           // e.g. "+0:13" or "—"
  bibNumber?: number
}

export interface RaceResult {
  raceId: string
  raceName: string
  date: string
  distance: number
  totalRiders: number
  entries: ResultEntry[]
}

// ── Live timing ────────────────────────────────────────
export interface LiveEntry {
  position: number
  bibNumber: number
  riderName: string
  team: string
  time: string
  gap: string
  gapTrend?: 'gaining' | 'losing' | 'stable'
}

export interface LiveIncident {
  id: string
  timestamp: string     // e.g. "14:23:07"
  km: number
  type: 'crash' | 'withdrawal' | 'penalty' | 'mechanical' | 'info'
  text: string
}

export interface LiveRace {
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

// ── Rankings ───────────────────────────────────────────
export type RankingType = 'individual' | 'team' | 'masters'

export interface RankingEntry {
  position: number
  name: string           // rider or team name
  team?: string          // for individual rankings
  points: number
  wins?: number
  podiums?: number
}

// ── Documents ──────────────────────────────────────────
export type DocType = 'regulation' | 'startlist' | 'map' | 'results_pdf' | 'other'

export interface Document {
  id: string
  name: string
  raceId?: string
  type: DocType
  fileSizeMb: number
  addedDate: string      // ISO date string
  downloadUrl: string
}

// ── Navigation ─────────────────────────────────────────
export interface NavLink {
  label: string
  href: string
  isLive?: boolean
}
