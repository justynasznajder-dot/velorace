import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ContactPayload = {
  name?: string
  email?: string
  subject?: string
  message?: string
}

const CONTACT_TO = process.env.CONTACT_TO_EMAIL || 'kontakt@velorace.pl'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildMail(name: string, email: string, subject: string, message: string) {
  const finalSubject = subject
    ? `[Velorace] ${subject}`
    : `[Velorace] Nowa wiadomość od ${name}`

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1a1a;">
      <h2 style="margin:0 0 12px 0;">Nowa wiadomość z formularza kontaktowego</h2>
      <p><strong>Imię i nazwisko:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      ${subject ? `<p><strong>Temat:</strong> ${escapeHtml(subject)}</p>` : ''}
      <p><strong>Wiadomość:</strong></p>
      <p style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:4px;">${escapeHtml(message)}</p>
    </div>
  `

  const text = [
    `Nowa wiadomość z formularza kontaktowego`,
    ``,
    `Imię i nazwisko: ${name}`,
    `Email: ${email}`,
    subject ? `Temat: ${subject}` : null,
    ``,
    `Wiadomość:`,
    message,
  ]
    .filter(Boolean)
    .join('\n')

  return { finalSubject, html, text }
}

function getSmtpAuth() {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim()
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').trim()
  return { user, pass }
}

function createTransport() {
  const { user, pass } = getSmtpAuth()
  if (!user || !pass) return null

  const smtpHost = (process.env.SMTP_HOST || '').trim()
  if (smtpHost) {
    const port = parseInt(process.env.SMTP_PORT || '465', 10)
    let secure: boolean
    if (process.env.SMTP_SECURE === 'true') secure = true
    else if (process.env.SMTP_SECURE === 'false') secure = false
    else secure = port === 465

    return nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: { user, pass },
      ...(port === 587 && !secure ? { requireTLS: true } : {}),
    })
  }

  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim()
  if (!gmailPass) return null

  const gmailUser = (process.env.GMAIL_USER || user).trim()
  if (!gmailUser.toLowerCase().endsWith('@gmail.com')) return null

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  })
}

export async function POST(req: Request) {
  let payload: ContactPayload
  try {
    payload = (await req.json()) as ContactPayload
  } catch {
    return NextResponse.json({ ok: false, message: 'Niepoprawne dane.' }, { status: 400 })
  }

  const name = (payload.name ?? '').trim()
  const email = (payload.email ?? '').trim()
  const subject = (payload.subject ?? '').trim()
  const message = (payload.message ?? '').trim()

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, message: 'Imię, email i wiadomość są wymagane.' },
      { status: 400 },
    )
  }

  if (!/.+@.+\..+/.test(email)) {
    return NextResponse.json({ ok: false, message: 'Niepoprawny email.' }, { status: 400 })
  }

  const transporter = createTransport()
  if (!transporter) {
    console.error('[contact] brak SMTP: ustaw SMTP_HOST + SMTP_USER + SMTP_PASS (Zimbra/OVH) lub Gmail')
    return NextResponse.json(
      {
        ok: false,
        message:
          'Wysyłka nie jest skonfigurowana. W Vercel (.env.local) ustaw: SMTP_HOST, SMTP_PORT, SMTP_USER (pełny adres), SMTP_PASS — wg ustawień OVH dla Zimbry.',
      },
      { status: 500 },
    )
  }

  const { user } = getSmtpAuth()
  const from =
    (process.env.CONTACT_FROM_EMAIL || '').trim() || `Velorace <${user}>`
  const { finalSubject, html, text } = buildMail(name, email, subject, message)

  try {
    await transporter.sendMail({
      from,
      to: CONTACT_TO,
      replyTo: email,
      subject: finalSubject,
      html,
      text,
    })
  } catch (err) {
    console.error('[contact] send failed', err)
    return NextResponse.json(
      { ok: false, message: 'Nie udało się wysłać wiadomości. Sprawdź dane SMTP w panelu Vercel.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
