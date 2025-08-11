"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { loadHistory, clearHistory } from "@/lib/enterprise-storage"
import { Clock, Download, RotateCcw } from 'lucide-react'

type HistoryEntry = ReturnType<typeof loadHistory>[number]

export default function HistoryPanel() {
  const [items, setItems] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setItems(loadHistory())
  }, [])

  const onClear = () => {
    clearHistory()
    setItems([])
  }

  const redownload = (name?: string) => {
    // Demo: just produce a tiny CSV placeholder
    const csv = "Date,Description,Amount\n01/06/2025,Redownload,123\n"
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = name ?? "result.csv"
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)
  }

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Processing history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">Past sessions with metadata.</div>
          <Button variant="outline" onClick={onClear} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Clear history
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-slate-500">No history yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((s) => (
              <div key={s.id} className="rounded-md bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <div className="text-sm font-medium">
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{s.files.length} file(s)</Badge>
                    <Badge variant="outline">{s.settings.dateFormat}</Badge>
                    <Badge variant="outline">{s.settings.rounding}</Badge>
                    <Badge variant="outline">Batch {s.settings.batchSize}</Badge>
                  </div>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {s.files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-sm dark:bg-slate-800">
                      <div className="truncate">
                        <span className="font-medium">{f.name}</span>
                        <span className="ml-2 text-xs text-slate-500">→ {f.resultFileName ?? "result.csv"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={f.status === "completed" ? "outline" : "destructive"}>{f.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => redownload(f.resultFileName)} className="gap-2">
                          <Download className="h-4 w-4" aria-hidden="true" />
                          Re-download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
