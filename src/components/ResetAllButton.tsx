'use client'

import { resetAllData } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export default function ResetAllButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleReset = () => {
    const shouldReset = confirm('למחוק הכל? הפעולה מוחקת לוגים, עוגנים, יעדים, רשימות, לו״ז והיסטוריית צ׳אט.')
    if (!shouldReset) return

    setError(null)
    startTransition(async () => {
      try {
        await resetAllData()
        router.refresh()
      } catch {
        setError('איפוס מלא נכשל. נסה שוב.')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleReset}
        disabled={isPending}
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'מאפס...' : 'Reset All'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
