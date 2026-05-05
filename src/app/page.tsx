import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Notice from '@/components/home/Notice'
import QuickLinks from '@/components/home/QuickLinks'
import UpcomingRaces from '@/components/races/UpcomingRaces'
import DocumentsList from '@/components/shared/DocumentsList'
import LiveWidget from '@/components/live/LiveWidget'
import RankingsWidget from '@/components/rankings/RankingsWidget'
import RiderSearch from '@/components/shared/RiderSearch'
import CountdownWidget from '@/components/home/CountdownWidget'
import { listHomePageRacesCurrentYear } from '@/lib/raceDb'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

const HOME_SECTIONS_VISIBILITY = {
  notice: false,
  upcomingRaces: true,
  documentsList: false,
  liveWidget: false,
  rankingsWidget: false,
  riderSearch: false,
} as const

export default async function HomePage() {
  const upcomingRaces = await listHomePageRacesCurrentYear()
  const nextRace = upcomingRaces[0] ?? null

  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.todayDate}>Dzisiaj: {today}</div>
        {/* ── Main column ── */}
        <div className={styles.mainCol}>
          {HOME_SECTIONS_VISIBILITY.notice && <Notice />}
          <QuickLinks />
          {HOME_SECTIONS_VISIBILITY.upcomingRaces && <UpcomingRaces limitPerSection={5} />}
          {HOME_SECTIONS_VISIBILITY.documentsList && <DocumentsList />}
        </div>

        {/* ── Sidebar ── */}
        <aside className={styles.sideCol}>
          {HOME_SECTIONS_VISIBILITY.liveWidget && <LiveWidget />}
          {HOME_SECTIONS_VISIBILITY.rankingsWidget && <RankingsWidget />}
          {HOME_SECTIONS_VISIBILITY.riderSearch && <RiderSearch />}
          <CountdownWidget race={nextRace} />
        </aside>
      </main>
      <Footer />
    </>
  )
}
