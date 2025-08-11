import { cn } from "@/lib/utils"

type ProgressIndicatorProps = {
  current?: number
  total?: number
  className?: string
}

export default function ProgressIndicator({
  current = 1,
  total = 4,
  className,
}: ProgressIndicatorProps) {
  const percent = Math.min(100, Math.max(0, Math.round((current / total) * 100)))
  return (
    <div
      className={cn("w-40", className)}
      aria-label="Progress"
      role="group"
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">{`Step ${current} of ${total}`}</span>
        <span className="text-[10px] text-slate-500">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200" aria-hidden="true">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
