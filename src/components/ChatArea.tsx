'use client'

import { submitMessage } from '@/app/actions'
import { useEffect, useRef, useState } from 'react'

const MessageBubble = ({ role, content }: { role: string; content: string }) => {
  const isUser = role === 'user'

  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-tr-none bg-indigo-600 text-white'
            : 'rounded-tl-none border border-gray-100 bg-white text-gray-800'
        }`}
      >
        {content}
      </div>
    </div>
  )
}

const LoadingBubble = () => (
  <div className="flex animate-pulse justify-start">
    <div className="rounded-full bg-gray-100 px-4 py-2 text-xs text-gray-400">Jimi is thinking...</div>
  </div>
)

interface ChatAreaProps {
  initialMessages: { id: string; role: string; content: string }[]
}

export default function ChatArea({ initialMessages }: ChatAreaProps) {
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
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const result = await submitMessage(userMsg.content)
      if (result?.error) {
        console.error(result.error)
        return
      }
      window.location.reload()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[85vh] flex-col overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/80 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
          <span className="font-bold text-gray-700">Jimi AI</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50/30 p-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {isLoading && <LoadingBubble />}
      </div>

      <div className="border-t border-gray-100 bg-white p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="relative"
        >
          <input
            className="w-full rounded-full border-0 bg-gray-100 py-4 pl-5 pr-14 text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Write a message... for example: add milk to shopping list"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute bottom-2 left-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all hover:bg-indigo-700 disabled:opacity-0"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
