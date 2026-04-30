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

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        {/* ── Main column ── */}
        <div className={styles.mainCol}>
          <Notice />
          <QuickLinks />
          <UpcomingRaces />
          <LatestResults />
          <DocumentsList />
        </div>

        {/* ── Sidebar ── */}
        <aside className={styles.sideCol}>
          <LiveWidget />
          <RankingsWidget />
          <RiderSearch />
          <CountdownWidget />
        </aside>
      </main>
      <Footer />
    </>
  )
}
