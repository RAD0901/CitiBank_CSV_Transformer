import { cn } from "../lib/utils"
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

type Props = {
  status?: "success" | "warning" | "error"
  className?: string
}

export default function ValidationBadge({ status = "success", className }: Props) {
  const map = {
    success: {
      text: "All data transformed successfully",
      bg: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900",
      Icon: CheckCircle2,
    },
    warning: {
      text: "Some warnings detected",
      bg: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-900",
      Icon: AlertTriangle,
    },
    error: {
      text: "Critical errors found",
      bg: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-900",
      Icon: XCircle,
    },
  } as const
  const conf = map[status]
  const Icon = conf.Icon
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ring-1 ring-inset", conf.bg, className)} role="status" aria-live="polite">
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="font-medium">{conf.text}</span>
    </div>
  )
}
