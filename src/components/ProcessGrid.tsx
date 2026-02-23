'use client'

import { useState } from "react"

export type ProcessView = {
  id: string
  title: string
  goal: string | null
  logs: {
    id: string
    content: string
    createdAt: string
  }[]
}

interface ProcessGridProps {
  processes: ProcessView[]
}

export function ProcessGrid({ processes }: ProcessGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {processes.length === 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-400 text-sm">
            No processes yet. Start chatting with Jimi to create your first process.
          </p>
        </div>
      )}
      {processes.map((process) => {
        const recentLogs = process.logs.slice(0, 3)
        return (
          <div
            key={process.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  {process.title}
                </h2>
              </div>
            </div>

            {process.goal && (
              <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-700">
                  Goal: {process.goal}
                </p>
              </div>
            )}

            <div className="space-y-2 mt-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent Logs
              </p>
              {recentLogs.length === 0 ? (
                <p className="text-xs text-gray-400">No logs yet</p>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="text-xs text-gray-700 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100"
                  >
                    <p className="whitespace-pre-wrap">{log.content}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(log.createdAt).toLocaleString("he-IL")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
