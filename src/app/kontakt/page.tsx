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
            <h2 className={styles.cardTitle}>Obsługa platformy</h2>
            <p>📧 kontakt.velorace@gmail.com</p>
            <p>📞 607 267 492</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
