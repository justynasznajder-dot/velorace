import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import UpcomingRaces from '@/components/races/UpcomingRaces'
import styles from '../wyniki/page.module.css'

export default function KalendarzPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Kalendarz wyścigów</h1>
        <UpcomingRaces />
      </main>
      <Footer />
    </>
  )
}
