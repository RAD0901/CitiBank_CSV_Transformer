import { cn } from "@/lib/utils"

type Props = {
  status: "processing" | "completed" | "error" | "cancelled"
  message: string
  active?: boolean
  stepLabel?: string
  className?: string
}

export default function StatusMessage({ status, message, active = false, stepLabel, className }: Props) {
  const color =
    status === "completed"
      ? "text-emerald-700 dark:text-emerald-300"
      : status === "error"
      ? "text-red-700 dark:text-red-300"
      : status === "cancelled"
      ? "text-slate-700 dark:text-slate-300"
      : "text-slate-700 dark:text-slate-200"

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
        className
      )}
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "processing" ? "polite" : "assertive"}
    >
      {active && (
        <span
          className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"
          aria-hidden="true"
        />
      )}
      <span className={cn("font-medium", color)}>
        {stepLabel ? `${stepLabel}: ` : ""}
      </span>
      <span className={cn("text-slate-700 dark:text-slate-300")}>{message}</span>
    </div>
  )
}
