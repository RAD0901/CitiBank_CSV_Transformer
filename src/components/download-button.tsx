"use client"

import { Button } from "../components/ui/button"
import { Download, RotateCcw, Check } from 'lucide-react'
import { cn } from "../lib/utils"

type Props = {
  status?: "idle" | "downloading" | "success" | "error"
  progress?: number
  onRetry?: () => void
  onClick?: () => void
  label?: string
}

export default function DownloadButton({
  status = "idle",
  progress = 0,
  onRetry = () => {},
  onClick = () => {},
  label = "Download",
}: Props) {
  const isLoading = status === "downloading"
  const isError = status === "error"
  const isSuccess = status === "success"

  return (
    <Button
      type="button"
      onClick={isError ? onRetry : onClick}
      disabled={isLoading}
      className={cn(
        "relative overflow-hidden gap-2",
        isSuccess
          ? "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600"
          : "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600"
      )}
      aria-live="polite"
    >
      <span className="pointer-events-none absolute inset-0 -z-10">
        {isLoading && (
          <span
            className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-150 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            aria-hidden="true"
          />
        )}
      </span>
      {isError ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : isSuccess ? <Check className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
      {isError ? "Retry download" : isSuccess ? label : isLoading ? `Downloading… ${progress}%` : label}
    </Button>
  )
}
