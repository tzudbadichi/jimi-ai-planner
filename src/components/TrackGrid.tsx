'use client'

import { useState } from "react"

type EventView = {
  id: string
  content: string
  startTime: string | null
  endTime: string | null
  date: string
}

export type TrackView = {
  id: string
  title: string
  goal: string | null
  events: EventView[]
}

interface TrackGridProps {
  tracks: TrackView[]
}

export function TrackGrid({ tracks }: TrackGridProps) {
  const [selectedTrack, setSelectedTrack] = useState<TrackView | null>(null)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Tracks</h1>
      {tracks.length === 0 && (
        <p className="text-gray-400 text-sm">
          No tracks yet. Start chatting with Jimi to create your first track.
        </p>
      )}

      {/* Master grid of tracks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tracks.map((track) => {
          const eventsCount = track.events.length
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => setSelectedTrack(track)}
              className="text-left bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col gap-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📂</span>
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    {track.title}
                  </h2>
                </div>
                {track.goal && (
                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold max-w-[140px] truncate">
                    {track.goal}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {eventsCount === 0
                  ? "No events yet"
                  : eventsCount === 1
                  ? "1 event"
                  : `${eventsCount} events`}
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail modal for a selected track */}
      {selectedTrack && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full mx-4 flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📂</span>
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedTrack.title}
                  </h2>
                </div>
                {selectedTrack.goal && (
                  <p className="text-sm text-indigo-700 bg-indigo-50 inline-flex px-3 py-1 rounded-full font-medium">
                    {selectedTrack.goal}
                  </p>
                )}
              </div>
            </div>

            {/* Body: log of events */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {selectedTrack.events.length === 0 && (
                <p className="text-sm text-gray-400">
                  No events logged yet for this track.
                </p>
              )}
              {selectedTrack.events.map((event) => {
                const hasTime = event.startTime || event.endTime
                const timeRange =
                  event.startTime && event.endTime
                    ? `${event.startTime} - ${event.endTime}`
                    : event.startTime || event.endTime || null

                return (
                  <div
                    key={event.id}
                    className="border border-gray-100 rounded-2xl px-3 py-2.5 bg-gray-50 flex flex-col gap-1"
                  >
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {event.content}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{new Date(event.date).toLocaleString("he-IL")}</span>
                      {hasTime && (
                        <span className="text-[11px] text-gray-500">
                          {timeRange}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTrack(null)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-900 text-white hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

