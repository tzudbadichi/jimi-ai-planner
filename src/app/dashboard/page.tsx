import { db } from "@/lib/db"
import { ChatArea } from "@/components/ChatArea"

// --- WIDGET COMPONENTS ---

const Widget = ({ title, icon, children }: { title: string, icon: string, children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
    <div className="space-y-3">
      {children}
    </div>
  </div>
)

const GoalCard = ({ title }: { title: string }) => (
  <div className="p-3 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100 flex items-center gap-3">
    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
    <span className="font-medium text-blue-900">{title}</span>
  </div>
)

const AnchorCard = ({ title, time, day }: { title: string, time: string, day: string }) => (
  <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex items-center gap-2">
      <span className="text-gray-400">⚓</span>
      <span className="text-gray-700 font-medium">{title}</span>
    </div>
    <div className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
      {day} • {time}
    </div>
  </div>
)

const ListCard = ({ title, items }: { title: string, items: any[] }) => (
  <div className="border-t border-gray-50 pt-3 first:border-0 first:pt-0">
    <h3 className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wider">{title}</h3>
    <ul className="space-y-1 pl-2">
      {items.map((item: any) => (
        <li key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={item.isChecked} readOnly className="rounded text-indigo-500 focus:ring-0" />
          <span className={item.isChecked ? "line-through opacity-50" : ""}>{item.content}</span>
        </li>
      ))}
    </ul>
  </div>
)

// --- MAIN PAGE ---

export default async function DashboardPage() {
  // שליפת נתונים במקביל מהטבלאות החדשות
  const [goals, anchors, lists, messages] = await Promise.all([
    db.goal.findMany(),
    db.anchor.findMany(),
    db.list.findMany({ include: { items: true } }),
    db.message.findMany({ orderBy: { createdAt: 'asc' } })
  ])

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: THE DASHBOARD */}
        <div className="lg:col-span-4 space-y-6">
          
          <Widget title="יעדים וצמיחה" icon="🎯">
            {goals.length === 0 && <p className="text-gray-400 text-sm">אין יעדים פעילים.</p>}
            {goals.map(g => <GoalCard key={g.id} title={g.title} />)}
          </Widget>

          <Widget title="עוגנים בלו״ז" icon="⚓">
            {anchors.length === 0 && <p className="text-gray-400 text-sm">הלו״ז פנוי לגמרי.</p>}
            {anchors.map(a => (
              <AnchorCard 
                key={a.id} 
                title={a.title} 
                day={a.day} 
                time={`${a.startTime}-${a.endTime}`} 
              />
            ))}
          </Widget>

          <Widget title="רשימות שוטפות" icon="📝">
             {lists.length === 0 && <p className="text-gray-400 text-sm">אין רשימות פתוחות.</p>}
             {lists.map(l => <ListCard key={l.id} title={l.title} items={l.items} />)}
          </Widget>

        </div>

        {/* RIGHT COLUMN: THE CHAT */}
        <div className="lg:col-span-8">
          <ChatArea initialMessages={messages} />
        </div>

      </div>
    </div>
  )
}