import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 32,
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 96, fontWeight: 900, color: 'var(--red)', lineHeight: 1,
        }}>404</div>
        <div style={{ fontSize: 18, color: 'var(--text)' }}>Strona nie istnieje</div>
        <Link href="/" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
          background: 'var(--red)', color: 'var(--white)',
          padding: '10px 24px', borderRadius: 3, textDecoration: 'none',
        }}>
          Wróć na stronę główną
        </Link>
      </div>
    </>
  )
}
