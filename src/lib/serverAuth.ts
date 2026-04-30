import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_STORAGE_KEY, type AuthUser } from '@/lib/auth'

const AUTH_COOKIE = AUTH_STORAGE_KEY
const ONE_DAY_SECONDS = 60 * 60 * 24

type AuthPayload = {
  email: string
  role: 'admin'
  iat: number
}

function getSecret() {
  return process.env.AUTH_SECRET || 'velorace-dev-secret-change-me'
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || 'Admin'
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || 'Admin123!'
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(payloadEncoded: string) {
  return createHmac('sha256', getSecret()).update(payloadEncoded).digest('base64url')
}

function verifySignature(payloadEncoded: string, signature: string) {
  const expected = sign(payloadEncoded)
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function validateAdminCredentials(email: string, password: string) {
  return email.trim() === getAdminEmail() && password === getAdminPassword()
}

export function createAuthToken(user: AuthUser) {
  const payload: AuthPayload = {
    email: user.email,
    role: user.role,
    iat: Date.now(),
  }
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(payloadEncoded)
  return `${payloadEncoded}.${signature}`
}

export function parseAuthToken(token: string | undefined | null): AuthUser | null {
  if (!token) return null
  const [payloadEncoded, signature] = token.split('.')
  if (!payloadEncoded || !signature) return null
  if (!verifySignature(payloadEncoded, signature)) return null
  try {
    const parsed = JSON.parse(base64UrlDecode(payloadEncoded)) as AuthPayload
    if (!parsed?.email || parsed?.role !== 'admin') return null
    return { email: parsed.email, role: 'admin' }
  } catch {
    return null
  }
}

export function getAuthUserFromRequest(req: NextRequest) {
  return parseAuthToken(req.cookies.get(AUTH_COOKIE)?.value)
}

export function getAuthUserFromServerCookies() {
  return parseAuthToken(cookies().get(AUTH_COOKIE)?.value)
}

export function setAuthCookie(token: string) {
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_DAY_SECONDS,
  })
}

export function clearAuthCookie() {
  cookies().set(AUTH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}
