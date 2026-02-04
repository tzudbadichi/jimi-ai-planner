import { db } from "@/lib/db"
import { ChatArea } from "@/components/ChatArea"
import Link from "next/link"

// Define props for the server component to read URL parameters (e.g., ?trackId=123)
interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  // 1. Resolve search params (Next.js 15 requirement)
  const params = await searchParams
  const activeTrackId = typeof params.trackId === 'string' ? params.trackId : undefined

  // 2. Fetch all tracks for the sidebar
  const tracks = await db.track.findMany({
    orderBy: { createdAt: 'asc' }
  })

  // 3. Determine which chat to load (Main Chat vs. Specific Track Chat)
  const activeTrack = activeTrackId 
    ? tracks.find(t => t.id === activeTrackId) 
    : null

  // 4. Fetch the relevant message history
  const messages = await db.message.findMany({
    where: {
      trackId: activeTrackId || null // null = Main Chat
    },
    orderBy: { createdAt: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-8 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-black text-indigo-600 tracking-tight">JIMI.AI</h1>
        <div className="text-sm text-gray-500">
          {activeTrack ? `Focus Mode: ${activeTrack.name}` : "General Overview"}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Tracks Navigation */}
        <div className="md:col-span-4 space-y-4">
          <h2 className="text-lg font-bold text-gray-700 mb-2">My Tracks</h2>
          
          {/* Button: Main Lobby */}
          <Link 
            href="/dashboard"
            className={`block w-full text-right p-4 rounded-xl transition-all border ${
              !activeTrackId 
                ? 'bg-indigo-600 text-white shadow-lg border-indigo-600' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="font-bold">🏠 The Lobby</div>
            <div className="text-xs opacity-80 mt-1">General daily planning</div>
          </Link>

          {/* List: Dynamic Tracks */}
          <div className="space-y-2">
            {tracks.map((track) => {
              const isActive = track.id === activeTrackId
              const goals = JSON.parse(track.goals) as string[]

              return (
                <Link 
                  key={track.id} 
                  href={`/dashboard?trackId=${track.id}`}
                  className={`block w-full text-right p-4 rounded-xl transition-all border ${
                    isActive 
                      ? 'bg-white border-indigo-500 ring-2 ring-indigo-100 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                      track.type === 'ANCHOR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {track.type}
                    </span>
                    <span className="font-bold text-gray-800">{track.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {goals[0]}...
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right Main Area: The Chat Interface */}
        <div className="md:col-span-8">
          <ChatArea 
            // We pass a key here to force the component to re-render when changing tracks
            key={activeTrackId || 'home'} 
            initialMessages={messages} 
            trackId={activeTrackId}
            trackName={activeTrack?.name}
          />
        </div>

      </main>
    </div>
  )
}