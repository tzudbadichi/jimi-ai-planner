'use client'

import { useState, useRef, useEffect } from 'react'
import { submitMessage } from '@/app/actions'

// --- UI COMPONENTS ---

const MessageBubble = ({ role, content }: { role: string, content: string }) => {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-tr-none' 
            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none' 
        }`}
      >
        {content}
      </div>
    </div>
  )
}

const LoadingBubble = () => (
  <div className="flex justify-start animate-pulse">
    <div className="bg-gray-100 text-gray-400 text-xs px-4 py-2 rounded-full">
      ג'ימי חושב...
    </div>
  </div>
)

// --- MAIN LOGIC ---

interface ChatAreaProps {
  initialMessages: { id: string, role: string, content: string }[]
}

export function ChatArea({ initialMessages }: ChatAreaProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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
      await submitMessage(userMsg.content)
      window.location.reload() 
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[85vh] bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200/60">
      
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-md p-4 border-b border-gray-100 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-bold text-gray-700">Jimi AI</span>
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {isLoading && <LoadingBubble />}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
          <input
            className="w-full bg-gray-100 border-0 rounded-full pl-5 pr-14 py-4 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none text-gray-800 placeholder:text-gray-400"
            placeholder="דבר איתי... (למשל: 'הוסף לקניות חלב')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute left-2 top-2 bottom-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-0 shadow-lg"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  )
}