import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

const SESSION_COOKIE = 'jimi_session'
const SESSION_DAYS = 30

type SessionPayload = {
  userId: string
  exp: number
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production')
  }
  return 'dev-only-change-me'
}

function signPayload(payload: string) {
  return crypto.createHmac('sha256', getAuthSecret()).update(payload).digest('hex')
}

function encodeSession(payload: SessionPayload) {
  const raw = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = signPayload(raw)
  return `${raw}.${signature}`
}

function decodeSession(token: string): SessionPayload | null {
  const [raw, signature] = token.split('.')
  if (!raw || !signature) return null
  if (signPayload(raw) !== signature) return null

  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as SessionPayload
    if (!parsed.userId || !parsed.exp) return null
    if (Date.now() > parsed.exp) return null
    return parsed
  } catch {
    return null
  }
}

export async function createSession(userId: string) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const token = encodeSession({ userId, exp })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(exp),
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getCurrentUser() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = decodeSession(token)
  if (!payload) return null

  return db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, createdAt: true },
  })
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireUserId() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user.id
}
