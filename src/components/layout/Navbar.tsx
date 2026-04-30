'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Strona główna', href: '/' },
  { label: 'Wyniki',        href: '/wyniki' },
  { label: 'Kalendarz',     href: '/kalendarz' },
  { label: 'Live',          href: '/live', isLive: true },
  { label: 'Regulaminy',    href: '/regulaminy' },
  { label: 'Rankingi',      href: '/rankingi' },
  { label: 'Kontakt',       href: '/kontakt' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        VELO<span>RACE</span>
      </Link>

      <div className={styles.links}>
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={[
              styles.link,
              pathname === link.href ? styles.active : '',
              link.isLive ? styles.liveLink : '',
            ].join(' ')}
          >
            {link.isLive && <span className={styles.liveDot} />}
            {link.label}
          </Link>
        ))}
      </div>

      <div className={styles.right}>
        <div className={styles.search}>
          <span>🔍</span>
          <span>Szukaj zawodnika...</span>
        </div>
        <button className={styles.loginBtn}>Zaloguj się</button>
      </div>
    </nav>
  )
}
