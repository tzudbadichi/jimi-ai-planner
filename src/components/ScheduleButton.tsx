'use client'

import { useState } from "react"
import { generateSchedule } from "@/app/actions"

export function ScheduleButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [schedule, setSchedule] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleGenerateSchedule() {
    setIsLoading(true)
    try {
      const result = await generateSchedule()
      if (result.error) {
        setSchedule(`Error: ${result.error}`)
      } else {
        setSchedule(result.schedule || "No schedule generated")
      }
      setIsOpen(true)
    } catch {
      setSchedule("Failed to generate schedule")
      setIsOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGenerateSchedule}
        disabled={isLoading}
        className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <span>✨</span>
        {isLoading ? "Building..." : "Build Daily Schedule"}
      </button>

      {/* Schedule Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                📅 Daily Schedule
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body: Schedule Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {schedule ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {schedule}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-400">Loading schedule...</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-gray-900 text-white hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
