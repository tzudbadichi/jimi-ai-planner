import { Anchor, Process, Message } from "@prisma/client"

export function buildRouterPrompt(
  todayIso: string,
  todayHebrew: string,
  tomorrowIso: string,
  tomorrowHebrew: string,
  anchors: Anchor[],
  processes: Process[],
  recentMessagesChronological: Pick<Message, "role" | "content">[],
  content: string
): string {
  const contextStr = `
    Existing Anchors: ${anchors.map(a => `[ID: ${a.id}] ${a.title} (${a.startTime}-${a.endTime})`).join(" | ") || "None"}
    Existing Processes: ${processes.map(p => `[ID: ${p.id}] [TYPE: ${p.type}] ${p.title}`).join(" | ") || "None"}
    Recent Messages:
    ${recentMessagesChronological.map((m) => `- ${m.role}: ${m.content}`).join("\n") || "None"}
  `

  return `
    System: You are "Jimi", an advanced AI Life OS.
    
    CONTEXT:
    - Current Date (ISO): ${todayIso}
    - Current Date (he-IL): ${todayHebrew}
    - Tomorrow Date (ISO): ${tomorrowIso}
    - Tomorrow Date (he-IL): ${tomorrowHebrew}
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
          "type": "CREATE_ANCHOR" | "CREATE_PROCESS" | "ADD_LIST_ITEMS" | "ADD_LOG" | "DELETE_ANCHOR" | "DELETE_PROCESS" | "GENERATE_SCHEDULE" | "GENERATE_WEEKLY_SCHEDULE" | "CLEAR_ALL",
          "data": { 
             // For CREATE_ANCHOR: "title", "startTime", "endTime", "day"
             // For CREATE_PROCESS: "title", "goal", "blockType" where blockType is "PROCESS" | "LIST"
             // For ADD_LIST_ITEMS: "listTitle" (optional if only one list exists), "items" (array of strings)
             // For ADD_LOG: "processTitle", "content"
             // For DELETE_ANCHOR / DELETE_PROCESS: "id" (MUST be the exact ID from the context)
             // For GENERATE_SCHEDULE: {"forceRegenerate": true}
             // For GENERATE_WEEKLY_SCHEDULE: {}
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
    6. If user asks to create/generate today's schedule, include a GENERATE_SCHEDULE action.
    7. If user asks to create a weekly schedule ("לוז שבועי", "שבוע"), include GENERATE_WEEKLY_SCHEDULE.
    8. If user says "today/tomorrow", resolve dates using the ISO dates in CONTEXT.
  `
}

export function buildDailySchedulePrompt(
  todayStr: string,
  anchors: Anchor[],
  goalBlocks: Process[],
  listBlocks: Process[]
): string {
  return `
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
    4. Output only the schedule itself in Hebrew (no intro, no summary, no closing sentence).
    5. Use one of these formats only:
       - Markdown table with columns: שעה | משימה
       - Timeline lines in this exact format: **HH:MM - HH:MM**: משימה
  `
}

export function buildWeeklySchedulePrompt(
  weekStartStr: string,
  weekEndStr: string,
  days: { dayName: string; iso: string; hebrew: string }[],
  anchors: Anchor[],
  goalBlocks: Process[],
  listBlocks: Process[]
): string {
  return `
    System: You are "Jimi", an AI Life OS.
    Your task is to build a recommended weekly schedule for the week ${weekStartStr} - ${weekEndStr}.

    WEEK DAYS:
    ${days.map((d) => `- ${d.dayName} (${d.hebrew}, ${d.iso})`).join("\n")}

    CONSTRAINTS (Fixed Anchors):
    ${anchors.map(a => `- ${a.title}: ${a.startTime} to ${a.endTime} (${a.day})`).join('\n') || 'None'}

    GOAL BLOCKS TO FIT IN:
    ${goalBlocks.map(p => `- ${p.title} (Goal: ${p.goal || 'None'})`).join('\n') || 'None'}

    LIST BLOCKS (errands/tasks):
    ${listBlocks.map(p => `- ${p.title} (Items: ${p.goal || 'None'})`).join('\n') || 'None'}

    INSTRUCTIONS:
    1. Create a practical weekly plan with 2-5 main tasks per day.
    2. Strictly respect the fixed Anchor times for each relevant day.
    3. Fit Goal Blocks and List Blocks in free time blocks.
    4. Output only the schedule itself in Hebrew (no intro, no summary).
    5. Use this format only: Markdown table with columns: יום | שעה | משימה
  `
}
