import { db } from "@/lib/db"
import ChatArea from "@/components/ChatArea"
import ProcessGrid from "@/components/ProcessGrid"
import SchedulePanel from "@/components/SchedulePanel"
import { AnchorsSidebar } from "@/components/AnchorsSidebar"
import { GoalsSidebar } from "@/components/GoalsSidebar"
import DashboardHeader from "@/components/DashboardHeader"
import { requireUser } from "@/lib/auth"
import { getWeeklyScheduleForCurrentWeek } from "@/app/actions"
import { toIsoDate } from "@/services/schedule.service"

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

  const today = new Date()
  const todayIso = toIsoDate(today)
  const todayHebrew = today.toLocaleDateString('he-IL')
  const todaySchedule =
    (await db.dailySchedule.findUnique({
      where: { userId_date: { userId: user.id, date: todayIso } }
    })) ||
    (await db.dailySchedule.findUnique({
      where: { userId_date: { userId: user.id, date: todayHebrew } }
    }))
  const weeklySchedule = await getWeeklyScheduleForCurrentWeek()
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
    <div className="min-h-screen bg-gray-50 md:flex">
      <main className="flex-1 p-5 pb-24 md:p-6 md:pb-6">
        <div className="mx-auto max-w-6xl space-y-5 md:space-y-6">
          <DashboardHeader email={user.email || ''} />

          <section>
            <SchedulePanel
              initialSchedule={todaySchedule?.content || null}
              initialWeeklySchedule={weeklySchedule?.content || null}
            />
          </section>

          <section className="space-y-4">
            <ProcessGrid processes={processes} mode="listsOnly" />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
            <AnchorsSidebar anchors={mergedAnchors} />
            <GoalsSidebar goals={goalBlocks} />
          </section>
        </div>
      </main>

      <aside className="hidden md:flex md:w-[360px] md:shrink-0 md:border-l md:border-gray-200 md:bg-white md:shadow-lg md:sticky md:top-0 md:h-screen">
        <ChatArea initialMessages={initialMessages} variant="desktop" />
      </aside>

      <div className="md:hidden">
        <ChatArea initialMessages={initialMessages} variant="mobile" />
      </div>
    </div>
  )
}
