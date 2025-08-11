"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertCircle, List, XCircle, Wand2, Download } from 'lucide-react'

export type ErrorItem = {
  fileId: string
  fileName: string
  line: number
  category: "format" | "validation" | "transformation"
  message: string
  suggestion?: string
}

export default function ErrorDashboard({
  items = [],
  compact = false,
}: {
  items?: ErrorItem[]
  compact?: boolean
}) {
  const grouped = useMemo(() => {
    const g: Record<ErrorItem["category"], ErrorItem[]> = {
      format: [],
      validation: [],
      transformation: [],
    }
    items.forEach((i) => g[i.category].push(i))
    return g
  }, [items])

  const total = items.length

  const exportCsv = () => {
    const headers = ["File","Line","Category","Message","Suggestion"]
    const body = items.map(i => [i.fileName, i.line, i.category, `"${i.message.replace(/"/g,'""')}"`, `"${(i.suggestion ?? "").replace(/"/g,'""')}"`].join(","))
    const csv = [headers.join(","), ...body].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "error-report.csv"
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
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
            Error dashboard
          </div>
          <Badge variant={total ? "destructive" : "secondary"}>{total} errors</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn("grid gap-3 sm:grid-cols-3", compact && "sm:grid-cols-2")}>
          <CountCard label="Format" count={grouped.format.length} icon={<List className="h-4 w-4" aria-hidden="true" />} />
          <CountCard label="Validation" count={grouped.validation.length} icon={<XCircle className="h-4 w-4" aria-hidden="true" />} />
          <CountCard label="Transformation" count={grouped.transformation.length} icon={<Wand2 className="h-4 w-4" aria-hidden="true" />} />
        </div>

        {total === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">No errors reported.</div>
        ) : (
          <div className="max-h-64 overflow-auto rounded-md ring-1 ring-slate-200 dark:ring-slate-800">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left">File</th>
                  <th className="px-3 py-2 text-left">Line</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Message</th>
                  <th className="px-3 py-2 text-left">Suggestion</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900">
                {items.map((i, idx) => (
                  <tr key={idx} className={cn("border-b border-slate-100 last:border-0 dark:border-slate-800", idx % 2 === 1 ? "bg-slate-50 dark:bg-slate-950" : "")}>
                    <td className="px-3 py-2">{i.fileName}</td>
                    <td className="px-3 py-2 tabular-nums">{i.line}</td>
                    <td className="px-3 py-2 capitalize">{i.category}</td>
                    <td className="px-3 py-2">{i.message}</td>
                    <td className="px-3 py-2">{i.suggestion ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export error report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CountCard({ label, count, icon }: { label: string; count: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <span className="text-base font-semibold tabular-nums">{count}</span>
    </div>
  )
}
