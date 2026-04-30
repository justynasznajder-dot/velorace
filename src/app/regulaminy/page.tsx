import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DocumentsList from '@/components/shared/DocumentsList'
import styles from '../wyniki/page.module.css'

export default function RegulaminyPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Regulaminy i dokumenty</h1>
        <DocumentsList />
      </main>
      <Footer />
    </>
  )
}
