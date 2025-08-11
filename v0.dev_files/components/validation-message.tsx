import { forwardRef } from "react"
import { cn } from "@/lib/utils"

type ValidationMessageProps = {
  variant?: "success" | "error" | "info"
  title?: string
  message: string
  tips?: string[]
  icon?: React.ReactNode
  ariaLive?: "polite" | "assertive"
  focusable?: boolean
  className?: string
}

const stylesByVariant = {
  success: {
    container: "border-green-200 bg-green-50 text-green-800",
    title: "text-green-900",
  },
  error: {
    container: "border-red-200 bg-red-50 text-red-800",
    title: "text-red-900",
  },
  info: {
    container: "border-blue-200 bg-blue-50 text-blue-800",
    title: "text-blue-900",
  },
}

const ValidationMessage = forwardRef<HTMLDivElement, ValidationMessageProps>(function ValidationMessage(
  {
    variant = "info",
    title,
    message,
    tips,
    icon,
    ariaLive = "polite",
    focusable = false,
    className,
  },
  ref
) {
  const style = stylesByVariant[variant]
  return (
    <div
      ref={ref}
      role={variant === "error" ? "alert" : "status"}
      aria-live={ariaLive}
      tabIndex={focusable ? -1 : undefined}
      className={cn(
        "flex w-full gap-3 rounded-lg border p-3 transition-colors",
        style.container,
        className
      )}
    >
      <div className="mt-[2px]">{icon}</div>
      <div className="min-w-0 text-sm">
        {title && <div className={cn("font-semibold", style.title)}>{title}</div>}
        <div className="break-words">{message}</div>
        {tips && tips.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs opacity-90">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
})

export default ValidationMessage
