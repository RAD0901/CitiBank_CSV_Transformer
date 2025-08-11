import { forwardRef } from "react"
import { Button } from "../components/ui/button"
import { cn } from "../lib/utils"

type ActionButtonProps = {
  disabled?: boolean
  onClick?: () => void
  label?: string
  className?: string
}

const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  { disabled = false, onClick = () => {}, label = "Continue", className },
  ref
) {
  return (
    <Button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={onClick}
      className={cn(
        "bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:bg-blue-300 disabled:text-white",
        className
      )}
    >
      {label}
    </Button>
  )
})

export default ActionButton
