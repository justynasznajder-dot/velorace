import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from '../wyniki/page.module.css'

export default function KalendarzPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Kalendarz wyścigów</h1>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span>XXXIX Ogólnopolski wyścig kolarski "O puchar wótja gminy Chrząstowice"</span>
            <span>01.05.2026</span>
          </div>
          <div className={styles.row}>
            <span className={styles.name} style={{ gridColumn: '1 / 3' }}>Miejsce: Dębie</span>
            <span className={styles.team}>Wyścig szosowy</span>
            <span className={styles.time}>2026</span>
            <span className={styles.gap}>Nowy</span>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <a
              href="https://drive.google.com/file/d/1lPMj5ymv1ii2b3iUlfYZePvGoQ5GJfPv/view?usp=sharing"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--red)', fontWeight: 700 }}
            >
              Pobierz regulamin
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
