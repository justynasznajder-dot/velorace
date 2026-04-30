import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { RACES, formatDate } from '@/lib/data'
import { notFound } from 'next/navigation'
import styles from './page.module.css'

interface Props {
  params: { id: string }
}

export default function ZapisyRacePage({ params }: Props) {
  const race = RACES.find(r => r.id === params.id)
  if (!race) notFound()

  const { full } = formatDate(race.date)

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.header}>
          <div className={styles.back}><a href="/zapisy">← Powrót do zapisów</a></div>
          <h1 className={styles.pageTitle}>{race.name}</h1>
          <p className={styles.subtitle}>{full} · {race.city} · {race.distance} km · {race.category}</p>
        </div>

        <div className={styles.layout}>
          <form className={styles.form}>
            <h2 className={styles.sectionTitle}>Dane zawodnika</h2>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Imię *</label>
                <input type="text" placeholder="Jan" required />
              </div>
              <div className={styles.field}>
                <label>Nazwisko *</label>
                <input type="text" placeholder="Kowalski" required />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Data urodzenia *</label>
                <input type="date" required />
              </div>
              <div className={styles.field}>
                <label>Nr licencji PZKol</label>
                <input type="text" placeholder="np. PL-2024-12345" />
              </div>
            </div>

            <div className={styles.field}>
              <label>Email *</label>
              <input type="email" placeholder="jan@kowalski.pl" required />
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Telefon</label>
                <input type="tel" placeholder="+48 123 456 789" />
              </div>
              <div className={styles.field}>
                <label>Klub / Drużyna</label>
                <input type="text" placeholder="Team Silesia" />
              </div>
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: 24 }}>Kategoria startowa</h2>

            <div className={styles.field}>
              <label>Kategoria *</label>
              <select required>
                <option value="">Wybierz kategorię</option>
                <option>Elita</option>
                <option>U23</option>
                <option>Masters 30+</option>
                <option>Masters 40+</option>
                <option>Masters 50+</option>
              </select>
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: 24 }}>Opłata startowa</h2>

            <div className={styles.feeBox}>
              <div className={styles.feeLine}>
                <span>Opłata startowa</span>
                <span>80,00 zł</span>
              </div>
              <div className={styles.feeLine}>
                <span>Ubezpieczenie (obowiązkowe)</span>
                <span>10,00 zł</span>
              </div>
              <div className={`${styles.feeLine} ${styles.feeTotal}`}>
                <span>Łącznie</span>
                <span>90,00 zł</span>
              </div>
            </div>

            <div className={styles.checkField}>
              <input type="checkbox" id="agree" required />
              <label htmlFor="agree">
                Akceptuję regulamin wyścigu oraz politykę prywatności platformy VeloRace *
              </label>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Przejdź do płatności →
            </button>
          </form>

          {/* Race info sidebar */}
          <div className={styles.infoPanel}>
            <div className={styles.infoCard}>
              <h3>Informacje o wyścigu</h3>
              <div className={styles.infoRow}><span>📅 Data</span><span>{full}</span></div>
              <div className={styles.infoRow}><span>📍 Start</span><span>{race.city}</span></div>
              <div className={styles.infoRow}><span>📏 Dystans</span><span>{race.distance} km</span></div>
              <div className={styles.infoRow}><span>🏷️ Kategorie</span><span>{race.category}</span></div>
              {race.elevationGain && (
                <div className={styles.infoRow}><span>⛰️ Przewyższenie</span><span>{race.elevationGain} m</span></div>
              )}
              <div className={styles.infoRow}>
                <span>👥 Miejsca</span>
                <span>{race.spotsTaken}/{race.spotsTotal}</span>
              </div>
            </div>
            <a href={`/docs/regulamin-${race.id}.pdf`} className={styles.docLink}>
              📄 Pobierz regulamin
            </a>
            <a href={`/docs/mapa-${race.id}.pdf`} className={styles.docLink}>
              🗺️ Pobierz mapę trasy
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
