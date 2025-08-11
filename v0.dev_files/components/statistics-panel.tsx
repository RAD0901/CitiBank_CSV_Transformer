import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Timer, Rows, CheckCircle2, AlertTriangle, XCircle, File } from 'lucide-react'

type Props = {
  totalRows: number
  successRows: number
  warningRows: number
  errorRows: number
  processingTimeMs: number
  sizeDeltaBytes: number
  className?: string
}

export default function StatisticsPanel({
  totalRows,
  successRows,
  warningRows,
  errorRows,
  processingTimeMs,
  sizeDeltaBytes,
  className,
}: Props) {
  const humanTime = `${Math.max(1, Math.round(processingTimeMs / 1000))}s`
  const sizeLabel = humanBytes(Math.abs(sizeDeltaBytes))
  const sizeSign = sizeDeltaBytes === 0 ? "" : sizeDeltaBytes > 0 ? "+" : "−"

  const items: { label: string; value: string; icon: React.ReactNode; accent?: string }[] = [
    { label: "Total rows", value: totalRows.toLocaleString(), icon: <Rows className="h-4 w-4" aria-hidden="true" /> },
    { label: "Transformed", value: successRows.toLocaleString(), icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> },
    { label: "Warnings", value: warningRows.toLocaleString(), icon: <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" /> },
    { label: "Errors", value: errorRows.toLocaleString(), icon: <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" /> },
    { label: "Time", value: humanTime, icon: <Timer className="h-4 w-4" aria-hidden="true" /> },
    { label: "Size delta", value: `${sizeSign}${sizeLabel}`, icon: <File className="h-4 w-4" aria-hidden="true" /> },
  ]

  return (
    <Card className={cn("border-slate-200 shadow-sm dark:border-slate-800", className)}>
      <CardContent className="grid gap-3 p-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-md bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
          >
            {it.icon}
            <div className="flex min-w-0 flex-col">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{it.label}</span>
              <span className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">{it.value}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function humanBytes(n: number) {
  const k = 1024
  const sizes = ["B","KB","MB","GB"]
  if (n === 0) return "0 B"
  const i = Math.floor(Math.log(n) / Math.log(k))
  const val = parseFloat((n / Math.pow(k, i)).toFixed(1))
  return `${val} ${sizes[i]}`
}
