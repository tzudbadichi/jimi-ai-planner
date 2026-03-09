import GoogleSignInButton from '@/components/GoogleSignInButton'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 sm:p-6">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">כניסה ל-Jimi</h1>
        <p className="mb-6 text-sm leading-6 text-gray-500">
          התחברות מאובטחת עם חשבון Google האישי שלך. הכניסה מותאמת גם למובייל.
        </p>
        <GoogleSignInButton />
      </div>
    </main>
  )
}
