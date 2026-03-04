import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-flash-latest"
] as const;
const MAX_RETRIES_PER_MODEL = 3;
const BASE_BACKOFF_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const maybeStatus = (error as { status?: unknown }).status;
  if (typeof maybeStatus === "number") return maybeStatus;

  const maybeMessage = (error as { message?: unknown }).message;
  if (typeof maybeMessage !== "string") return null;
  const match = maybeMessage.match(/\[(\d{3})\s/);
  return match ? Number(match[1]) : null;
}

function isTransientStatus(status: number | null): boolean {
  return status !== null && [429, 500, 502, 503, 504].includes(status);
}

function getModelFallbacks(): string[] {
  const fromEnv = (process.env.GEMINI_MODELS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return fromEnv.length > 0 ? fromEnv : [...DEFAULT_MODEL_FALLBACKS];
}

export async function generateText(prompt: string): Promise<string> {
  const apiKey = (process.env.GOOGLE_API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelFallbacks = getModelFallbacks();

  let lastError: unknown = null;

  for (const modelName of modelFallbacks) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt += 1) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error: unknown) {
        lastError = error;
        const status = extractStatus(error);
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Gemini Error (model=${modelName}, attempt=${attempt}, status=${status ?? "unknown"}):`, message);

        const isLastAttempt = attempt === MAX_RETRIES_PER_MODEL;
        if (!isTransientStatus(status) || isLastAttempt) {
          break;
        }

        const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
        const jitter = Math.floor(Math.random() * 250);
        await sleep(backoff + jitter);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini request failed");
}
