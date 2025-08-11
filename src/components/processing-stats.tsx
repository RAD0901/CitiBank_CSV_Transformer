import { cn } from "../lib/utils"

type Props = {
  processed: number
  total: number
  errors: number
  loading?: boolean
  className?: string
}

export default function ProcessingStats({ processed, total, errors, loading = false, className }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
        className
      )}
      aria-live="polite"
    >
      <Stat label="Rows processed" value={loading ? null : processed.toLocaleString()} />
      <Stat label="Total rows" value={loading ? null : total.toLocaleString()} />
      <Stat label="Errors found" value={loading ? null : errors.toLocaleString()} accent={errors > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"} />
      <div className="col-span-3">
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
          <div className="h-1.5 rounded-full bg-blue-600 transition-[width] duration-200 ease-out dark:bg-blue-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-right text-[10px] text-slate-500 dark:text-slate-400">{pct}%</div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | null; accent?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
      {value === null ? (
        <div className="mt-1 h-5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      ) : (
        <span className={cn("mt-1 text-base font-semibold tabular-nums text-slate-800 dark:text-slate-100", accent)}>
          {value}
        </span>
      )}
    </div>
  )
}
