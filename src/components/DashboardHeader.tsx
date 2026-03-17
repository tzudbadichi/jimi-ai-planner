'use client'

import HelpModal from '@/components/HelpModal'
import ResetAllButton from '@/components/ResetAllButton'
import SignOutButton from '@/components/SignOutButton'

export default function DashboardHeader({ email }: { email: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-gray-100 md:flex-row md:items-center md:justify-between md:p-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Jimi Dashboard</h1>
        <p className="mt-1 text-xs text-gray-500 md:text-sm">{email}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <HelpModal />
        <ResetAllButton />
        <SignOutButton />
      </div>
    </div>
  )
}
