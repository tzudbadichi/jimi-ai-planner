'use client'

import { useState } from 'react'
import { generateSchedule } from '@/app/actions'

type ParsedTable = {
  headers: string[]
  rows: string[][]
}

function parseRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isMarkdownSeparator(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line.trim())
}

function parseMarkdownTable(content: string): ParsedTable | null {
  const lines = content.split('\n').map((line) => line.trim()).filter(Boolean)

  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].includes('|') || !isMarkdownSeparator(lines[i + 1])) continue

    const headers = parseRow(lines[i])
    const rows: string[][] = []

    for (let j = i + 2; j < lines.length; j++) {
      const rowLine = lines[j]
      if (!rowLine.includes('|')) break
      const row = parseRow(rowLine)
      if (row.length === headers.length) {
        rows.push(row)
      }
    }

    if (headers.length > 0 && rows.length > 0) {
      return { headers, rows }
    }
  }

  return null
}

export default function SchedulePanel({ initialSchedule }: { initialSchedule: string | null }) {
  const [schedule, setSchedule] = useState(initialSchedule)
  const [loading, setLoading] = useState(false)
  const parsedTable = schedule ? parseMarkdownTable(schedule) : null

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const result = await generateSchedule(true)
      if (result.schedule) {
        setSchedule(result.schedule)
      }
    } catch (error) {
      console.error("Failed to refresh schedule:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white">
        <div className="flex justify-between items-center gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">לוח זמנים יומי</h2>
            <p className="text-xs text-blue-100 mt-1">תכנון אוטומטי לפי עוגנים, יעדים ורשימות</p>
          </div>
          <button
          onClick={handleRefresh} 
          disabled={loading}
          className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 transition-colors border border-white/20"
        >
          {loading ? 'מייצר...' : 'רענן'}
        </button>
        </div>
      </div>
      <div className="p-5">
      {schedule ? (
        parsedTable ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/40 overflow-hidden">
            <div className="max-h-[460px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr>
                    {parsedTable.headers.map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-right font-semibold text-slate-700 border-b border-slate-200 whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {parsedTable.rows.map((row, rowIndex) => (
                    <tr key={`${row.join('-')}-${rowIndex}`} className="hover:bg-blue-50/50 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${cellIndex}-${cell}`}
                          className="px-4 py-3 text-slate-700 border-b border-slate-100 align-top text-right"
                        >
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-slate-700 text-sm leading-7 bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-[460px] overflow-auto">
            {schedule}
          </div>
        )
      ) : (
        <div className="text-slate-500 text-sm">אין עדיין לו&quot;ז להיום. לחץ על רענן כדי לייצר תכנון.</div>
      )}
      </div>
    </section>
  )
}
