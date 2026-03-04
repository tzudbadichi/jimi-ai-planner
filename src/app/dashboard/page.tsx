import { db } from "@/lib/db"
import ChatArea from "@/components/ChatArea"
import ProcessGrid from "@/components/ProcessGrid"
import SchedulePanel from "@/components/SchedulePanel"
import { AnchorsSidebar } from "@/components/AnchorsSidebar"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const processes = await db.process.findMany({
    where: {
      NOT: { type: 'ANCHOR' }
    },
    include: {
      logs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  const initialMessages = await db.message.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true }
  })
  
  const todayStr = new Date().toLocaleDateString('he-IL')
  const todaySchedule = await db.dailySchedule.findUnique({
    where: { date: todayStr }
  })
  const anchors = await db.anchor.findMany({
    orderBy: [
      { day: 'asc' },
      { startTime: 'asc' }
    ]
  })
  const legacyAnchorBlocks = await db.process.findMany({
    where: { type: 'ANCHOR' },
    orderBy: { title: 'asc' }
  })
  const mergedAnchors = [
    ...anchors,
    ...legacyAnchorBlocks.map((item) => ({
      id: `legacy-${item.id}`,
      title: item.title,
      startTime: item.startTime || '00:00',
      endTime: item.endTime || '00:00',
      day: item.day || 'Daily'
    }))
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">Jimi Dashboard</h1>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2">
              <SchedulePanel initialSchedule={todaySchedule?.content || null} />
            </div>
            <AnchorsSidebar anchors={mergedAnchors} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Active Blocks</h2>
            <ProcessGrid processes={processes} />
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-screen shadow-lg">
        <ChatArea initialMessages={initialMessages} />
      </div>
    </div>
  )
}
