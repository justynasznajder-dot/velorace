'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Strona główna', href: '/' },
  { label: 'Wyniki',        href: '/wyniki' },
  { label: 'Kalendarz',     href: '/kalendarz' },
  { label: 'Live',          href: '/live', isLive: true },
  { label: 'Kontakt',       href: '/kontakt' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()

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
        {loading ? null : user ? (
          <>
            <span className={styles.userBadge}>Admin</span>
            <button className={styles.loginBtn} onClick={() => void logout()}>Wyloguj</button>
          </>
        ) : (
          <Link href="/login" className={styles.loginBtn}>Zaloguj się</Link>
        )}
      </div>
    </nav>
  )
}
