import { Card, CardContent } from "../components/ui/card"
import { cn } from "../lib/utils"
import { CheckCircle2, AlertTriangle, XCircle, Timer, Rows, FileText } from 'lucide-react'

type Props = {
  originalFileName: string
  originalFileSizeBytes: number
  generatedFileName: string
  generatedFileSizeBytes: number
  transactionsProcessed: number
  processingTimeMs: number
  successRate: number
  warnings: number
  errors: number
  className?: string
}

export default function ProcessingSummary({
  originalFileName,
  originalFileSizeBytes,
  generatedFileName,
  generatedFileSizeBytes,
  transactionsProcessed,
  processingTimeMs,
  successRate,
  warnings,
  errors,
  className,
}: Props) {
  const items = [
    { label: "Original file", value: originalFileName, sub: humanBytes(originalFileSizeBytes), icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
    { label: "Generated file", value: generatedFileName, sub: humanBytes(generatedFileSizeBytes), icon: <FileText className="h-4 w-4 text-emerald-600" aria-hidden="true" /> },
    { label: "Transactions", value: transactionsProcessed.toLocaleString(), icon: <Rows className="h-4 w-4" aria-hidden="true" /> },
    { label: "Time", value: `${Math.max(1, Math.round(processingTimeMs / 1000))}s`, icon: <Timer className="h-4 w-4" aria-hidden="true" /> },
    { label: "Success rate", value: `${successRate}%`, icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> },
    { label: "Warnings / Errors", value: `${warnings} / ${errors}`, icon: <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />, extraIcon: errors > 0 ? <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" /> : null },
  ] as const

  return (
    <Card className={cn("border-slate-200 shadow-sm dark:border-slate-800", className)}>
      <CardContent className="grid gap-3 p-3 sm:grid-cols-3">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-3 rounded-md bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            {it.icon}
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{it.label}</div>
              <div className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">{it.value}</div>
              {"sub" in it && it.sub && <div className="text-xs text-slate-500 dark:text-slate-400">{(it as any).sub}</div>}
            </div>
            {("extraIcon" in it && (it as any).extraIcon) ? (it as any).extraIcon : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function humanBytes(n: number) {
  if (n === 0) return "0 B"
  const k = 1024
  const i = Math.floor(Math.log(n) / Math.log(k))
  const sizes = ["B","KB","MB","GB","TB"]
  return `${parseFloat((n / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
