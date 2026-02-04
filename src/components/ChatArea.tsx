'use client'

import { useState, useRef, useEffect } from 'react'
import { submitMessage } from '@/app/actions'

interface Message {
  id: string
  role: string
  content: string
}

interface ChatAreaProps {
  initialMessages: Message[]
  trackId?: string
  trackName?: string
}

export function ChatArea({ initialMessages, trackId, trackName }: ChatAreaProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // גלילה אוטומטית למטה כשנוספת הודעה
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    if (!input.trim() || isLoading) return

    const userMsg = { id: Date.now().toString(), role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      // שליחה לשרת
      await submitMessage(userMsg.content, trackId)
      // רענון הדף יביא את התשובה מהשרת, אבל בינתיים נראה שהכל נשלח
      // (בשלב הבא נחבר את זה ללייב-רענון של נקסט)
      window.location.reload() 
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* כותרת הצ'אט */}
      <div className="bg-indigo-600 p-4 text-white font-bold flex justify-between items-center shadow-md z-10">
        <span>{trackName ? `💬 ${trackName}` : '🚀 הלובי הראשי'}</span>
        <span className="text-xs opacity-70 bg-indigo-800 px-2 py-1 rounded-full">
           ג'ימי מחובר
        </span>
      </div>

      {/* אזור ההודעות */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((m) => {
          const isUser = m.role === 'user'
          return (
            <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  isUser 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                }`}
              >
                {m.content}
              </div>
            </div>
          )
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-500 text-xs px-3 py-2 rounded-full animate-pulse">
              ג'ימי מקליד...
            </div>
          </div>
        )}
      </div>

      {/* אזור ההקלדה */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 placeholder:text-gray-400"
            placeholder={trackName ? `דבר איתי על ${trackName}...` : "דבר איתי חופשי..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md transform active:scale-95"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  )
}