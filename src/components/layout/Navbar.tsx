'use client'

import { useEffect, useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

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
            <span className={`${styles.userBadge} ${styles.hideOnMobile}`}>Admin</span>
            <button
              className={`${styles.loginBtn} ${styles.hideOnMobile}`}
              onClick={() => void logout()}
            >
              Wyloguj
            </button>
          </>
        ) : (
          <Link href="/login" className={`${styles.loginBtn} ${styles.hideOnMobile}`}>
            Zaloguj się
          </Link>
        )}

        <button
          type="button"
          className={styles.burger}
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
        >
          <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineOpen1 : ''}`} />
          <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineHidden : ''}`} />
          <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineOpen2 : ''}`} />
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobilePanel}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                styles.mobileLink,
                pathname === link.href ? styles.mobileLinkActive : '',
                link.isLive ? styles.liveLink : '',
              ].join(' ')}
              onClick={() => setMenuOpen(false)}
            >
              {link.isLive && <span className={styles.liveDot} />}
              {link.label}
            </Link>
          ))}

          <div className={styles.mobileAuth}>
            {loading ? null : user ? (
              <>
                <span className={styles.userBadge}>Admin</span>
                <button
                  className={styles.loginBtn}
                  onClick={() => {
                    setMenuOpen(false)
                    void logout()
                  }}
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={styles.loginBtn}
                onClick={() => setMenuOpen(false)}
              >
                Zaloguj się
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
