import { db } from "@/lib/db"
import { generateText } from "@/lib/gemini"
import { cleanGeneratedSchedule } from "@/lib/ai/parser"
import { buildDailySchedulePrompt, buildWeeklySchedulePrompt } from "@/lib/ai/prompts"

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getWeekStart(date: Date): Date {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)
  return start
}

export async function generateScheduleForUser(userId: string, forceRegenerate: boolean = false) {
  try {
    const today = new Date()
    const todayIso = toIsoDate(today)
    const todayHebrew = today.toLocaleDateString('he-IL')
    
    // If regeneration is not forced, try to fetch today's existing schedule
    if (!forceRegenerate) {
      const existing = await db.dailySchedule.findUnique({
        where: { userId_date: { userId, date: todayIso } }
      })
      if (existing) {
        return { schedule: existing.content }
      }
      const legacy = await db.dailySchedule.findUnique({
        where: { userId_date: { userId, date: todayHebrew } }
      })
      if (legacy) {
        await db.dailySchedule.update({
          where: { userId_date: { userId, date: todayHebrew } },
          data: { date: todayIso }
        })
        return { schedule: legacy.content }
      }
    }

    const anchors = await db.anchor.findMany({ where: { userId } })
    const processes = await db.process.findMany({ where: { userId } })
    const goalBlocks = processes.filter((p) => p.type === "PROCESS")
    const listBlocks = processes.filter((p) => p.type === "LIST")

    const prompt = buildDailySchedulePrompt(todayHebrew, anchors, goalBlocks, listBlocks)

    const rawOutput = await generateText(prompt)
    const cleanedOutput = cleanGeneratedSchedule(rawOutput)
    
    // Save or update the daily schedule in the database
    await db.dailySchedule.upsert({
      where: { userId_date: { userId, date: todayIso } },
      update: { content: cleanedOutput },
      create: { userId, date: todayIso, content: cleanedOutput }
    })

    return { schedule: cleanedOutput }
  } catch (error) {
    console.error("Error generating schedule:", error)
    throw new Error("Failed to generate schedule")
  }
}

export async function generateWeeklyScheduleForUser(userId: string) {
  const now = new Date()
  const weekStart = getWeekStart(now)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return {
      dayName: dayNames[date.getDay()],
      iso: toIsoDate(date),
      hebrew: date.toLocaleDateString('he-IL')
    }
  })

  const anchors = await db.anchor.findMany({ where: { userId } })
  const processes = await db.process.findMany({ where: { userId } })
  const goalBlocks = processes.filter((p) => p.type === "PROCESS")
  const listBlocks = processes.filter((p) => p.type === "LIST")

  const prompt = buildWeeklySchedulePrompt(
    toIsoDate(weekStart), 
    toIsoDate(weekEnd), 
    days, 
    anchors, 
    goalBlocks, 
    listBlocks
  )

  const rawOutput = await generateText(prompt)
  const cleanedOutput = cleanGeneratedSchedule(rawOutput)
  await db.weeklySchedule.upsert({
    where: { userId_weekStart: { userId, weekStart: toIsoDate(weekStart) } },
    update: { content: cleanedOutput },
    create: { userId, weekStart: toIsoDate(weekStart), content: cleanedOutput }
  })
  
  return { schedule: cleanedOutput }
}
