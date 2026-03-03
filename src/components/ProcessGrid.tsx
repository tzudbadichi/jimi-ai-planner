'use client'

import React, { useState } from 'react'
import { updateProcess, deleteProcessById } from '@/app/actions'

interface Process {
  id: string
  title: string
  goal: string | null
}

interface ProcessGridProps {
  processes: Process[]
}

export default function ProcessGrid({ processes }: ProcessGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editGoal, setEditGoal] = useState('')

  const startEditing = (process: Process) => {
    setEditingId(process.id)
    setEditTitle(process.title)
    setEditGoal(process.goal || '')
  }

  const handleSave = async (id: string) => {
    await updateProcess(id, editTitle, editGoal)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('בטוח שאתה רוצה למחוק את הבלוק הזה?')) {
      await deleteProcessById(id)
    }
  }

  if (!processes || processes.length === 0) {
    return (
      <div className="p-6 border-2 border-dashed rounded-xl bg-gray-50 text-gray-500 text-center flex items-center justify-center min-h-[150px]">
        אין בלוקים פעילים.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {processes.map((process) => (
        <div
          key={process.id}
          className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white hover:shadow-md transition-all flex flex-col justify-between min-h-[150px]"
        >
          {editingId === process.id ? (
            <div className="flex flex-col space-y-2 h-full">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="font-bold text-lg text-gray-800 border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full"
                placeholder="כותרת"
              />
              <textarea
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                className="text-sm text-gray-600 mt-2 resize-none h-full border border-gray-200 rounded p-1 focus:outline-none focus:border-blue-500 w-full"
                placeholder="תוכן הבלוק..."
                rows={4}
              />
              <div className="flex justify-end space-x-2 space-x-reverse mt-2">
                <button onClick={() => handleSave(process.id)} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors">שמור</button>
                <button onClick={() => setEditingId(null)} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded transition-colors">ביטול</button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-lg text-gray-800 break-words">{process.title}</h3>
                {process.goal && (
                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                    {process.goal}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-mono" title={process.id}>
                  {process.id.slice(-6)}
                </span>
                <div className="space-x-3 space-x-reverse">
                  <button onClick={() => startEditing(process)} className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">ערוך</button>
                  <button onClick={() => handleDelete(process.id)} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">מחק</button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
