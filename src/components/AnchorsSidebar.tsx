'use client'

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
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>⚓</span>
        My Anchors
      </h2>
      {anchors.length === 0 ? (
        <p className="text-sm text-gray-400">
          No fixed time constraints set yet.
        </p>
      ) : (
        <div className="space-y-3">
          {anchors.map((anchor) => (
            <div
              key={anchor.id}
              className="border border-gray-100 rounded-lg p-3 bg-gray-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {anchor.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {anchor.startTime} - {anchor.endTime}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-medium whitespace-nowrap">
                  {anchor.day}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
