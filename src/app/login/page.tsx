import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { signInAction, signUpAction } from './actions'

const ERROR_TEXT: Record<string, string> = {
  missing: 'חסר אימייל או סיסמה.',
  invalid: 'אימייל או סיסמה שגויים.',
  weak: 'הסיסמה חייבת להכיל לפחות 8 תווים.',
  exists: 'משתמש עם אימייל זה כבר קיים.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getCurrentUser()
  if (user) redirect('/dashboard')

  const params = await searchParams
  const error = params.error ? ERROR_TEXT[params.error] : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">כניסה ל-Jimi</h1>
        <p className="mb-6 text-sm text-gray-500">כל משתמש מנהל לו״ז, יעדים וצ׳אט פרטיים משלו.</p>
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <form action={signInAction} className="rounded-2xl border border-gray-200 p-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">התחברות</h2>
            <div className="space-y-3">
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                כניסה
              </button>
            </div>
          </form>

          <form action={signUpAction} className="rounded-2xl border border-gray-200 p-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">הרשמה</h2>
            <div className="space-y-3">
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="Password (8+ chars)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                צור משתמש
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
