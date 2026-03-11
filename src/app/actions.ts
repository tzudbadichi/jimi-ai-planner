'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/auth"
import { generateText } from "@/lib/gemini"
import { 
  BlockType,
  inferProcessCreationFromInput, 
  inferListCreationFromInput, 
  parseRouterResult, 
  normalizeCreatedProcessData,
  splitItemsFromText,
  normalizeForMatch,
  serializeChecklist,
  parseChecklist
} from "@/lib/ai/parser"
import { buildRouterPrompt } from "@/lib/ai/prompts"
import { upsertInferredList } from "@/services/process.service"
import { 
  generateScheduleForUser, 
  generateWeeklyScheduleForUser, 
  toIsoDate, 
  getWeekStart 
} from "@/services/schedule.service"

function normalizeAnchorDay(day?: string): string {
  const value = day?.trim()
  if (!value) return "Daily"

  const map: Record<string, string> = {
    DAILY: "Daily",
    SUNDAY: "Sunday",
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday",
  }

  const upper = value.toUpperCase()
  if (map[upper]) return map[upper]
  return value
}

// --- 1. GET CHAT HISTORY ---
export async function getChatHistory() {
  const userId = await requireUserId()
  return await db.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  })
}

// --- 2. THE SMART BRAIN (ROUTER) ---
export async function submitMessage(content: string) {
  try {
    const userId = await requireUserId()
    console.log("[1] USER INPUT RECEIVED");

    // A. Save User Message
    await db.message.create({ data: { userId, role: 'user', content } })

    // B. Context: Fetch existing Anchors & Processes WITH IDs
    const anchors = await db.anchor.findMany({ where: { userId } });
    const processes = await db.process.findMany({ where: { userId } });
    const recentMessages = await db.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { role: true, content: true }
    })
    const recentMessagesChronological = [...recentMessages].reverse()

    // C. The Multi-Action Prompt (Supports empty actions for chat-only)
    const now = new Date()
    const todayIso = toIsoDate(now)
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    const tomorrowIso = toIsoDate(tomorrow)
    const todayHebrew = now.toLocaleDateString('he-IL')
    const tomorrowHebrew = tomorrow.toLocaleDateString('he-IL')

    const prompt = buildRouterPrompt(
      todayIso, 
      todayHebrew, 
      tomorrowIso, 
      tomorrowHebrew, 
      anchors, 
      processes, 
      recentMessagesChronological, 
      content
    )

    // D. Call AI
    let raw = ""
    try {
      raw = await generateText(prompt);
    } catch (modelError) {
      console.error("[2] MODEL ERROR:", modelError)
      const serviceBusyMessage =
        "שירות ה-AI כרגע בעומס זמני. ההודעה שלך נשמרה, ואפשר לנסות שוב בעוד כמה שניות."
      await db.message.create({ data: { userId, role: "assistant", content: serviceBusyMessage } })
      revalidatePath('/dashboard')
      return { success: true, degraded: true }
    }
    console.log("[2] AI RESPONSE RECEIVED");

    const inferredProcess = inferProcessCreationFromInput(content)
    const inferredList = inferListCreationFromInput(content)
    const result = parseRouterResult(raw);
    if (!result) {
      let createdFallback = false
      if (inferredList) {
        createdFallback = await upsertInferredList(userId, inferredList)
      } else if (inferredProcess) {
        const existingProc = await db.process.findUnique({
          where: { userId_title: { userId, title: inferredProcess.title } },
        })
        if (!existingProc) {
          await db.process.create({
            data: {
              userId,
              title: inferredProcess.title,
              goal: inferredProcess.goal,
              type: inferredProcess.blockType
            }
          })
          createdFallback = true
        }
      }

      const fallbackResponse =
        raw.trim() ||
        (createdFallback
          ? inferredList
            ? `יצרתי רשימה חדשה: \${inferredList.title}`
            : inferredProcess
              ? `יצרתי בלוק חדש: \${inferredProcess.title}`
              : "קיבלתי. עדכנתי את מה שהיה אפשר לבצע."
          : "לא הצלחתי לנתח את הבקשה לפעולות, אבל אני כאן להמשך.")
      await db.message.create({ data: { userId, role: "assistant", content: fallbackResponse } })
      revalidatePath('/dashboard')
      return { success: true }
    }

    console.log("[3] PARSED ACTIONS:", result.actions ? result.actions.length : 0);

    // F. Execute Loop
    let shouldGenerateSchedule = false
    let shouldGenerateWeeklySchedule = false
    let weeklyScheduleContent: string | null = null

    if (result.actions && Array.isArray(result.actions)) {
      for (const action of result.actions) {
        const data = action?.data || {}
        switch (action.type) {
          case "CREATE_ANCHOR":
            if (!data.title?.trim()) break
            console.log("-> Creating Anchor");
            await db.anchor.create({
              data: {
                userId,
                title: data.title.trim(),
                startTime: data.startTime || "00:00",
                endTime: data.endTime || "00:00",
                day: normalizeAnchorDay(data.day)
              }
            });
            break;

          case "CREATE_PROCESS":
            if (!data.title?.trim()) break
            console.log("-> Creating Process");
            const normalized = normalizeCreatedProcessData(data.title, data.blockType)
            if (normalized.blockType === "ANCHOR") {
              await db.anchor.create({
                data: {
                  userId,
                  title: normalized.title,
                  startTime: data.startTime || "00:00",
                  endTime: data.endTime || "00:00",
                  day: normalizeAnchorDay(data.day)
                }
              })
              break
            }
            const existingProc = await db.process.findUnique({
              where: { userId_title: { userId, title: normalized.title } },
            });
            const blockType: BlockType = normalized.blockType === "LIST" ? "LIST" : "PROCESS"
            if (!existingProc) {
              await db.process.create({
                data: {
                  userId,
                  title: normalized.title,
                  goal: data.goal || null,
                  type: blockType
                }
              });
            } else if (existingProc.type !== blockType || (data.goal?.trim() && !existingProc.goal)) {
              await db.process.update({
                where: { id: existingProc.id },
                data: {
                  type: blockType,
                  goal: data.goal || existingProc.goal
                }
              })
            }
            break;

          case "ADD_LIST_ITEMS": {
            const listTitleHint = data.listTitle?.trim() || ""
            const itemsFromArray = Array.isArray(data.items)
              ? data.items.map((item) => item.trim()).filter(Boolean)
              : []
            const itemsFromContent = data.content?.trim() ? splitItemsFromText(data.content) : []
            const itemsToAdd = [...itemsFromArray, ...itemsFromContent]
            if (itemsToAdd.length === 0) break

            const listProcesses = await db.process.findMany({
              where: { userId, type: "LIST" }
            })

            const normalizedHint = normalizeForMatch(listTitleHint)
            let targetList =
              listProcesses.find((list) => normalizeForMatch(list.title) === normalizedHint) ||
              listProcesses.find((list) => normalizeForMatch(list.title).includes(normalizedHint) && normalizedHint) ||
              listProcesses.find((list) => normalizedHint.includes(normalizeForMatch(list.title)) && normalizedHint) ||
              null

            if (!targetList && listProcesses.length === 1) {
              targetList = listProcesses[0]
            }

            if (!targetList) {
              const fallbackTitle = listTitleHint || "רשימה חדשה"
              targetList = await db.process.upsert({
                where: { userId_title: { userId, title: fallbackTitle } },
                update: { type: "LIST" },
                create: { userId, title: fallbackTitle, goal: null, type: "LIST" }
              })
            }

            const existingItems = parseChecklist(targetList.goal)
            const existingNormalized = new Set(existingItems.map((item) => normalizeForMatch(item.text)))
            const newItems = itemsToAdd
              .map((item) => item.trim())
              .filter(Boolean)
              .filter((item) => !existingNormalized.has(normalizeForMatch(item)))
              .map((text) => ({ text, checked: false }))

            if (newItems.length === 0) break

            const nextGoal = serializeChecklist([...existingItems, ...newItems])
            await db.process.update({
              where: { id: targetList.id },
              data: { goal: nextGoal, type: "LIST" }
            })
            break
          }

          case "ADD_LOG":
            if (!data.processTitle?.trim() || !data.content?.trim()) break
            console.log("-> Adding Log");
            const existingProcForLog = await db.process.findUnique({
              where: { userId_title: { userId, title: data.processTitle } },
            })
            const proc =
              existingProcForLog ??
              (await db.process.create({
                data: { userId, title: data.processTitle, goal: "Created via Log", type: "PROCESS" }
              }))

            if (data.content.trim()) {
              await db.log.create({
                data: { userId, content: data.content, processId: proc.id }
              });
            }
            break;

          case "DELETE_ANCHOR":
            console.log("-> Deleting Anchor");
            if (data.id) {
              await db.anchor.deleteMany({
                where: { id: data.id, userId }
              });
            }
            break;

          case "DELETE_PROCESS":
            console.log("-> Deleting Process");
            if (data.id) {
              await db.process.deleteMany({
                where: { id: data.id, userId }
              });
            }
            break;

          case "GENERATE_SCHEDULE":
            shouldGenerateSchedule = true
            break;

          case "GENERATE_WEEKLY_SCHEDULE":
            shouldGenerateWeeklySchedule = true
            break;

          case "CLEAR_ALL":
            console.log("-> CLEARING ALL DATA (Including Messages)");
            await db.log.deleteMany({ where: { userId } });
            await db.dailySchedule.deleteMany({ where: { userId } });
            await db.weeklySchedule.deleteMany({ where: { userId } });
            await db.process.deleteMany({ where: { userId } });
            await db.anchor.deleteMany({ where: { userId } });
            await db.message.deleteMany({ where: { userId } });
            break;
        }
      }
    }

    if (shouldGenerateSchedule) {
      await generateScheduleForUser(userId, true)
    }
    if (shouldGenerateWeeklySchedule) {
      const weekly = await generateWeeklyScheduleForUser(userId)
      weeklyScheduleContent = weekly.schedule || "לא הצלחתי לייצר לוז שבועי כרגע."
    }

    if (!result.actions || result.actions.length === 0) {
      if (inferredList) {
        await upsertInferredList(userId, inferredList)
      } else if (inferredProcess) {
        const existingProc = await db.process.findUnique({
          where: { userId_title: { userId, title: inferredProcess.title } },
        })
        if (!existingProc) {
          await db.process.create({
            data: {
              userId,
              title: inferredProcess.title,
              goal: inferredProcess.goal,
              type: inferredProcess.blockType
            }
          })
        }
      }
    }

    // G. Save Assistant Response
    const responseContent = weeklyScheduleContent || result.responseToUser
    await db.message.create({ data: { userId, role: 'assistant', content: responseContent } })

    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error("ERROR:", error)
    const message = error instanceof Error ? error.message : "Failed"
    return { error: message }
  }
}

// --- 3. GENERATE SCHEDULE ---

export async function generateSchedule(forceRegenerate: boolean = false) {
  const userId = await requireUserId()
  const result = await generateScheduleForUser(userId, forceRegenerate)
  revalidatePath('/dashboard')
  return result
}

export async function generateWeeklySchedule() {
  const userId = await requireUserId()
  const result = await generateWeeklyScheduleForUser(userId)
  revalidatePath('/dashboard')
  return result
}

export async function getWeeklyScheduleForCurrentWeek() {
  const userId = await requireUserId()
  const weekStart = getWeekStart(new Date())
  return db.weeklySchedule.findUnique({
    where: { userId_weekStart: { userId, weekStart: toIsoDate(weekStart) } }
  })
}

// --- 4. DIRECT UI ACTIONS ---
export async function updateProcess(
  id: string,
  title: string,
  goal: string | null,
  type: BlockType,
) {
  try {
    const userId = await requireUserId()
    const updated = await db.process.updateMany({
      where: { id, userId },
      data: { title, goal, type }
    })
    if (updated.count === 0) throw new Error('Process not found')

    const updatedProcess = await db.process.findUnique({ where: { id } })
    revalidatePath('/dashboard')
    return { success: true, process: updatedProcess }
  } catch (error) {
    console.error("Error updating process:", error)
    throw new Error("Failed to update process")
  }
}

export async function addProcessLog(processId: string, content: string) {
  try {
    const userId = await requireUserId()
    const trimmed = content.trim()
    if (!trimmed) {
      throw new Error("Log content is empty")
    }

    const process = await db.process.findFirst({
      where: { id: processId, userId },
      select: { id: true }
    })
    if (!process) throw new Error('Process not found')

    const log = await db.log.create({
      data: { userId, processId, content: trimmed }
    })

    revalidatePath('/dashboard')
    return {
      success: true,
      log: {
        id: log.id,
        content: log.content,
        createdAt: log.createdAt.toISOString()
      }
    }
  } catch (error) {
    console.error("Error adding process log:", error)
    throw new Error("Failed to add process log")
  }
}

export async function deleteProcessLog(logId: string) {
  try {
    const userId = await requireUserId()
    await db.log.deleteMany({ where: { id: logId, userId } })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error("Error deleting process log:", error)
    throw new Error("Failed to delete process log")
  }
}

export async function deleteProcessById(id: string) {
  try {
    const userId = await requireUserId()
    await db.process.deleteMany({ where: { id, userId } })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error("Error deleting process:", error)
    throw new Error("Failed to delete process")
  }
}

export async function resetAllData() {
  try {
    const userId = await requireUserId()
    await db.$transaction([
      db.log.deleteMany({ where: { userId } }),
      db.dailySchedule.deleteMany({ where: { userId } }),
      db.weeklySchedule.deleteMany({ where: { userId } }),
      db.anchor.deleteMany({ where: { userId } }),
      db.process.deleteMany({ where: { userId } }),
      db.message.deleteMany({ where: { userId } }),
    ])

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error resetting all data:', error)
    throw new Error('Failed to reset all data')
  }
}
