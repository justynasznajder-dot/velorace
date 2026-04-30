import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Notice from '@/components/home/Notice'
import QuickLinks from '@/components/home/QuickLinks'
import UpcomingRaces from '@/components/races/UpcomingRaces'
import LatestResults from '@/components/results/LatestResults'
import DocumentsList from '@/components/shared/DocumentsList'
import LiveWidget from '@/components/live/LiveWidget'
import RankingsWidget from '@/components/rankings/RankingsWidget'
import RiderSearch from '@/components/shared/RiderSearch'
import CountdownWidget from '@/components/home/CountdownWidget'
import styles from './page.module.css'

const HOME_SECTIONS_VISIBILITY = {
  notice: false,
  upcomingRaces: true,
  documentsList: false,
  liveWidget: false,
  rankingsWidget: false,
  riderSearch: false,
} as const

export default function HomePage() {
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
          <div className="admin-hide">
            <QuickLinks />
          </div>
          {HOME_SECTIONS_VISIBILITY.upcomingRaces && (
            <div className="admin-hide">
              <UpcomingRaces />
            </div>
          )}
          <LatestResults />
          {HOME_SECTIONS_VISIBILITY.documentsList && <DocumentsList />}
        </div>

        {/* ── Sidebar ── */}
        <aside className={styles.sideCol}>
          {HOME_SECTIONS_VISIBILITY.liveWidget && <LiveWidget />}
          {HOME_SECTIONS_VISIBILITY.rankingsWidget && <RankingsWidget />}
          {HOME_SECTIONS_VISIBILITY.riderSearch && <RiderSearch />}
          <div className="admin-hide">
            <CountdownWidget />
          </div>
        </aside>
      </main>
      <Footer />
    </>
  )
}
