import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RankingsWidget from '@/components/rankings/RankingsWidget'
import styles from '../wyniki/page.module.css'

export default function RankingiPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Rankingi sezonowe</h1>
        <div style={{ maxWidth: 480 }}>
          <RankingsWidget />
        </div>
      </main>
      <Footer />
    </>
  )
}
