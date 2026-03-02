import { getChatHistory } from "@/app/actions"
import { AnchorsSidebar } from "@/components/AnchorsSidebar"
import { ChatArea } from "@/components/ChatArea"
import { ProcessGrid } from "@/components/ProcessGrid"
import { ScheduleButton } from "@/components/ScheduleButton"
import { db } from "@/lib/db"

export default async function DashboardPage() {
  const messages = await getChatHistory()

  const processes = await db.process.findMany({
    include: { logs: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { createdAt: "desc" },
  })

  const anchors = await db.anchor.findMany({
    orderBy: { startTime: "asc" },
  })

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-100" dir="rtl">
      <div className="flex h-full w-1/2 flex-col border-l border-gray-300 bg-white">
        <ChatArea initialMessages={messages} />
      </div>

      <div className="flex h-full w-1/2 flex-col">
        <div className="flex h-1/2 gap-4 overflow-y-auto border-b border-gray-300 bg-gray-50 p-4">
          <div className="w-1/3">
            <AnchorsSidebar anchors={anchors} />
          </div>
          <div className="w-2/3">
            <ProcessGrid processes={processes} />
          </div>
        </div>

        <div className="flex h-1/2 flex-col overflow-y-auto bg-white p-6">
          <div className="mb-4 flex items-center justify-between border-b pb-2">
            <h2 className="text-xl font-bold">Daily Schedule</h2>
            <ScheduleButton />
          </div>

          <div id="schedule-display-area" className="prose prose-sm max-w-none flex-1 w-full">
            <p className="mt-10 text-center italic text-gray-500">
              Click the button to generate your schedule for today.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
