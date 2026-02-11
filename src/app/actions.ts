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
    console.log("--- 1. NEW MESSAGE RECEIVED:", content); 

    // A. Save User Message to DB
    await db.message.create({
      data: { role: 'user', content }
    })

    // B. Fetch Context (Existing Lists)
    // We fetch existing list titles to help the AI categorize items correctly
    const existingLists = await db.list.findMany({ select: { title: true } });
    const listNames = existingLists.map(l => l.title).join(", ");

    // C. Construct the Classification Prompt
    // We instruct the AI to act as a router and return strict JSON
    const routerPrompt = `
      You are an intelligent OS named "Jimi". 
      Your goal is to classify the user's intent and execute actions on their life database.
      
      Current Date: ${new Date().toLocaleDateString('he-IL')}
      Existing Lists: ${listNames || "None"}

      User Input: "${content}"

      Analyze the input and return a JSON object with this EXACT structure:
      {
        "action": "CREATE_GOAL" | "CREATE_ANCHOR" | "ADD_TO_LIST" | "CHAT",
        "data": { ...specific fields... },
        "responseToUser": "A friendly Hebrew response confirming the action or answering the question"
      }

      DETAILS FOR ACTIONS:
      1. If "CREATE_GOAL" (Long term targets):
         data: { "title": "..." }
      
      2. If "CREATE_ANCHOR" (Fixed constraints like work/kids):
         data: { "title": "...", "day": "Sunday/Monday/...", "startTime": "HH:MM", "endTime": "HH:MM" }
      
      3. If "ADD_TO_LIST" (Shopping, Tasks, Ideas):
         data: { "listName": "Groceries/Tasks/...", "item": "..." }
         * If the list doesn't exist, use a logical name.
      
      4. If "CHAT" (General conversation, questions, advice):
         data: {}
      
      IMPORTANT: 
      - The "responseToUser" must be in Hebrew.
      - Be witty and concise in the response.
      - Return ONLY the raw JSON. No markdown formatting.
    `

    // D. Call AI
    const aiRawText = await generateText(routerPrompt)
    console.log("--- 2. AI RAW RESPONSE:", aiRawText); 

    // E. JSON Parsing & Cleaning
    // Sometimes AI wraps JSON in markdown blocks. We extract the JSON string manually.
    const firstBrace = aiRawText.indexOf('{');
    const lastBrace = aiRawText.lastIndexOf('}');
    
    let parsedResult;
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonOnly = aiRawText.substring(firstBrace, lastBrace + 1);
      try {
        parsedResult = JSON.parse(jsonOnly);
        console.log("--- 3. PARSED ACTION:", parsedResult.action); 
      } catch (e) {
        console.error("JSON PARSE FAILED on:", jsonOnly);
      }
    }

    // Fallback: If parsing failed, treat as a normal chat message
    if (!parsedResult) {
      parsedResult = { action: "CHAT", responseToUser: aiRawText, data: {} };
    }

    // F. Execute Database Actions based on AI decision
    switch (parsedResult.action) {
      case "CREATE_GOAL":
        console.log("Executing CREATE_GOAL");
        await db.goal.create({
          data: { title: parsedResult.data.title }
        });
        break;

      case "CREATE_ANCHOR":
        console.log("Executing CREATE_ANCHOR");
        await db.anchor.create({
          data: {
            title: parsedResult.data.title,
            // Default values if AI misses them
            day: parsedResult.data.day || "General",
            startTime: parsedResult.data.startTime || "00:00",
            endTime: parsedResult.data.endTime || "00:00"
          }
        });
        break;

      case "ADD_TO_LIST":
        console.log("Executing ADD_TO_LIST");
        const listName = parsedResult.data.listName || "General";
        
        // Find or Create the List
        let list = await db.list.findUnique({ where: { title: listName } });
        if (!list) {
          list = await db.list.create({ data: { title: listName } });
        }
        
        // Add the item
        await db.listItem.create({
          data: {
            content: parsedResult.data.item,
            listId: list.id
          }
        });
        break;

      case "CHAT":
      default:
        // No DB action, just conversation
        break;
    }

    // G. Save AI Response to DB
    await db.message.create({
      data: {
        role: 'assistant',
        content: parsedResult.responseToUser
      }
    })

    // Refresh the dashboard to show new data
    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error("Smart Brain Error:", error)
    return { error: 'Failed to process message' }
  }
}