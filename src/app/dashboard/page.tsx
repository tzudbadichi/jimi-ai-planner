import { db } from "@/lib/db"
import { ChatArea } from "@/components/ChatArea"
import { ProcessGrid } from "@/components/ProcessGrid"
import { AnchorsSidebar } from "@/components/AnchorsSidebar"
import { ScheduleButton } from "@/components/ScheduleButton"
import { getChatHistory } from "@/app/actions"

export default async function DashboardPage() {
  const messages = await getChatHistory()
  
  const processes = await db.process.findMany({
    include: { logs: { orderBy: { createdAt: 'desc' }, take: 3 } },
    orderBy: { createdAt: 'desc' }
  })
  
  const anchors = await db.anchor.findMany({
    orderBy: { startTime: 'asc' }
  })

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden" dir="rtl">
      {/* Right side - Chat Window (50%) */}
      <div className="w-1/2 h-full flex flex-col bg-white border-l border-gray-300">
        <ChatArea initialMessages={messages} />
      </div>

      {/* Left side - Dashboard & Schedule (50%) */}
      <div className="w-1/2 h-full flex flex-col">
        
        {/* Top Left - Anchors and Processes (50% height) */}
        <div className="h-1/2 flex p-4 gap-4 overflow-y-auto bg-gray-50 border-b border-gray-300">
          <div className="w-1/3">
            <AnchorsSidebar anchors={anchors} />
          </div>
          <div className="w-2/3">
            <ProcessGrid processes={processes} />
          </div>
        </div>

        {/* Bottom Left - Schedule Window (50% height) */}
        <div className="h-1/2 p-6 bg-white overflow-y-auto flex flex-col">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold">לו"ז יומי</h2>
            <ScheduleButton />
          </div>
          
          <div id="schedule-display-area" className="flex-1 w-full prose prose-sm max-w-none">
            <p className="text-gray-500 text-center mt-10 italic">
              לחץ על כפתור בניית הלו"ז כדי שג'ימי יארגן לך את היום...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}