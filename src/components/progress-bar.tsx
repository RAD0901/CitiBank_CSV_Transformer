import { cn } from "../lib/utils"

type Props = {
  value?: number // 0-100
  colorClass?: string // e.g., "bg-emerald-500"
  animated?: boolean
  active?: boolean
  className?: string
}

export default function ProgressBar({
  value = 0,
  colorClass = "bg-emerald-500", // #10b981
  animated = true,
  active = true,
  className,
}: Props) {
  const width = `${Math.max(0, Math.min(100, value))}%`
  return (
    <div
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800",
        className
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-200 ease-out",
          colorClass
        )}
        style={{ width }}
      />
      {animated && active && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute left-0 top-0 h-full w-24 translate-x-[-100%] animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
        </div>
      )}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  )
}
