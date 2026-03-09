import { db } from "@/lib/db"
import ChatArea from "@/components/ChatArea"
import ProcessGrid from "@/components/ProcessGrid"
import SchedulePanel from "@/components/SchedulePanel"
import { AnchorsSidebar } from "@/components/AnchorsSidebar"
import { GoalsSidebar } from "@/components/GoalsSidebar"
import ResetAllButton from "@/components/ResetAllButton"
import SignOutButton from "@/components/SignOutButton"
import { requireUser } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireUser()

  const processes = await db.process.findMany({
    where: {
      userId: user.id,
      NOT: { type: 'ANCHOR' }
    },
    include: {
      logs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  const initialMessages = await db.message.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true }
  })
  
  const todayStr = new Date().toLocaleDateString('he-IL')
  const todaySchedule = await db.dailySchedule.findUnique({
    where: { userId_date: { userId: user.id, date: todayStr } }
  })
  const anchors = await db.anchor.findMany({
    where: { userId: user.id },
    orderBy: [
      { day: 'asc' },
      { startTime: 'asc' }
    ]
  })
  const mergedAnchors = anchors
  const goalBlocks = processes
    .filter((process) => process.type === 'PROCESS')
    .map((process) => ({
      id: process.id,
      title: process.title,
      goal: process.goal,
      logsCount: process.logs.length,
      logs: process.logs.map((log) => ({
        id: log.id,
        content: log.content,
        createdAt: log.createdAt.toISOString()
      }))
    }))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Jimi Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <ResetAllButton />
              <SignOutButton />
            </div>
          </div>

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
