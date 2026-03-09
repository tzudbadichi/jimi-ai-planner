'use server'

import { createSession, clearSession } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

function parseCredentials(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  if (!email || !password) return null
  return { email, password }
}

export async function signInAction(formData: FormData) {
  const creds = parseCredentials(formData)
  if (!creds) redirect('/login?error=missing')

  const user = await db.user.findUnique({ where: { email: creds.email } })
  if (!user) redirect('/login?error=invalid')

  const ok = await bcrypt.compare(creds.password, user.passwordHash)
  if (!ok) redirect('/login?error=invalid')

  await createSession(user.id)
  redirect('/dashboard')
}

export async function signUpAction(formData: FormData) {
  const creds = parseCredentials(formData)
  if (!creds) redirect('/login?error=missing')

  if (creds.password.length < 8) redirect('/login?error=weak')

  const exists = await db.user.findUnique({ where: { email: creds.email } })
  if (exists) redirect('/login?error=exists')

  const passwordHash = await bcrypt.hash(creds.password, 10)
  const user = await db.user.create({
    data: {
      email: creds.email,
      passwordHash,
    },
  })

  await createSession(user.id)
  redirect('/dashboard')
}

export async function signOutAction() {
  await clearSession()
  redirect('/login')
}
