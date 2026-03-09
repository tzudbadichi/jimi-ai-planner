'use server'

import { generateText } from "@/lib/gemini"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

type BlockType = "PROCESS" | "LIST"

type RouterActionType =
  | "CREATE_ANCHOR"
  | "CREATE_PROCESS"
  | "ADD_LIST_ITEMS"
  | "ADD_LOG"
  | "DELETE_ANCHOR"
  | "DELETE_PROCESS"
  | "CLEAR_ALL"

type RouterActionData = {
  id?: string
  title?: string
  goal?: string | null
  blockType?: BlockType | "ANCHOR"
  startTime?: string
  endTime?: string
  day?: string
  processTitle?: string
  listTitle?: string
  items?: string[]
  content?: string
}

type RouterAction = {
  type: RouterActionType
  data?: RouterActionData
}

type RouterResult = {
  actions: RouterAction[]
  responseToUser: string
}

type InferredProcess = {
  title: string
  goal: string | null
  blockType: BlockType
}

type InferredList = {
  title: string
  items: string[]
}

type ChecklistItem = {
  text: string
  checked: boolean
}

function parseChecklist(goal: string | null): ChecklistItem[] {
  if (!goal?.trim()) return []
  return goal
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const done = line.match(/^\[(x|X)\]\s*(.+)$/)
      if (done) return { checked: true, text: done[2].trim() }
      const open = line.match(/^\[\s\]\s*(.+)$/)
      if (open) return { checked: false, text: open[1].trim() }
      return { checked: false, text: line }
    })
}

function serializeChecklist(items: ChecklistItem[]): string {
  return items.map((item) => `[${item.checked ? 'x' : ' '}] ${item.text}`).join('\n')
}

function splitItemsFromText(text: string): string[] {
  return text
    .split(/\n|,|，|;|；/)
    .map((item) => item.trim().replace(/^[-*•]\s*/, ""))
    .filter(Boolean)
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeCreatedProcessData(
  title: string,
  blockType?: BlockType | "ANCHOR"
): { title: string; blockType: BlockType | "ANCHOR" } {
  const cleanTitle = title.trim()
  const explicitType = blockType
  const listPrefix = /^(?:רשימה|list)\s*[:\-]?\s*/i

  if (explicitType === "PROCESS" || explicitType === "LIST" || explicitType === "ANCHOR") {
    const normalizedTitle =
      explicitType === "LIST" ? cleanTitle.replace(listPrefix, "").trim() || cleanTitle : cleanTitle
    return { title: normalizedTitle, blockType: explicitType }
  }

  if (listPrefix.test(cleanTitle)) {
    return { title: cleanTitle.replace(listPrefix, "").trim() || cleanTitle, blockType: "LIST" }
  }

  return { title: cleanTitle, blockType: "PROCESS" }
}

function inferProcessCreationFromInput(content: string): InferredProcess | null {
  const trimmed = content.trim()
  if (!trimmed) return null

  const patterns = [
    /(?:תוסיף|תוסיף לי|תיצור|תייצר|תפתח|תעשה|add|create|make)\s+(?:לי\s+)?(?:בלוק|block|process|יעד)\s*(?:חדש|new)?\s*(?:של|for|:|-)?\s*(.+)$/i,
    /(?:בלוק|block|process|יעד)\s*(?:חדש|new)?\s*(?:של|for|:|-)\s*(.+)$/i
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    const rawTitle = match?.[1]?.trim()
    if (rawTitle) {
      const cleanedTitle = rawTitle.replace(/^["']|["']$/g, "").trim()
      if (cleanedTitle.length >= 2) {
        const lower = trimmed.toLowerCase()
        const blockType: BlockType =
          lower.includes("רשימה") || lower.includes("list")
            ? "LIST"
            : "PROCESS"
        return { title: cleanedTitle, goal: null, blockType }
      }
    }
  }

  return null
}

function inferListCreationFromInput(content: string): InferredList | null {
  const trimmed = content.trim()
  if (!trimmed) return null

  const mentionsList = /(?:רשימ(?:ת|ה)|\blist\b)/i.test(trimmed)
  const mentionsCreate = /(?:צור|תיצור|תיצרי|תוסיף|תוסיפי|create|add|make)/i.test(trimmed)
  if (!mentionsList || !mentionsCreate) return null

  const isShopping = /(?:קניות|shopping)/i.test(trimmed)
  const isMediterranean = /(?:ים[\s-]?תיכונ)/i.test(trimmed)
  const isVegan = /(?:טבעונ|vegan)/i.test(trimmed)

  let title = isShopping ? "רשימת קניות" : "רשימה חדשה"
  if (isMediterranean) title += " ים תיכונית"
  if (isVegan) title += " טבעונית"

  const items: string[] = []
  const itemsMatch = trimmed.match(/(?:כמו|כולל|include(?:s)?|items?\s*:)\s*(.+)$/i)
  if (itemsMatch?.[1]) {
    items.push(...splitItemsFromText(itemsMatch[1]))
  }

  if (items.length === 0 && isMediterranean && isVegan) {
    items.push(
      "שמן זית",
      "עגבניות",
      "מלפפונים",
      "חומוס",
      "עדשים",
      "קינואה",
      "לחם מחיטה מלאה",
      "שקדים",
      "טחינה",
      "עשבי תיבול טריים"
    )
  }

  return { title, items }
}

async function upsertInferredList(list: InferredList): Promise<boolean> {
  const existing = await db.process.findUnique({ where: { title: list.title } })
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
        title: list.title,
        goal: nextGoal,
        type: "LIST"
      }
    })
    return true
  }

  const shouldUpdate = existing.type !== "LIST" || nextGoal !== (existing.goal ?? null)
  if (!shouldUpdate) return false

  await db.process.update({
    where: { id: existing.id },
    data: {
      type: "LIST",
      goal: nextGoal
    }
  })
  return true
}

function parseRouterResult(raw: string): RouterResult | null {
  try {
    const clean = raw.replace(/```json|```/g, "").trim()
    const firstBrace = clean.indexOf("{")
    const lastBrace = clean.lastIndexOf("}")
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      return null
    }

    const jsonCandidate = clean.substring(firstBrace, lastBrace + 1)
    const parsed: unknown = JSON.parse(jsonCandidate)
    if (!parsed || typeof parsed !== "object") {
      return null
    }

    const withShape = parsed as Partial<RouterResult>
    return {
      actions: Array.isArray(withShape.actions) ? (withShape.actions as RouterAction[]) : [],
      responseToUser:
        typeof withShape.responseToUser === "string" && withShape.responseToUser.trim()
          ? withShape.responseToUser
          : "קיבלתי. עדכנתי את מה שהיה אפשר לבצע."
    }
  } catch {
    return null
  }
}

// --- 1. GET CHAT HISTORY ---
export async function getChatHistory() {
  return await db.message.findMany({
    orderBy: { createdAt: 'asc' }
  })
}

// --- 2. THE SMART BRAIN (ROUTER) ---
export async function submitMessage(content: string) {
  try {
    console.log("[1] USER INPUT:", content);

    // A. Save User Message
    await db.message.create({ data: { role: 'user', content } })

    // B. Context: Fetch existing Anchors & Processes WITH IDs
    const anchors = await db.anchor.findMany();
    const processes = await db.process.findMany();
    const recentMessages = await db.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { role: true, content: true }
    })
    const recentMessagesChronological = [...recentMessages].reverse()
    
    const contextStr = `
      Existing Anchors: ${anchors.map(a => `[ID: ${a.id}] ${a.title} (${a.startTime}-${a.endTime})`).join(" | ") || "None"}
      Existing Processes: ${processes.map(p => `[ID: ${p.id}] [TYPE: ${p.type}] ${p.title}`).join(" | ") || "None"}
      Recent Messages:
      ${recentMessagesChronological.map((m) => `- ${m.role}: ${m.content}`).join("\n") || "None"}
    `;

    // C. The Multi-Action Prompt (Supports empty actions for chat-only)
    const prompt = `
      System: You are "Jimi", an advanced AI Life OS.
      
      CONTEXT:
      - Current Date: ${new Date().toLocaleDateString('he-IL')}
      - ${contextStr}

      USER INPUT: "${content}"

      INSTRUCTIONS:
      Analyze the input. Determine if the user is making a general conversation OR if they are stating an actionable item that affects their schedule or processes.
      
      If it's just conversation, leave the "actions" array empty.
      If there are actionable items, break them down into a LIST of distinct actions. Do not ask for permission to act. If it implies a process or an anchor, execute the creation.

      OUTPUT JSON STRUCTURE:
      {
        "actions": [
          {
            "type": "CREATE_ANCHOR" | "CREATE_PROCESS" | "ADD_LIST_ITEMS" | "ADD_LOG" | "DELETE_ANCHOR" | "DELETE_PROCESS" | "CLEAR_ALL",
            "data": { 
               // For CREATE_ANCHOR: "title", "startTime", "endTime", "day"
               // For CREATE_PROCESS: "title", "goal", "blockType" where blockType is "PROCESS" | "LIST"
               // For ADD_LIST_ITEMS: "listTitle" (optional if only one list exists), "items" (array of strings)
               // For ADD_LOG: "processTitle", "content"
               // For DELETE_ANCHOR / DELETE_PROCESS: "id" (MUST be the exact ID from the context)
               // For CLEAR_ALL: {}
            }
          }
        ],
        "responseToUser": "Hebrew response answering the user or summarizing what was configured/deleted."
      }
      
      RULES:
      1. Return strictly valid JSON.
      2. If no database action is required (general chat), "actions" MUST be an empty array: [].
      3. If user wants to delete a specific process or anchor, you MUST use the exact ID provided in the CONTEXT. Do not use the title.
      4. Use "Recent Messages" to resolve follow-up references like "של זה", "אותה רשימה", "תחליט אתה".
      5. If user asks to add items to a shopping list, prefer ADD_LIST_ITEMS and generate concrete items when requested.
    `

    // D. Call AI
    let raw = ""
    try {
      raw = await generateText(prompt);
    } catch (modelError) {
      console.error("[2] MODEL ERROR:", modelError)
      const serviceBusyMessage =
        "שירות ה-AI כרגע בעומס זמני. ההודעה שלך נשמרה, ואפשר לנסות שוב בעוד כמה שניות."
      await db.message.create({ data: { role: "assistant", content: serviceBusyMessage } })
      revalidatePath('/dashboard')
      return { success: true, degraded: true }
    }
    console.log("[2] AI RAW:", raw);

    const inferredProcess = inferProcessCreationFromInput(content)
    const inferredList = inferListCreationFromInput(content)
    const result = parseRouterResult(raw);
    if (!result) {
      let createdFallback = false
      if (inferredList) {
        createdFallback = await upsertInferredList(inferredList)
      } else if (inferredProcess) {
        const existingProc = await db.process.findUnique({ where: { title: inferredProcess.title } })
        if (!existingProc) {
          await db.process.create({
            data: {
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
            ? `יצרתי רשימה חדשה: ${inferredList.title}`
            : inferredProcess
              ? `יצרתי בלוק חדש: ${inferredProcess.title}`
              : "קיבלתי. עדכנתי את מה שהיה אפשר לבצע."
          : "לא הצלחתי לנתח את הבקשה לפעולות, אבל אני כאן להמשך.")
      await db.message.create({ data: { role: "assistant", content: fallbackResponse } })
      revalidatePath('/dashboard')
      return { success: true }
    }

    console.log("[3] PARSED ACTIONS:", result.actions ? result.actions.length : 0);

    // F. Execute Loop
    if (result.actions && Array.isArray(result.actions)) {
      for (const action of result.actions) {
        const data = action?.data || {}
        switch (action.type) {
          case "CREATE_ANCHOR":
            if (!data.title?.trim()) break
            console.log("-> Creating Anchor:", data.title);
            await db.anchor.create({
              data: {
                title: data.title.trim(),
                startTime: data.startTime || "00:00",
                endTime: data.endTime || "00:00",
                day: data.day || "Daily"
              }
            });
            break;

          case "CREATE_PROCESS":
            if (!data.title?.trim()) break
            console.log("-> Creating Process:", data.title);
            const normalized = normalizeCreatedProcessData(data.title, data.blockType)
            if (normalized.blockType === "ANCHOR") {
              await db.anchor.create({
                data: {
                  title: normalized.title,
                  startTime: data.startTime || "00:00",
                  endTime: data.endTime || "00:00",
                  day: data.day || "Daily"
                }
              })
              break
            }
            const existingProc = await db.process.findUnique({ where: { title: normalized.title } });
            if (!existingProc) {
              const blockType: BlockType = normalized.blockType === "LIST" ? "LIST" : "PROCESS"
              await db.process.create({
                data: {
                  title: normalized.title,
                  goal: data.goal || null,
                  type: blockType
                }
              });
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
              where: { type: "LIST" }
            })
            if (listProcesses.length === 0) break

            const normalizedHint = normalizeForMatch(listTitleHint)
            let targetList =
              listProcesses.find((list) => normalizeForMatch(list.title) === normalizedHint) ||
              listProcesses.find((list) => normalizeForMatch(list.title).includes(normalizedHint) && normalizedHint) ||
              listProcesses.find((list) => normalizedHint.includes(normalizeForMatch(list.title)) && normalizedHint) ||
              null

            if (!targetList && listProcesses.length === 1) {
              targetList = listProcesses[0]
            }
            if (!targetList) break

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
            console.log("-> Adding Log to:", data.processTitle);
            const proc = await db.process.upsert({
              where: { title: data.processTitle },
              update: {},
              create: { title: data.processTitle, goal: "Created via Log", type: "PROCESS" }
            });

            if (data.content.trim()) {
              await db.log.create({
                data: { content: data.content, processId: proc.id }
              });
            }
            break;

          case "DELETE_ANCHOR":
            console.log("-> Deleting Anchor ID:", data.id);
            if (data.id) {
              await db.anchor.deleteMany({
                where: { id: data.id }
              });
            }
            break;

          case "DELETE_PROCESS":
            console.log("-> Deleting Process ID:", data.id);
            if (data.id) {
              await db.process.deleteMany({
                where: { id: data.id }
              });
            }
            break;

          case "CLEAR_ALL":
            console.log("-> CLEARING ALL DATA (Except Messages)");
            await db.log.deleteMany();
            await db.process.deleteMany();
            await db.anchor.deleteMany();
            break;
        }
      }
    }

    if (!result.actions || result.actions.length === 0) {
      if (inferredList) {
        await upsertInferredList(inferredList)
      } else if (inferredProcess) {
        const existingProc = await db.process.findUnique({ where: { title: inferredProcess.title } })
        if (!existingProc) {
          await db.process.create({
            data: {
              title: inferredProcess.title,
              goal: inferredProcess.goal,
              type: inferredProcess.blockType
            }
          })
        }
      }
    }

    // G. Save Assistant Response
    await db.message.create({ data: { role: 'assistant', content: result.responseToUser } })

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
  try {
    const todayStr = new Date().toLocaleDateString('he-IL')
    
    // If regeneration is not forced, try to fetch today's existing schedule
    if (!forceRegenerate) {
      const existing = await db.dailySchedule.findUnique({ where: { date: todayStr } })
      if (existing) {
        return { schedule: existing.content }
      }
    }

    const anchors = await db.anchor.findMany()
    const processes = await db.process.findMany()
    const goalBlocks = processes.filter((p) => p.type === "PROCESS")
    const listBlocks = processes.filter((p) => p.type === "LIST")

    const prompt = `
      System: You are "Jimi", an AI Life OS. 
      Your task is to build a recommended daily schedule for today (${todayStr}).
      
      CONSTRAINTS (Fixed Anchors):
      ${anchors.map(a => `- ${a.title}: ${a.startTime} to ${a.endTime} (${a.day})`).join('\n') || 'None'}
      
      GOAL BLOCKS TO FIT IN:
      ${goalBlocks.map(p => `- ${p.title} (Goal: ${p.goal || 'None'})`).join('\n') || 'None'}

      LIST BLOCKS (errands/tasks):
      ${listBlocks.map(p => `- ${p.title} (Items: ${p.goal || 'None'})`).join('\n') || 'None'}
      
      INSTRUCTIONS:
      1. Create a logical, hour-by-hour timeline for the day.
      2. Strictly respect the fixed Anchor times.
      3. Fit Goal Blocks and List Blocks in the available free time blocks.
      4. Output the schedule in a clean Markdown format in Hebrew.
    `

    const rawOutput = await generateText(prompt)
    
    // Save or update the daily schedule in the database
    await db.dailySchedule.upsert({
      where: { date: todayStr },
      update: { content: rawOutput },
      create: { date: todayStr, content: rawOutput }
    })

    revalidatePath('/dashboard')
    return { schedule: rawOutput }
  } catch (error) {
    console.error("Error generating schedule:", error)
    throw new Error("Failed to generate schedule")
  }
}
// --- 4. DIRECT UI ACTIONS ---
export async function updateProcess(
  id: string,
  title: string,
  goal: string | null,
  type: BlockType,
) {
  try {
    const updatedProcess = await db.process.update({
      where: { id },
      data: {
        title,
        goal,
        type
      }
    })
    revalidatePath('/dashboard')
    return { success: true, process: updatedProcess }
  } catch (error) {
    console.error("Error updating process:", error)
    throw new Error("Failed to update process")
  }
}

export async function addProcessLog(processId: string, content: string) {
  try {
    const trimmed = content.trim()
    if (!trimmed) {
      throw new Error("Log content is empty")
    }

    const log = await db.log.create({
      data: { processId, content: trimmed }
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
    await db.log.delete({
      where: { id: logId }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error("Error deleting process log:", error)
    throw new Error("Failed to delete process log")
  }
}

export async function deleteProcessById(id: string) {
  try {
    await db.process.delete({
      where: { id }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error("Error deleting process:", error)
    throw new Error("Failed to delete process")
  }
}
