import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LiveWidget from '@/components/live/LiveWidget'
import styles from '../wyniki/page.module.css'

export default function LivePage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Live Timing</h1>
        <div style={{ maxWidth: 480 }}>
          <LiveWidget />
        </div>
        {/* Placeholder for video embed */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          aspectRatio: '16/9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 24,
          color: 'var(--muted)',
          fontSize: 14,
        }}>
          Transmisja wideo — embed YouTube / własny stream
        </div>
      </main>
      <Footer />
    </>
  )
}
