export type Template<T> = { name: string; settings: T }

export function saveTemplate<T>(name: string, settings: T) {
  if (typeof window === "undefined") return
  const key = "enterprise:templates"
  const raw = localStorage.getItem(key)
  const list: Template<T>[] = raw ? JSON.parse(raw) : []
  const idx = list.findIndex((t) => t.name === name)
  if (idx >= 0) list[idx] = { name, settings }
  else list.push({ name, settings })
  localStorage.setItem(key, JSON.stringify(list))
}

export function loadTemplates<T = any>(): Template<T>[] {
  if (typeof window === "undefined") return []
  const key = "enterprise:templates"
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as Template<T>[]) : []
}

export type HistoryEntry = {
  id: string
  createdAt: number
  files: {
    name: string
    size: number
    status: "completed" | "error" | "cancelled"
    warnings: number
    errors: number
    resultFileName?: string
    resultSize?: number
  }[]
  settings: any
}

export function saveHistoryEntry(entry: HistoryEntry) {
  if (typeof window === "undefined") return
  const key = "enterprise:history"
  const raw = localStorage.getItem(key)
  const list: HistoryEntry[] = raw ? JSON.parse(raw) : []
  list.unshift(entry)
  // keep last 25
  const trimmed = list.slice(0, 25)
  localStorage.setItem(key, JSON.stringify(trimmed))
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  const key = "enterprise:history"
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
}

export function clearHistory() {
  if (typeof window === "undefined") return
  localStorage.removeItem("enterprise:history")
}
