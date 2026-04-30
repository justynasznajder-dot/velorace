import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LatestResults from '@/components/results/LatestResults'
import styles from './page.module.css'

export default function WynikiPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Wyniki</h1>
        <LatestResults />
      </main>
      <Footer />
    </>
  )
}
