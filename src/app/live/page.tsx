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
            <span>1 wyścig</span>
          </div>
          <a
            href="https://www.webscorer.com/rewosport"
            target="_blank"
            rel="noreferrer"
            className={styles.row}
            style={{ textDecoration: 'none' }}
          >
            <span className={styles.pos}>1</span>
            <span className={styles.name}>
              XXXIX Ogólnopolski wyścig kolarski "O puchar wótja gminy Chrząstowice"
            </span>
            <span className={styles.time} style={{ color: 'var(--red)' }}>Webscorer</span>
            <span className={styles.gap}>→</span>
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}
