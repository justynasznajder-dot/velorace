import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from '../wyniki/page.module.css'

export default function LivePage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Live Timing</h1>
        <div className={styles.card} style={{ marginTop: 24 }}>
          <div className={styles.cardHeader}>
            <span>Lista wyścigów</span>
            <span>0</span>
          </div>
          <p style={{ padding: '16px 20px', margin: 0, color: 'var(--muted, #aaa)' }}>
            Brak aktywnego live timingu — po dodaniu wyścigu w systemie pojawi się tu link lub osadzony podgląd.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
