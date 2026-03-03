'use server'

import { generateText } from "@/lib/gemini"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

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
    
    const contextStr = `
      Existing Anchors: ${anchors.map(a => `[ID: ${a.id}] ${a.title} (${a.startTime}-${a.endTime})`).join(" | ") || "None"}
      Existing Processes: ${processes.map(p => `[ID: ${p.id}] ${p.title}`).join(" | ") || "None"}
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
            "type": "CREATE_ANCHOR" | "CREATE_PROCESS" | "ADD_LOG" | "DELETE_ANCHOR" | "DELETE_PROCESS" | "CLEAR_ALL",
            "data": { 
               // For CREATE_ANCHOR: "title", "startTime", "endTime", "day"
               // For CREATE_PROCESS: "title", "goal"
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
    `

    // D. Call AI
    const raw = await generateText(prompt);
    console.log("[2] AI RAW:", raw);

    // E. Clean JSON
    let cleanJson = raw.replace(/```json|```/g, "").trim();
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);

    const result = JSON.parse(cleanJson);
    console.log("[3] PARSED ACTIONS:", result.actions ? result.actions.length : 0);

    // F. Execute Loop
    if (result.actions && Array.isArray(result.actions)) {
      for (const action of result.actions) {
        switch (action.type) {
          case "CREATE_ANCHOR":
            console.log("-> Creating Anchor:", action.data.title);
            await db.anchor.create({
              data: {
                title: action.data.title,
                startTime: action.data.startTime || "00:00",
                endTime: action.data.endTime || "00:00",
                day: action.data.day || "Daily"
              }
            });
            break;

          case "CREATE_PROCESS":
            console.log("-> Creating Process:", action.data.title);
            const existingProc = await db.process.findUnique({ where: { title: action.data.title } });
            if (!existingProc) {
              await db.process.create({
                data: { title: action.data.title, goal: action.data.goal || null }
              });
            }
            break;

          case "ADD_LOG":
            console.log("-> Adding Log to:", action.data.processTitle);
            let proc = await db.process.findUnique({ where: { title: action.data.processTitle } });
            if (!proc) {
               proc = await db.process.create({ data: { title: action.data.processTitle, goal: "Created via Log" } });
            }
            await db.log.create({
              data: { content: action.data.content, processId: proc.id }
            });
            break;

          case "DELETE_ANCHOR":
            console.log("-> Deleting Anchor ID:", action.data.id);
            if (action.data.id) {
              await db.anchor.delete({
                where: { id: action.data.id }
              });
            }
            break;

          case "DELETE_PROCESS":
            console.log("-> Deleting Process ID:", action.data.id);
            if (action.data.id) {
              await db.process.delete({
                where: { id: action.data.id }
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

    // G. Save Assistant Response
    await db.message.create({ data: { role: 'assistant', content: result.responseToUser } })

    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error("ERROR:", error)
    return { error: 'Failed' }
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

    const prompt = `
      System: You are "Jimi", an AI Life OS. 
      Your task is to build a recommended daily schedule for today (${todayStr}).
      
      CONSTRAINTS (Fixed Anchors):
      ${anchors.map(a => `- ${a.title}: ${a.startTime} to ${a.endTime}`).join('\n') || 'None'}
      
      GOALS TO FIT IN (Blocks):
      ${processes.map(p => `- ${p.title} (Goal: ${p.goal || 'None'})`).join('\n') || 'None'}
      
      INSTRUCTIONS:
      1. Create a logical, hour-by-hour timeline for the day.
      2. Strictly respect the fixed Anchor times.
      3. Fit the Blocks in the available free time blocks.
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
export async function updateProcess(id: string, title: string, goal: string | null) {
  try {
    await db.process.update({
      where: { id },
      data: { title, goal }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error("Error updating process:", error)
    throw new Error("Failed to update process")
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
