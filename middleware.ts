import { NextResponse, type NextRequest } from 'next/server'

const AUTH_COOKIE = 'velorace_auth_user'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtectedPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
  if (!isProtectedPath) return NextResponse.next()

  const token = req.cookies.get(AUTH_COOKIE)?.value
  if (token) return NextResponse.next()

  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ ok: false, message: 'Brak autoryzacji.' }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('next', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
