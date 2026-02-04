import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateText(prompt: string): Promise<string> {
  const apiKey = (process.env.GOOGLE_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // השינוי: שימוש במודל שמופיע ברשימה שלך
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Gemini Error:", error.message || error);
    throw error;
  }
}