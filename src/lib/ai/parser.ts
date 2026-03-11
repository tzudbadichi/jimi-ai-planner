export type BlockType = "PROCESS" | "LIST"

export type RouterActionType =
  | "CREATE_ANCHOR"
  | "CREATE_PROCESS"
  | "ADD_LIST_ITEMS"
  | "ADD_LOG"
  | "DELETE_ANCHOR"
  | "DELETE_PROCESS"
  | "GENERATE_SCHEDULE"
  | "GENERATE_WEEKLY_SCHEDULE"
  | "CLEAR_ALL"

export type RouterActionData = {
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

export type RouterAction = {
  type: RouterActionType
  data?: RouterActionData
}

export type RouterResult = {
  actions: RouterAction[]
  responseToUser: string
}

export type InferredProcess = {
  title: string
  goal: string | null
  blockType: BlockType
}

export type InferredList = {
  title: string
  items: string[]
}

export type ChecklistItem = {
  text: string
  checked: boolean
}

export function cleanGeneratedSchedule(raw: string): string {
  const normalized = raw.replace(/```(?:markdown|md)?/gi, '').replace(/```/g, '').trim()
  if (!normalized) return raw

  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean)

  const timelinePatterns = [
    /^\*\*(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\*\*\s*[:\-]\s*(.+)$/u,
    /^\*\*(\d{1,2}:\d{2})\*\*\s*[:\-]\s*(.+)$/u,
    /^[-*]\s*(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\s*[:\-]\s*(.+)$/u,
    /^[-*]\s*(\d{1,2}:\d{2})\s*[:\-]\s*(.+)$/u,
    /^(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\s*[:\-]\s*(.+)$/u,
    /^(\d{1,2}:\d{2})\s*[:\-]\s*(.+)$/u,
  ]

  const timelineLines = lines.filter((line) => timelinePatterns.some((pattern) => pattern.test(line)))
  if (timelineLines.length >= 3) {
    return timelineLines.join('\n')
  }

  const firstTableHeaderIndex = lines.findIndex((line) => line.includes('|'))
  if (firstTableHeaderIndex !== -1 && firstTableHeaderIndex + 1 < lines.length) {
    const separator = lines[firstTableHeaderIndex + 1]
    if (/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/u.test(separator)) {
      const tableLines = [lines[firstTableHeaderIndex], separator]
      for (let i = firstTableHeaderIndex + 2; i < lines.length; i++) {
        if (!lines[i].includes('|')) break
        tableLines.push(lines[i])
      }
      if (tableLines.length >= 3) return tableLines.join('\n')
    }
  }

  const firstTimeLineIndex = lines.findIndex((line) => /\d{1,2}:\d{2}/.test(line))
  if (firstTimeLineIndex > 0) {
    const cropped = lines.slice(firstTimeLineIndex).join('\n').trim()
    if (cropped) return cropped
  }

  return normalized
}

export function parseChecklist(goal: string | null): ChecklistItem[] {
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

export function serializeChecklist(items: ChecklistItem[]): string {
  return items.map((item) => `[${item.checked ? 'x' : ' '}] ${item.text}`).join('\n')
}

export function splitItemsFromText(text: string): string[] {
  return text
    .split(/\n|,|,|;|;/)
    .map((item) => item.trim().replace(/^[-*�]\s*/, ""))
    .filter(Boolean)
}

export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function normalizeCreatedProcessData(
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

export function inferProcessCreationFromInput(content: string): InferredProcess | null {
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

export function inferListCreationFromInput(content: string): InferredList | null {
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

export function parseRouterResult(raw: string): RouterResult | null {
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

