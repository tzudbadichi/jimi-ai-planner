'use client'

import { useMemo, useState } from 'react'
import { generateSchedule, generateWeeklySchedule } from '@/app/actions'
import { CalendarClock, RefreshCw, Sparkles } from 'lucide-react'

type ParsedTable = {
  headers: string[]
  rows: string[][]
}

type ParsedTimelineItem = {
  time: string
  task: string
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
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

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

function looksLikeTimeRange(value: string) {
  return /^(\d{1,2}:\d{2})(\s*-\s*\d{1,2}:\d{2})?$/.test(value.trim())
}

function parseTimeline(content: string): ParsedTimelineItem[] {
  const patterns = [
    /^\*\*(\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?)\*\*:\s*(.+)$/u,
    /^[-*]\s*(\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?)\s*[:\-]\s*(.+)$/u,
    /^(\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?)\s*[:\-]\s*(.+)$/u,
  ]

  return content
    .split('\n')
    .map((line) => line.trim())
    .map((line) => {
      const match = patterns.map((pattern) => line.match(pattern)).find(Boolean)
      if (!match) return null
      return {
        time: match[1].trim(),
        task: match[2].trim(),
      }
    })
    .filter((item): item is ParsedTimelineItem => Boolean(item))
}

export default function SchedulePanel({
  initialSchedule,
  initialWeeklySchedule,
}: {
  initialSchedule: string | null
  initialWeeklySchedule: string | null
}) {
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily')
  const [dailySchedule, setDailySchedule] = useState(initialSchedule)
  const [weeklySchedule, setWeeklySchedule] = useState<string | null>(initialWeeklySchedule)
  const [loadingDaily, setLoadingDaily] = useState(false)
  const [loadingWeekly, setLoadingWeekly] = useState(false)

  const activeSchedule = mode === 'daily' ? dailySchedule : weeklySchedule
  const parsedTable = useMemo(
    () => (activeSchedule ? parseMarkdownTable(activeSchedule) : null),
    [activeSchedule]
  )
  const parsedTimeline = useMemo(
    () => (activeSchedule ? parseTimeline(activeSchedule) : []),
    [activeSchedule]
  )
  const tasksCount = parsedTable ? parsedTable.rows.length : parsedTimeline.length
  const timeColumnIndex = parsedTable
    ? parsedTable.headers.findIndex((header) => /שעה|time/i.test(header))
    : -1

  const handleRefresh = async () => {
    setLoadingDaily(true)
    try {
      const result = await generateSchedule(true)
      if (result.schedule) {
        setDailySchedule(result.schedule)
        setMode('daily')
      }
    } catch (error) {
      console.error('Failed to refresh schedule:', error)
    } finally {
      setLoadingDaily(false)
    }
  }

  const handleWeeklyGenerate = async () => {
    setLoadingWeekly(true)
    try {
      const result = await generateWeeklySchedule()
      if (result.schedule) {
        setWeeklySchedule(result.schedule)
        setMode('weekly')
      }
    } catch (error) {
      console.error('Failed to generate weekly schedule:', error)
    } finally {
      setLoadingWeekly(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900 px-5 py-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-cyan-100">
              <CalendarClock className="h-4 w-4" />
              <span className="text-xs font-medium">׳לוז יומי חכם</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {mode === 'daily' ? 'תכנון היום' : 'תכנון שבועי'}
            </h2>
            <p className="mt-1 text-xs text-blue-100">
              {mode === 'daily'
                ? 'בנוי אוטומטית לפי עוגנים, יעדים ורשימות'
                : 'לוז שבועי אוטומטי עם עוגנים ויעדים'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMode('daily')}
              disabled={!dailySchedule || mode === 'daily'}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              הצג יומי
            </button>
            <button
              onClick={() => setMode('weekly')}
              disabled={!weeklySchedule || mode === 'weekly'}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-100/40 bg-cyan-200/10 px-3 py-2 text-sm text-cyan-50 transition-colors hover:bg-cyan-200/20 disabled:opacity-50"
            >
              הצג שבועי
            </button>
            <button
              onClick={handleRefresh}
              disabled={loadingDaily}
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-sm text-white transition-colors hover:bg-white/25 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingDaily ? 'animate-spin' : ''}`} />
              {loadingDaily ? 'מייצר...' : 'הצג לוז יומי'}
            </button>
            <button
              onClick={handleWeeklyGenerate}
              disabled={loadingWeekly}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-100/40 bg-cyan-200/15 px-3 py-2 text-sm text-cyan-50 transition-colors hover:bg-cyan-200/25 disabled:opacity-50"
            >
              <Sparkles className={`h-4 w-4 ${loadingWeekly ? 'animate-spin' : ''}`} />
              {loadingWeekly ? 'מייצר...' : 'הצג לוז שבועי'}
            </button>
          </div>
        </div>

        {(parsedTable || parsedTimeline.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-2.5 py-1 text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              {tasksCount} משימות מתוזמנות
            </span>
            <span className="rounded-full border border-blue-200/30 bg-blue-200/10 px-2.5 py-1 text-blue-100">
              {mode === 'daily' ? 'עודכן היום' : 'עודכן השבוע'}
            </span>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-b from-white to-slate-50/40 p-5">
        {activeSchedule ? (
          parsedTable ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="max-h-[460px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
                    <tr>
                      {parsedTable.headers.map((header) => (
                        <th
                          key={header}
                          className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {parsedTable.rows.map((row, rowIndex) => (
                      <tr
                        key={`${row.join('-')}-${rowIndex}`}
                        className="border-b border-slate-100 transition-colors odd:bg-white even:bg-slate-50/35 hover:bg-cyan-50/55"
                      >
                        {row.map((cell, cellIndex) => (
                          <td key={`${cellIndex}-${cell}`} className="px-4 py-3 align-top text-right text-slate-700">
                            {cellIndex === timeColumnIndex && looksLikeTimeRange(cell) ? (
                              <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                                {cell}
                              </span>
                            ) : (
                              cell || '-'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : parsedTimeline.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-3">
                {parsedTimeline.map((item, index) => (
                  <div key={`${item.time}-${index}`} className="relative flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-colors hover:bg-cyan-50/45">
                    <div className="flex flex-col items-center">
                      <span className="inline-flex min-w-[6.5rem] justify-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                        {item.time}
                      </span>
                      {index < parsedTimeline.length - 1 && <span className="mt-2 h-6 w-px bg-slate-200" />}
                    </div>
                    <p className="pt-0.5 text-sm leading-6 text-slate-700">{item.task}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-h-[460px] overflow-auto rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm">
              <pre className="whitespace-pre-wrap font-sans">{activeSchedule}</pre>
            </div>
          )
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" aria-hidden="true">
                <path
                  d="M7 3h10a2 2 0 0 1 2 2v3H5V5a2 2 0 0 1 2-2zm-2 8h14v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6zm4 2h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-700">
              {mode === 'daily' ? 'אין לו״ז יומי עדיין' : 'אין לו״ז שבועי עדיין'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'daily'
                ? 'לחצו על רענון כדי לייצר תכנון ליום.'
                : 'צרו תכנון שבועי כדי להתחיל.'}
            </p>
            <p className="mt-1 text-xs text-slate-400">הקלד הודעה בצ׳אט כדי ליצור את הבלוק הראשון שלך.</p>
          </div>
        )}
      </div>
    </section>
  )
}
