import { db } from "@/lib/db"
import ChatArea from "@/components/ChatArea"
import ProcessGrid from "@/components/ProcessGrid"
import SchedulePanel from "@/components/SchedulePanel"
import { AnchorsSidebar } from "@/components/AnchorsSidebar"
import { GoalsSidebar } from "@/components/GoalsSidebar"

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
  const goalBlocks = processes
    .filter((process) => process.type === 'PROCESS')
    .map((process) => ({
      id: process.id,
      title: process.title,
      goal: process.goal,
      logsCount: process.logs.length
    }))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">Jimi Dashboard</h1>

          <div>
            <SchedulePanel initialSchedule={todaySchedule?.content || null} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <AnchorsSidebar anchors={mergedAnchors} />
            <GoalsSidebar goals={goalBlocks} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">רשימות</h2>
            <ProcessGrid processes={processes} mode="listsOnly" />
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-screen shadow-lg">
        <ChatArea initialMessages={initialMessages} />
      </div>
    </div>
  )
}
