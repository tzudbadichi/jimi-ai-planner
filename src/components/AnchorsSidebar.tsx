'use client'

import { useMemo, useState } from 'react'

export type AnchorView = {
  id: string
  title: string
  startTime: string
  endTime: string
  day: string
}

interface AnchorsSidebarProps {
  anchors: AnchorView[]
}

export function AnchorsSidebar({ anchors }: AnchorsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const summary = useMemo(() => {
    if (anchors.length === 0) return 'אין עוגנים'
    const first = anchors[0]
    return `${anchors.length} עוגנים · הבא: ${first.title} ${first.startTime}`
  }, [anchors])

  return (
    <aside className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">עוגנים קבועים</h2>
          <p className="text-xs text-gray-500">{summary}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          {isOpen ? 'סגור' : 'פתח'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {anchors.length === 0 ? (
            <p className="text-sm text-gray-400">עדיין לא הוגדרו עוגנים.</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {anchors.map((anchor) => (
                <div
                  key={anchor.id}
                  className="border border-gray-100 rounded-lg p-3 bg-gradient-to-br from-white to-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">{anchor.title}</h3>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        {anchor.startTime} - {anchor.endTime}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium whitespace-nowrap">
                      {anchor.day}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
