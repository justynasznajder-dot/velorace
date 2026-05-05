import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import RaceResultsDownloads from '@/components/results/RaceResultsDownloads'
import { formatDate } from '@/lib/data'
import { getRaceByIdFromDatabase } from '@/lib/raceDb'
import { notFound } from 'next/navigation'
import styles from './page.module.css'

interface Props {
  params: { id: string }
}

export default async function RaceResultsOnlyPage({ params }: Props) {
  const race = await getRaceByIdFromDatabase(params.id)
  if (!race) notFound()

  const { full } = formatDate(race.date)

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.back}>
          <a href={`/wyniki/${race.id}`}>← Zobacz szczegóły wyścigu</a>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>Pobierz wyniki</h1>
          <p className={styles.subtitle}>
            {race.name} · {full}
          </p>
        </header>

        <section className={styles.card}>
          <RaceResultsDownloads raceId={race.id} />
        </section>
      </main>
      <Footer />
    </>
  )
}
