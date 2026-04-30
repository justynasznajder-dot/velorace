import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './page.module.css'

export default function KontaktPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Kontakt</h1>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Biuro platformy</h2>
            <p>📧 kontakt@velorace.pl</p>
            <p>📞 +48 123 456 789</p>
            <p>🕒 Pn–Pt, 9:00–17:00</p>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Dla organizatorów</h2>
            <p>📧 organizatorzy@velorace.pl</p>
            <p>Pytania dotyczące rejestracji wyścigów,<br/>panelu zarządzania i integracji API.</p>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Pomoc techniczna</h2>
            <p>📧 pomoc@velorace.pl</p>
            <p>Problemy z kontem, płatnościami,<br/>aplikacją mobilną.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
