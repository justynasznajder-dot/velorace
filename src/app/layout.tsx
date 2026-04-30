import type { Metadata } from 'next'
import '../styles/globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'

export const metadata: Metadata = {
  title: 'VeloRace — Portal wyścigów kolarskich',
  description: 'Zapisy, wyniki i live timing wyścigów kolarskich w Polsce',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
