import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from '../wyniki/page.module.css'

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Panel admina</h1>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span>Dostep administratora</span>
            <span>OK</span>
          </div>
          <div className={styles.row}>
            <span className={styles.name}>Mozesz teraz korzystac z endpointow /api/admin/*</span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
