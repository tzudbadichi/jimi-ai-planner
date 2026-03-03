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
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">Daily Schedule</h2>
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>
      {schedule ? (
        parsedTable ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 overflow-hidden">
            <div className="max-h-[430px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr>
                    {parsedTable.headers.map((header) => (
                      <th key={header} className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {parsedTable.rows.map((row, rowIndex) => (
                    <tr key={`${row.join('-')}-${rowIndex}`} className="hover:bg-blue-50/40 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td key={`${cellIndex}-${cell}`} className="px-4 py-3 text-gray-700 border-b border-gray-100 align-top">
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
          <div className="whitespace-pre-wrap text-gray-700 text-sm leading-7 bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-[430px] overflow-auto">
            {schedule}
          </div>
        )
      ) : (
        <div className="text-gray-500 text-sm">No schedule generated for today yet. Click regenerate to build one.</div>
      )}
    </div>
  )
}
