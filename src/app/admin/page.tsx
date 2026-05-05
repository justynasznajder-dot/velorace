import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AdminDashboard from '@/components/admin/AdminDashboard'
import styles from './page.module.css'

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Panel admina</h1>
        <AdminDashboard />
      </main>
      <Footer />
    </>
  )
}
