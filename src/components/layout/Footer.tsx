import Link from 'next/link'
import styles from './Footer.module.css'

const LINKS = {
  wyścigi:    [['Kalendarz','/kalendarz'],['Zapisy online','/zapisy'],['Wyniki','/wyniki'],['Regulaminy','/regulaminy']],
  zawodnik:   [['Mój profil','/profil'],['Historia startów','/historia'],['Ranking krajowy','/rankingi'],['Certyfikaty','/certyfikaty']],
  platforma:  [['Kontakt / Pomoc','/kontakt']],
} as const

export default function Footer() {
  return (
    <>
      <footer className={styles.footer}>
        <div>
          <div className={styles.brand}>VELO<span>RACE</span></div>
          <p className={styles.tagline}>
            Platforma wyścigów kolarskich — zapisy, wyniki, live timing dla organizatorów i zawodników.
          </p>
        </div>

        {Object.entries(LINKS)
          .filter(([section]) => section !== 'zawodnik')
          .map(([section, links]) => (
          <div key={section} className={styles.col}>
            <h4>{section.charAt(0).toUpperCase() + section.slice(1)}</h4>
            {(links as readonly (readonly [string, string])[]).map(([label, href]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </div>
        ))}
      </footer>

      <div className={styles.bottom}>
        <span>© 2025 VeloRace Platform</span>
        <span>Polityka prywatności · Regulamin</span>
      </div>
    </>
  )
}
