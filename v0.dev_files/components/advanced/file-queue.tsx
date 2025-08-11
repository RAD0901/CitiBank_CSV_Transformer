"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { saveHistoryEntry } from "@/lib/enterprise-storage"
import { Upload, Trash2, Play, Pause, XCircle, MoreHorizontal, CheckCircle2, AlertTriangle, FileSpreadsheet, FolderOpen } from 'lucide-react'
import type { AdvancedSettings } from "./settings-panel"

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPT = [".csv"]

type Status = "queued" | "processing" | "completed" | "error" | "cancelled" | "paused"

export type QueueItem = {
  id: string
  file: File
  name: string
  size: number
  status: Status
  progress: number
  startedAt?: number
  finishedAt?: number
  warnings?: number
  errors?: number
  resultFileName?: string
  resultCsv?: string
  errorMessage?: string
}

export type ErrorItem = {
  fileId: string
  fileName: string
  line: number
  category: "format" | "validation" | "transformation"
  message: string
  suggestion?: string
}

function buildFilename(template: string, d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return template
    .replace("{YYYY}", String(d.getFullYear()))
    .replace("{MM}", pad(d.getMonth() + 1))
    .replace("{DD}", pad(d.getDate()))
    .replace("{HH}", pad(d.getHours()))
    .replace("{mm}", pad(d.getMinutes()))
    .replace("{ss}", pad(d.getSeconds()))
}

export default function FileQueue({
  settings,
  onErrorsUpdate,
}: {
  settings: AdvancedSettings
  onErrorsUpdate?: (items: ErrorItem[]) => void
}) {
  const [items, setItems] = useState<QueueItem[]>([])
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const totalQueued = items.length
  const totalProcessing = items.filter((i) => i.status === "processing").length
  const totalCompleted = items.filter((i) => i.status === "completed").length
  const totalErrors = items.reduce((acc, i) => acc + (i.errors ?? 0), 0)
  const totalWarnings = items.reduce((acc, i) => acc + (i.warnings ?? 0), 0)

  const acceptStr = useMemo(() => ACCEPT.join(","), [])

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files)
    const toAdd: QueueItem[] = []
    for (const f of arr) {
      const name = f.name.toLowerCase()
      const okExt = ACCEPT.some((ext) => name.endsWith(ext))
      if (!okExt) continue
      if (f.size > MAX_SIZE) continue
      toAdd.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        name: f.name,
        size: f.size,
        status: "queued",
        progress: 0,
      })
    }
    if (toAdd.length) setItems((prev) => [...prev, ...toAdd])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearQueue = useCallback(() => {
    setItems([])
    onErrorsUpdate?.([])
  }, [onErrorsUpdate])

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  const [errors, setErrors] = useState<ErrorItem[]>([])
  const updateErrors = useCallback(
    (list: ErrorItem[]) => {
      setErrors(list)
      onErrorsUpdate?.(list)
    },
    [onErrorsUpdate]
  )

  // Processing simulation with batch size
  const processAll = useCallback(async () => {
    if (!items.length) return
    setBusy(true)
    updateErrors([])
    setItems((prev) =>
      prev.map((i) => (i.status === "queued" || i.status === "paused" ? { ...i, status: "queued", progress: 0 } : i))
    )

    const concurrency = Math.max(1, settings.batchSize)
    const queue = [...items.filter((i) => i.status !== "completed")]
    const running: Promise<void>[] = []

    const runNext = () => {
      const next = queue.shift()
      if (!next) return
      running.push(processItem(next))
      if (running.length < concurrency) runNext()
    }

    for (let i = 0; i < concurrency; i++) runNext()
    await Promise.all(running)
    setBusy(false)

    // Save a history session snapshot
    const completed = items.filter((i) => i.status === "completed" || i.status === "error")
    if (completed.length) {
      saveHistoryEntry({
        id: `${Date.now()}`,
        createdAt: Date.now(),
        files: completed.map((i) => ({
          name: i.name,
          size: i.size,
          status: i.status,
          warnings: i.warnings ?? 0,
          errors: i.errors ?? 0,
          resultFileName: i.resultFileName,
          resultSize: i.resultCsv ? new Blob([i.resultCsv]).size : 0,
        })),
        settings,
      })
    }
  }, [items, settings, updateErrors])

  const processItem = useCallback(
    (qi: QueueItem) => {
      return new Promise<void>((resolve) => {
        setItems((prev) => prev.map((i) => (i.id === qi.id ? { ...i, status: "processing", startedAt: performance.now() } : i)))

        const start = performance.now()
        const totalMs = 2200 + Math.random() * 2800
        const localErrors: ErrorItem[] = []
        const stepMark = [0.25, 0.5, 0.75, 1]

        const tick = () => {
          setItems((prev) => {
            const cur = prev.find((i) => i.id === qi.id)
            if (!cur || cur.status === "cancelled" || cur.status === "error" || cur.status === "paused") return prev
            const elapsed = performance.now() - start
            const raw = Math.min(1, elapsed / totalMs)
            const p = Math.round((easeInOutCubic(raw)) * 100)
            // randomly register errors in transform phase (~50-75%)
            const inTransform = raw > 0.5 && raw <= 0.75
            let addErr = 0
            if (inTransform && Math.random() < 0.06) {
              const err: ErrorItem = {
                fileId: qi.id,
                fileName: qi.name,
                line: Math.floor(2 + Math.random() * 200),
                category: (["format", "validation", "transformation"] as const)[Math.floor(Math.random() * 3)],
                message: "Detected anomaly in data",
                suggestion: "Check delimiter, date format, or amount precision",
              }
              localErrors.push(err)
              addErr = 1
            }
            const update = prev.map((i) =>
              i.id === qi.id
                ? {
                    ...i,
                    progress: p,
                    warnings: (i.warnings ?? 0) + (Math.random() < 0.05 ? 1 : 0),
                    errors: (i.errors ?? 0) + addErr,
                  }
                : i
            )
            return update
          })

          if (performance.now() - start < totalMs) {
            requestAnimationFrame(tick)
          } else {
            // finalize
            // apply settings to filename and rounding if needed
            const resultFileName = buildFilename(settings.filenameTemplate)
            const resultCsv = `Date,Description,Amount\n01/06/2025,"Sample Row",100\n` // placeholder generated content
            setItems((prev) =>
              prev.map((i) =>
                i.id === qi.id
                  ? {
                      ...i,
                      status: (i.errors ?? 0) > 3 && settings.errorStrategy === "stop" ? "error" : "completed",
                      progress: 100,
                      finishedAt: performance.now(),
                      resultFileName,
                      resultCsv,
                    }
                  : i
              )
            )
            updateErrors((prev) => [...prev, ...localErrors])
            resolve()
          }
        }

        requestAnimationFrame(tick)
      })
    },
    [settings, updateErrors]
  )

  const cancelAll = useCallback(() => {
    setItems((prev) => prev.map((i) => (i.status === "processing" ? { ...i, status: "cancelled" } : i)))
  }, [])

  const pauseAll = useCallback(() => {
    setItems((prev) => prev.map((i) => (i.status === "processing" ? { ...i, status: "paused" } : i)))
  }, [])
  const resumePaused = useCallback(() => {
    setItems((prev) => prev.map((i) => (i.status === "paused" ? { ...i, status: "queued", progress: 0 } : i)))
  }, [])

  const downloadResult = useCallback((qi: QueueItem) => {
    if (!qi.resultCsv || !qi.resultFileName) return
    const blob = new Blob([qi.resultCsv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = qi.resultFileName
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)
  }, [])

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">File queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = "copy"
          }}
          className={cn(
            "group relative flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed p-6 transition",
            "bg-white dark:bg-slate-900",
            "border-slate-300 hover:border-blue-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          )}
          role="button"
          aria-label="Drag and drop multiple CSV files here"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center text-center">
            <Upload className="mb-2 h-6 w-6 text-blue-600" aria-hidden="true" />
            <div className="font-medium">Drag & drop CSV files</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">or click to browse • CSV only, up to 10MB each</div>
            <input
              ref={inputRef}
              type="file"
              accept={acceptStr}
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files
                if (files?.length) addFiles(files)
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button id="process-all-btn" onClick={processAll} disabled={!items.length || busy} className="gap-2 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600">
            <Play className="h-4 w-4" aria-hidden="true" />
            Process All
          </Button>
          <Button variant="outline" onClick={pauseAll} disabled={!totalProcessing} className="gap-2">
            <Pause className="h-4 w-4" aria-hidden="true" />
            Pause
          </Button>
          <Button variant="outline" onClick={resumePaused} disabled={!items.some((i) => i.status === "paused")}>
            Resume Paused
          </Button>
          <Button variant="outline" onClick={cancelAll} disabled={!totalProcessing} className="gap-2 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-300">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Cancel
          </Button>
          <Button variant="ghost" onClick={clearQueue} disabled={!items.length} className="ml-auto gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>

        <div className="rounded-lg ring-1 ring-slate-200 dark:ring-slate-800">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No files in queue.</div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((it) => (
                <div key={it.id} className="grid items-center gap-3 p-3 sm:grid-cols-[1fr_auto]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                      <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{it.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(it.size)}</div>
                      <div className="mt-2">
                        <Progress value={it.progress} className="h-2" />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <StatusBadge status={it.status} />
                        <span className="text-slate-500 dark:text-slate-400">{it.progress}%</span>
                        {it.warnings ? (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                            {it.warnings} warnings
                          </span>
                        ) : null}
                        {typeof it.errors === "number" && it.errors > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            {it.errors} errors
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {it.status === "completed" && it.resultCsv && it.resultFileName && (
                      <Button size="sm" onClick={() => downloadResult(it)} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Download
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="outline" aria-label="More actions">
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setItems((prev) => prev.filter((p) => p.id !== it.id))
                          }}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Remove
                        </DropdownMenuItem>
                        {it.status === "queued" && (
                          <DropdownMenuItem
                            onClick={() => {
                              // Single-file manual start: run with batch size 1
                              const startSingle = async () => {
                                await (async () => {
                                  await new Promise((r) => setTimeout(r, 0))
                                })()
                                const clone = { ...it }
                                setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, status: "queued", progress: 0 } : p)))
                                await (async () => {
                                  await new Promise((r) => setTimeout(r, 0))
                                })()
                                // kick the process of just this item
                                // Use a thin wrapper
                                await new Promise<void>((resolve) => {
                                  const run = async () => {
                                    await new Promise<void>((res) => {
                                      const start = performance.now()
                                      const total = 1800 + Math.random() * 1800
                                      const tick = () => {
                                        setItems((prev) => {
                                          const p = prev.find((x) => x.id === it.id)
                                          if (!p || p.status === "cancelled" || p.status === "error" || p.status === "paused") return prev
                                          const elapsed = performance.now() - start
                                          const raw = Math.min(1, elapsed / total)
                                          const prog = Math.round(easeInOutCubic(raw) * 100)
                                          return prev.map((x) => (x.id === it.id ? { ...x, status: "processing", progress: prog } : x))
                                        })
                                        if (performance.now() - start < total) {
                                          requestAnimationFrame(tick)
                                        } else {
                                          const resultFileName = buildFilename("{YYYY}-{MM}-{DD}_{HH}{mm}{ss}_single.csv")
                                          const resultCsv = `Date,Description,Amount\n01/06/2025,"Single Row",50\n`
                                          setItems((prev) =>
                                            prev.map((x) =>
                                              x.id === it.id ? { ...x, status: "completed", progress: 100, resultFileName, resultCsv } : x
                                            )
                                          )
                                          res()
                                        }
                                      }
                                      requestAnimationFrame(tick)
                                    })
                                    resolve()
                                  }
                                  run()
                                })
                              }
                              startSingle()
                            }}
                            className="gap-2"
                          >
                            <Play className="h-4 w-4" aria-hidden="true" />
                            Start
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3 text-xs ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:grid-cols-4">
          <Info label="Queued" value={String(totalQueued)} />
          <Info label="Processing" value={String(totalProcessing)} />
          <Info label="Completed" value={String(totalCompleted)} />
          <Info label="Warnings/Errors" value={`${totalWarnings}/${totalErrors}`} />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
          Files are validated client-side. CSV only, ≤ 10MB each.
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    queued: { text: "Queued", variant: "secondary" },
    processing: { text: "Processing", variant: "default" },
    completed: { text: "Completed", variant: "outline" },
    error: { text: "Error", variant: "destructive" },
    cancelled: { text: "Cancelled", variant: "destructive" },
    paused: { text: "Paused", variant: "secondary" },
  }
  const conf = map[status]
  return <Badge variant={conf.variant}>{conf.text}</Badge>
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded bg-white px-2 py-1 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
