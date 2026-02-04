'use server'

import { db } from "@/lib/db";
import { generateText } from "@/lib/gemini"; 
import { redirect } from "next/navigation";

export async function submitOnboarding(formData: FormData) {
  const bio = formData.get("bio") as string;

  // 1. הנחיה ל-AI להפריד בין לו"ז למטרות
  const prompt = `
    Analyze the following user bio:
    "${bio}"

    Create a list of "Tracks" to organize their life.
    For each track, strictly separate:
    1. "routine": Fixed time anchors and constraints (e.g., "Pickup kids at 15:30", "Weekly meeting").
    2. "goals": Aspirations and targets (e.g., "Lose 5kg", "Write 1 blog post").

    Return ONLY a valid JSON array (no markdown) of objects with this structure:
    [
      {
        "title": "Track Name",
        "type": "Category (e.g., FAMILY, WORK, HEALTH)",
        "description": "Short summary",
        "routine": ["08:00 Work starts"],
        "goals": ["Finish project X"]
      }
    ]
  `;

  const aiResponse = await generateText(prompt);
  
  // 2. ניקוי התשובה והמרה ל-JSON
  const cleanJson = aiResponse.replace(/```json|```/g, '').trim();
  const tracksData = JSON.parse(cleanJson);

  // 3. שמירה לדאטה-בייס החדש
  for (const track of tracksData) {
    await db.track.create({
      data: {
        title: track.title,
        type: track.type,
        description: track.description,
        goals: JSON.stringify(track.goals || []),    
        routine: JSON.stringify(track.routine || []) 
      },
    });
  }

  redirect("/dashboard");
}