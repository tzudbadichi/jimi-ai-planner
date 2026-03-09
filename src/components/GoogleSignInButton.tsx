'use client'

import { signIn } from 'next-auth/react'

export default function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn('google', { callbackUrl: '/dashboard' }, { prompt: 'select_account' })}
      className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 transition-colors hover:bg-gray-50 active:bg-gray-100 md:min-h-[46px] md:text-sm"
    >
      המשך עם Google
    </button>
  )
}
