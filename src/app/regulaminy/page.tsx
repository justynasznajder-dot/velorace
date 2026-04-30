import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from '../wyniki/page.module.css'

export default function RegulaminyPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Regulaminy i dokumenty</h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
          Na ten moment brak opublikowanych regulaminów i dokumentów.
        </p>
      </main>
      <Footer />
    </>
  )
}
