'use client'

import { useMemo, useState } from 'react'

export type GoalView = {
  id: string
  title: string
  goal: string | null
  logsCount: number
}

interface GoalsSidebarProps {
  goals: GoalView[]
}

export function GoalsSidebar({ goals }: GoalsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const summary = useMemo(() => {
    if (goals.length === 0) return 'אין יעדים פעילים'
    const first = goals[0]
    return `${goals.length} יעדים · הבא: ${first.title}`
  }, [goals])

  return (
    <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">יעדים פעילים</h2>
          <p className="text-xs text-gray-500">{summary}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          {isOpen ? 'סגור' : 'פתח'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 max-h-[320px] space-y-2 overflow-auto border-t border-gray-100 pt-4 pr-1">
          {goals.length === 0 ? (
            <p className="text-sm text-gray-400">עדיין לא הוגדרו יעדים.</p>
          ) : (
            goals.map((goal) => (
              <div key={goal.id} className="rounded-lg border border-gray-100 bg-gradient-to-br from-white to-indigo-50/40 p-3">
                <h3 className="text-sm font-semibold text-gray-900">{goal.title}</h3>
                {goal.goal && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{goal.goal}</p>}
                <div className="mt-2 text-xs font-medium text-gray-500">{goal.logsCount} לוגים</div>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  )
}
