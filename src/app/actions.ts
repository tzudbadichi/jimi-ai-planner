'use server'

import { generateText } from "@/lib/gemini"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getSystemPrompt, PersonaType } from "@/lib/personas"
import { redirect } from "next/navigation" // <--- 1. NEW IMPORT

// --- 1. Onboarding: Generate Life Tracks ---
export async function submitOnboarding(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries())
  
  const prompt = `
    User Info:
    Name: ${rawData.name}
    Age: ${rawData.age}
    Occupation: ${rawData.occupation}
    Family Status: ${rawData.family}
    
    Task: Identify 4-6 core "Life Tracks".
    Return ONLY a JSON array with this exact structure: 
    [{ "name": "Name in Hebrew", "type": "ANCHOR/GROWTH", "goals": ["Goal 1", "Goal 2"] }]
  `

  try {
    const text = await generateText(prompt)
    const cleanText = text.replace(/```json|```/g, '').trim()
    const tracks = JSON.parse(cleanText)

    await db.track.deleteMany()
    
    for (const track of tracks) {
      await db.track.create({
        data: {
          name: track.name || track.title, 
          type: track.type,
          goals: JSON.stringify(track.goals)
        }
      })
    }
  } catch (error) {
    console.error("Onboarding Error:", error)
    return { error: 'Failed to generate tracks' }
  }

  // --- 2. Redirect Loop Fix ---
  // We call redirect OUTSIDE the try/catch block because redirect() throws a specific error
  // that Next.js uses to handle the navigation.
  redirect('/dashboard') 
}

// --- 2. Retrieve Chat History ---
export async function getChatHistory(trackId?: string) {
  return await db.message.findMany({
    where: {
      trackId: trackId || null
    },
    orderBy: { createdAt: 'asc' }
  })
}

// --- 3. Send Message & Get AI Response ---
export async function submitMessage(content: string, trackId?: string) {
  try {
    await db.message.create({
      data: { role: 'user', content, trackId: trackId || null }
    })

    const userSettings = {
      personaType: 'cool' as PersonaType, 
      customPrompt: ''
    };

    let systemPrompt = getSystemPrompt(userSettings.personaType, userSettings.customPrompt);

    if (trackId) {
      const track = await db.track.findUnique({ where: { id: trackId } })
      if (track) {
        systemPrompt += `
          \n--- Context: Specific Track ---
          We are currently discussing the life track: "${track.name}".
          The goals for this track are: ${track.goals}.
          Focus strictly on this topic.
        `
      }
    } else {
      systemPrompt += `\n--- Context: Main Chat ---\nWe are in the general lobby (Global Chat).`
    }

    const recentHistory = await db.message.findMany({
      where: { trackId: trackId || null },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    const historyText = recentHistory.reverse().map(m => `${m.role}: ${m.content}`).join('\n')
    const fullPrompt = `${systemPrompt}\n\nHISTORY:\n${historyText}\n\nUser: ${content}\nAssistant:`

    const aiResponseText = await generateText(fullPrompt)

    await db.message.create({
      data: { role: 'assistant', content: aiResponseText, trackId: trackId || null }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error("Chat Error:", error)
    return { error: 'Failed to send message' }
  }
}