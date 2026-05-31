import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

const LIVE_TIMING_URL = 'https://www.webscorer.com/rewosport'

export default function LivePage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <h1 className={styles.pageTitle}>Live Timing</h1>
        <div className={styles.toolbar}>
          <p className={styles.toolbarHint}>Wyniki na żywo — Rewosport / Webscorer</p>
          <a href={LIVE_TIMING_URL} className={styles.externalLink} target="_blank" rel="noreferrer">
            Otwórz w nowej karcie →
          </a>
        </div>
        <div className={styles.embedWrap}>
          <iframe
            src={LIVE_TIMING_URL}
            title="Rewosport — Live Timing"
            className={styles.embed}
            allow="fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
