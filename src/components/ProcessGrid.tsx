'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { addProcessLog, deleteProcessById, deleteProcessLog, updateProcess } from '@/app/actions'

interface ProcessLog {
  id: string
  content: string
  createdAt: string | Date
}

interface Process {
  id: string
  title: string
  goal: string | null
  type: string
  logs: ProcessLog[]
}

interface ProcessGridProps {
  processes: Process[]
  mode?: 'all' | 'listsOnly'
}

type BlockType = 'PROCESS' | 'LIST'
type ChecklistItem = { text: string; checked: boolean }

const PROGRESS_DAYS = 10

const normalizeType = (value: string | null | undefined): BlockType => (value === 'LIST' ? 'LIST' : 'PROCESS')
const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value))

const normalizeDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const buildProgressData = (logs: ProcessLog[]) => {
  const today = new Date()
  const counts = logs.reduce<Record<string, number>>((acc, log) => {
    const key = normalizeDateKey(toDate(log.createdAt))
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

const parseChecklist = (goal: string | null): ChecklistItem[] => {
  if (!goal?.trim()) return []
  return goal
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const done = line.match(/^\[(x|X)\]\s*(.+)$/)
      if (done) return { checked: true, text: done[2].trim() }
      const open = line.match(/^\[\s\]\s*(.+)$/)
      if (open) return { checked: false, text: open[1].trim() }
      return { checked: false, text: line }
    })
}

const serializeChecklist = (items: ChecklistItem[]) =>
  items.map((item) => `[${item.checked ? 'x' : ' '}] ${item.text}`).join('\n')

export default function ProcessGrid({ processes, mode = 'all' }: ProcessGridProps) {
  const [items, setItems] = useState(processes)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isListsOpen, setIsListsOpen] = useState(true)
  const [editTitle, setEditTitle] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [editType, setEditType] = useState<BlockType>('PROCESS')
  const [newLogText, setNewLogText] = useState('')
  const [savingLog, setSavingLog] = useState(false)
  const [newChecklistTextById, setNewChecklistTextById] = useState<Record<string, string>>({})

  useEffect(() => {
    setItems(processes.filter((p) => p.type !== 'ANCHOR'))
  }, [processes])

  const selectedProcess = useMemo(
    () => items.find((process) => process.id === expandedId) || null,
    [items, expandedId]
  )
  const selectedType = normalizeType(selectedProcess?.type)
  const progressData = useMemo(
    () => (selectedType === 'PROCESS' && selectedProcess ? buildProgressData(selectedProcess.logs) : []),
    [selectedType, selectedProcess]
  )
  const maxProgressValue = Math.max(...progressData.map((item) => item.count), 1)

  const processBlocks = useMemo(() => items.filter((p) => normalizeType(p.type) === 'PROCESS'), [items])
  const listBlocks = useMemo(() => items.filter((p) => normalizeType(p.type) === 'LIST'), [items])
  const showProcesses = mode === 'all'

  const startEditing = (process: Process) => {
    setEditingId(process.id)
    setEditTitle(process.title)
    setEditGoal(process.goal || '')
    setEditType(normalizeType(process.type))
  }

  const handleSave = async (id: string) => {
    const cleanTitle = editTitle.trim()
    if (!cleanTitle) return
    const cleanGoal = editGoal.trim() || null
    await updateProcess(id, cleanTitle, cleanGoal, editType)
    setItems((prev) =>
      prev.map((process) =>
        process.id === id ? { ...process, title: cleanTitle, goal: cleanGoal, type: editType } : process
      )
    )
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('בטוח למחוק את הבלוק?')) return
    await deleteProcessById(id)
    setItems((prev) => prev.filter((process) => process.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const handleAddLog = async () => {
    if (!selectedProcess || selectedType !== 'PROCESS' || !newLogText.trim() || savingLog) return
    setSavingLog(true)
    try {
      const result = await addProcessLog(selectedProcess.id, newLogText)
      if (result.success && result.log) {
        setItems((prev) =>
          prev.map((process) =>
            process.id === selectedProcess.id ? { ...process, logs: [result.log, ...process.logs] } : process
          )
        )
      }
      setNewLogText('')
    } finally {
      setSavingLog(false)
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!selectedProcess || selectedType !== 'PROCESS') return
    await deleteProcessLog(logId)
    setItems((prev) =>
      prev.map((process) =>
        process.id === selectedProcess.id
          ? { ...process, logs: process.logs.filter((log) => log.id !== logId) }
          : process
      )
    )
  }

  const persistChecklistForProcess = async (processId: string, nextList: ChecklistItem[]) => {
    const process = items.find((item) => item.id === processId)
    if (!process) return
    const nextGoal = serializeChecklist(nextList)
    await updateProcess(processId, process.title, nextGoal || null, 'LIST')
    setItems((prev) =>
      prev.map((item) =>
        item.id === processId ? { ...item, goal: nextGoal || null, type: 'LIST' } : item
      )
    )
  }

  const toggleChecklistItem = async (processId: string, index: number) => {
    const process = items.find((item) => item.id === processId)
    if (!process) return
    const list = parseChecklist(process.goal)
    const next = list.map((item, itemIndex) => (itemIndex === index ? { ...item, checked: !item.checked } : item))
    await persistChecklistForProcess(processId, next)
  }

  const removeChecklistItem = async (processId: string, index: number) => {
    const process = items.find((item) => item.id === processId)
    if (!process) return
    const list = parseChecklist(process.goal)
    const next = list.filter((_, itemIndex) => itemIndex !== index)
    await persistChecklistForProcess(processId, next)
  }

  const addChecklistItem = async (processId: string) => {
    const text = (newChecklistTextById[processId] || '').trim()
    if (!text) return
    const process = items.find((item) => item.id === processId)
    if (!process) return
    const list = parseChecklist(process.goal)
    const next = [...list, { text, checked: false }]
    await persistChecklistForProcess(processId, next)
    setNewChecklistTextById((prev) => ({ ...prev, [processId]: '' }))
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" aria-hidden="true">
            <path
              d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 6h6m-6 4h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-700">No blocks yet</h3>
        <p className="mt-1 text-sm text-slate-500">Type a prompt in the chat to create your first block.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {showProcesses && (
          <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">יעדים</h3>
            <span className="text-xs text-gray-500">{processBlocks.length}</span>
          </div>
          {processBlocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center shadow-sm">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" aria-hidden="true">
                  <path
                    d="M8 6h8m-8 4h5m-7 6h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-700">אין יעדים פעילים</h3>
              <p className="mt-1 text-xs text-slate-500">הקלד הודעה בצ׳אט כדי ליצור את היעד הראשון שלך.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {processBlocks.map((process) => {
                const lastLog = process.logs[0]
                return (
                  <div
                    key={process.id}
                    className="group border border-gray-200 rounded-xl p-5 shadow-sm bg-white hover:shadow-md transition-all flex flex-col justify-between min-h-[170px]"
                  >
                    {editingId === process.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-transparent font-bold text-lg text-gray-800 border-b border-transparent focus:outline-none focus:border-blue-500"
                          placeholder="כותרת"
                        />
                        <select
                          value={editType}
                          onChange={(e) => setEditType(normalizeType(e.target.value))}
                          className="text-sm border border-gray-200 rounded p-2 focus:outline-none focus:border-blue-500"
                        >
                          <option value="PROCESS">יעד</option>
                          <option value="LIST">רשימה</option>
                        </select>
                        <textarea
                          value={editGoal}
                          onChange={(e) => setEditGoal(e.target.value)}
                          className="mt-2 w-full resize-none bg-transparent text-sm text-gray-600 border border-transparent focus:outline-none focus:border-blue-500 rounded-md p-0"
                          rows={3}
                          placeholder="תיאור יעד"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSave(process.id)}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                          >
                            שמור
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-lg text-gray-800 break-words">{process.title}</h3>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">יעד</span>
                          </div>
                          {process.goal && (
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap line-clamp-5">{process.goal}</p>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{process.logs.length} לוגים</span>
                            <span>
                              {lastLog ? `עדכון אחרון: ${toDate(lastLog.createdAt).toLocaleDateString('he-IL')}` : 'ללא עדכונים'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-mono" title={process.id}>
                              {process.id.slice(-6)}
                            </span>
                            <div className="space-x-3 space-x-reverse opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                              <button onClick={() => setExpandedId(process.id)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                                לוג וגרף
                              </button>
                              <button onClick={() => startEditing(process)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                                ערוך
                              </button>
                              <button onClick={() => handleDelete(process.id)} className="text-xs text-slate-400 hover:text-rose-600 font-medium">
                                מחק
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          </section>
        )}

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">רשימות</h3>
              <p className="text-xs text-gray-500">{listBlocks.length} רשימות פעילות</p>
            </div>
            <button
              type="button"
              onClick={() => setIsListsOpen((prev) => !prev)}
              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 transition-colors hover:bg-blue-100"
            >
              {isListsOpen ? 'סגור' : 'פתח'}
            </button>
          </div>

          {isListsOpen && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              {listBlocks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" aria-hidden="true">
                      <path
                        d="M7 6h10m-10 4h10m-10 4h6M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-700">אין רשימות פעילות</h3>
                  <p className="mt-1 text-xs text-slate-500">הקלד הודעה בצ׳אט כדי ליצור את הרשימה הראשונה שלך.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {listBlocks.map((process) => {
                    const checklist = parseChecklist(process.goal)
                    const completed = checklist.filter((item) => item.checked).length
                    return (
                      <div
                        key={process.id}
                        className="group border border-gray-200 rounded-xl p-5 shadow-sm bg-white hover:shadow-md transition-all flex flex-col gap-3 min-h-[220px]"
                      >
                    {editingId === process.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-transparent font-bold text-lg text-gray-800 border-b border-transparent focus:outline-none focus:border-blue-500"
                          placeholder="כותרת רשימה"
                        />
                        <select
                          value={editType}
                          onChange={(e) => setEditType(normalizeType(e.target.value))}
                          className="text-sm border border-gray-200 rounded p-2 focus:outline-none focus:border-blue-500"
                        >
                          <option value="LIST">רשימה</option>
                          <option value="PROCESS">יעד</option>
                        </select>
                        <textarea
                          value={editGoal}
                          onChange={(e) => setEditGoal(e.target.value)}
                          className="mt-2 w-full resize-none bg-transparent text-sm text-gray-600 border border-transparent focus:outline-none focus:border-blue-500 rounded-md p-0"
                          rows={3}
                          placeholder="כל שורה היא פריט"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSave(process.id)}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                          >
                            שמור
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded"
                          >
                            ביטול
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-lg text-gray-800 break-words">{process.title}</h3>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700">רשימה</span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {checklist.length ? `${completed}/${checklist.length} הושלמו` : 'אין פריטים עדיין'}
                        </div>
                        <div className="space-y-2 max-h-40 overflow-auto pr-1">
                          {checklist.map((item, index) => (
                            <label key={`${process.id}-${index}`} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggleChecklistItem(process.id, index)}
                                className="h-4 w-4 accent-blue-600"
                              />
                              <span className={item.checked ? 'line-through text-gray-400' : 'text-gray-700'}>
                                {item.text}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeChecklistItem(process.id, index)}
                                className="text-[11px] text-slate-400 hover:text-rose-600 mr-auto"
                              >
                                מחק
                              </button>
                            </label>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={newChecklistTextById[process.id] || ''}
                            onChange={(e) =>
                              setNewChecklistTextById((prev) => ({ ...prev, [process.id]: e.target.value }))
                            }
                            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                            placeholder="הוסף פריט"
                          />
                          <button
                            type="button"
                            onClick={() => addChecklistItem(process.id)}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                          >
                            הוסף
                          </button>
                        </div>
                        <div className="flex justify-end items-center pt-2 border-t border-gray-100 space-x-3 space-x-reverse opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                          <button onClick={() => startEditing(process)} className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                            ערוך
                          </button>
                          <button onClick={() => handleDelete(process.id)} className="text-xs text-slate-400 hover:text-rose-600 font-medium">
                            מחק
                          </button>
                        </div>
                      </>
                    )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {selectedProcess && selectedType === 'PROCESS' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedProcess.title}</h2>
                <p className="text-xs text-gray-500 mt-1">{`לוג פעילות לפי ${PROGRESS_DAYS} הימים האחרונים`}</p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedId(null)}
                className="text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                סגור
              </button>
            </div>

            <div className="p-5 border-b border-gray-100">
              <div className="flex items-end gap-1 h-28">
                {progressData.map((point, index) => {
                  const rawHeight = (point.count / maxProgressValue) * 100
                  const height = point.count === 0 ? 8 : Math.max(16, rawHeight)
                  return (
                    <div key={point.key} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <div className="w-full bg-indigo-500/85 rounded-t-md" style={{ height: `${height}%` }} />
                      {index % 2 === 0 && <span className="text-[10px] text-gray-500 leading-none">{point.label}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="p-5 border-b border-gray-100">
              <div className="flex gap-2">
                <input
                  value={newLogText}
                  onChange={(e) => setNewLogText(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="הוסף רשומת לוג חדשה"
                />
                <button
                  type="button"
                  onClick={handleAddLog}
                  disabled={savingLog || !newLogText.trim()}
                  className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg"
                >
                  הוסף לוג
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {selectedProcess.logs.length === 0 && <p className="text-sm text-gray-400">אין עדיין לוגים ליעד הזה.</p>}
              {selectedProcess.logs.map((log) => (
                <div key={log.id} className="border border-gray-100 rounded-2xl px-3 py-2.5 bg-gray-50 flex flex-col gap-1">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{log.content}</p>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{toDate(log.createdAt).toLocaleString('he-IL')}</span>
                    <button type="button" onClick={() => handleDeleteLog(log.id)} className="text-red-500 hover:text-red-700">
                      מחק
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

