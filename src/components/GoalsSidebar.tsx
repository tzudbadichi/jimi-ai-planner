'use client'

import { useMemo, useState } from 'react'

export type GoalView = {
  id: string
  title: string
  goal: string | null
  logsCount: number
  logs: {
    id: string
    content: string
    createdAt: string
  }[]
}

interface GoalsSidebarProps {
  goals: GoalView[]
}

const PROGRESS_DAYS = 10

function normalizeDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildProgressData(logs: GoalView['logs']) {
  const today = new Date()
  const counts = logs.reduce<Record<string, number>>((acc, log) => {
    const key = normalizeDateKey(new Date(log.createdAt))
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return Array.from({ length: PROGRESS_DAYS }).map((_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (PROGRESS_DAYS - index - 1))
    const key = normalizeDateKey(day)
    const label = day.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })
    return { key, label, count: counts[key] || 0 }
  })
}

export function GoalsSidebar({ goals }: GoalsSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)

  const summary = useMemo(() => {
    if (goals.length === 0) return 'אין יעדים פעילים'
    const first = goals[0]
    return `${goals.length} יעדים · הבא: ${first.title}`
  }, [goals])

  const selectedGoal = useMemo(
    () => goals.find((goal) => goal.id === selectedGoalId) || null,
    [goals, selectedGoalId]
  )

  const progressData = useMemo(
    () => (selectedGoal ? buildProgressData(selectedGoal.logs) : []),
    [selectedGoal]
  )
  const maxProgressValue = Math.max(...progressData.map((item) => item.count), 1)

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
              <button
                key={goal.id}
                type="button"
                onClick={() => setSelectedGoalId(goal.id)}
                className="w-full rounded-lg border border-gray-100 bg-gradient-to-br from-white to-indigo-50/40 p-3 text-right transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <h3 className="text-sm font-semibold text-gray-900">{goal.title}</h3>
                {goal.goal && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{goal.goal}</p>}
                <div className="mt-2 text-xs font-medium text-gray-500">{goal.logsCount} לוגים</div>
              </button>
            ))
          )}
        </div>
      )}

      {selectedGoal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedGoal.title}</h2>
                <p className="mt-1 text-xs text-gray-500">התקדמות לפי {PROGRESS_DAYS} הימים האחרונים</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGoalId(null)}
                className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
              >
                סגור
              </button>
            </div>

            <div className="border-b border-gray-100 p-5">
              <div className="flex h-28 items-end gap-1">
                {progressData.map((point, index) => {
                  const rawHeight = (point.count / maxProgressValue) * 100
                  const height = point.count === 0 ? 8 : Math.max(16, rawHeight)
                  return (
                    <div key={point.key} className="flex flex-1 flex-col items-center justify-end gap-1">
                      <div className="w-full rounded-t-md bg-indigo-500/85" style={{ height: `${height}%` }} />
                      {index % 2 === 0 && <span className="text-[10px] leading-none text-gray-500">{point.label}</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {selectedGoal.logs.length === 0 && <p className="text-sm text-gray-400">אין עדיין לוגים ליעד הזה.</p>}
              {selectedGoal.logs.map((log) => (
                <div key={log.id} className="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{log.content}</p>
                  <span className="text-[11px] text-gray-500">{new Date(log.createdAt).toLocaleString('he-IL')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
