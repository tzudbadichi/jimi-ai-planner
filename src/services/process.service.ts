import { db } from "@/lib/db"
import { InferredList, parseChecklist, normalizeForMatch, serializeChecklist } from "@/lib/ai/parser"

export async function upsertInferredList(userId: string, list: InferredList): Promise<boolean> {
  const existing = await db.process.findUnique({ where: { userId_title: { userId, title: list.title } } })
  const existingItems = parseChecklist(existing?.goal ?? null)
  const existingNormalized = new Set(existingItems.map((item) => normalizeForMatch(item.text)))
  
  const uniqueItems = list.items
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !existingNormalized.has(normalizeForMatch(item)))
    .map((text) => ({ text, checked: false }))
    
  const nextGoal = serializeChecklist([...existingItems, ...uniqueItems]) || null

  if (!existing) {
    await db.process.create({
      data: {
        userId,
        title: list.title,
        goal: nextGoal,
        type: "LIST"
      }
    })
    return true
  }

  const shouldUpdate = existing.type !== "LIST" || nextGoal !== (existing.goal ?? null)
  if (!shouldUpdate) return false

  await db.process.updateMany({
    where: { id: existing.id, userId },
    data: {
      type: "LIST",
      goal: nextGoal
    }
  })
  return true
}
