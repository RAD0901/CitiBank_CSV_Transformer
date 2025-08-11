import { cn } from "../lib/utils"
import { CheckCircle2, FileText, Search, Wand2, Download } from 'lucide-react'

type Step = {
  key: string
  title: string
  description?: string
  icon?: "file" | "search" | "wand" | "download"
}

type Props = {
  steps: Step[]
  currentIndex?: number
  status?: "processing" | "completed" | "error" | "cancelled"
  className?: string
}

export default function StepIndicator({
  steps,
  currentIndex = 0,
  status = "processing",
  className,
}: Props) {
  return (
    <ol className={cn("grid gap-2 sm:grid-cols-4", className)}>
      {steps.map((step, i) => {
        const isActive = i === currentIndex && status === "processing"
        const isDone = i < currentIndex || status === "completed"
        const isUpcoming = i > currentIndex && status !== "completed"
        const color =
          isDone ? "text-emerald-600 dark:text-emerald-400" :
          isActive ? "text-blue-600 dark:text-blue-400" :
          "text-slate-500 dark:text-slate-400"
        const ring =
          isActive ? "ring-2 ring-blue-200 dark:ring-blue-900/40" : "ring-1 ring-slate-200 dark:ring-slate-800"

        return (
          <li
            key={step.key}
            className={cn(
              "flex items-center gap-3 rounded-lg bg-white p-3 dark:bg-slate-900",
              ring
            )}
            aria-current={isActive ? "step" : undefined}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              {isDone ? (
                <CheckCircle2 className={cn("h-5 w-5", color)} aria-hidden="true" />
              ) : (
                <StepIcon name={step.icon} className={cn("h-5 w-5", color, isActive && "animate-pulse")} />
              )}
            </div>
            <div className="min-w-0">
              <div className={cn("truncate text-sm font-medium", color)}>{step.title}</div>
              <div className="truncate text-xs text-slate-500 dark:text-slate-400">{step.description}</div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function StepIcon({ name, className }: { name?: Step["icon"]; className?: string }) {
  switch (name) {
    case "file":
      return <FileText className={className} />
    case "search":
      return <Search className={className} />
    case "wand":
      return <Wand2 className={className} />
    case "download":
      return <Download className={className} />
    default:
      return <FileText className={className} />
  }
}
