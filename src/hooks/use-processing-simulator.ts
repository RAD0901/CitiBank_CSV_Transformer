"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type ProcessingStatus = "processing" | "completed" | "error" | "cancelled"

type Stats = {
  totalRows: number
  processedRows: number
  errors: number
}

const STEP_TEXTS = [
  "Parsing CSV file...",
  "Finding transaction data...",
  "Transforming records...",
  "Generating output file...",
]

export function useProcessingSimulator() {
  const [status, setStatus] = useState<ProcessingStatus>("processing")
  const [progress, setProgress] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [statusText, setStatusText] = useState(STEP_TEXTS[0])
  const [estRemainingMs, setEstRemainingMs] = useState(0)
  const [stats, setStats] = useState<Stats>({ totalRows: 0, processedRows: 0, errors: 0 })

  // Runtime refs
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)
  const canceledRef = useRef(false)
  const erroredRef = useRef(false)
  const totalDurationRef = useRef<number>(0)
  const stepBoundariesRef = useRef<number[]>([])

  const reset = useCallback(() => {
    setStatus("processing")
    setProgress(0)
    setStepIndex(0)
    setStatusText(STEP_TEXTS[0])
    setStats({ totalRows: 0, processedRows: 0, errors: 0 })
    canceledRef.current = false
    erroredRef.current = false
  }, [])

  const retry = useCallback(() => {
    reset()
    start()
  }, [reset])

  const cancel = useCallback(() => {
    canceledRef.current = true
    setStatus("cancelled")
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const stepLabel = useMemo(() => ["Parse", "Find", "Transform", "Generate"][stepIndex] ?? "Parse", [stepIndex])

  const start = useCallback(() => {
    // Randomize total rows and total duration for realism
    const totalRows = Math.floor(800 + Math.random() * 3200) // 800 - 4000
    setStats({ totalRows, processedRows: 0, errors: 0 })

    const totalMs = Math.floor(2200 + Math.random() * 2800) // 2200 - 5000 ms
    totalDurationRef.current = totalMs

    // Even step boundaries: 25%, 50%, 75%, 100% of time
    const b0 = totalMs * 0.25
    const b1 = totalMs * 0.50
    const b2 = totalMs * 0.75
    const b3 = totalMs
    stepBoundariesRef.current = [b0, b1, b2, b3]

    startRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const remaining = Math.max(0, totalMs - elapsed)
      setEstRemainingMs(remaining)

      // Determine step by elapsed time
      let idx = 0
      if (elapsed <= stepBoundariesRef.current[0]) idx = 0
      else if (elapsed <= stepBoundariesRef.current[1]) idx = 1
      else if (elapsed <= stepBoundariesRef.current[2]) idx = 2
      else idx = 3
      if (idx !== stepIndex) setStepIndex(idx)

      // Update status text when entering a new step
      setStatusText(STEP_TEXTS[idx])

      // Progress with easing for smoothness
      const rawProgress = Math.min(1, Math.max(0, elapsed / totalMs))
      const eased = easeInOutCubic(rawProgress)
      const pct = Math.min(100, Math.round(eased * 1000) / 10) // one decimal
      setProgress(pct)

      // Update processed rows proportional to progress; errors emerge in transform step
      setStats((prev) => {
        const processed = Math.min(prev.totalRows, Math.floor(prev.totalRows * rawProgress))
        const addError =
          idx === 2 && // during Transform
          Math.random() < 0.02 // small chance per frame
        return {
          totalRows: prev.totalRows,
          processedRows: processed,
          errors: Math.min(processed, prev.errors + (addError ? 1 : 0)),
        }
      })

      if (canceledRef.current || erroredRef.current) {
        // stopped
        return
      }

      if (elapsed >= totalMs) {
        setProgress(100)
        setStatus("completed")
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [stepIndex])

  useEffect(() => {
    start()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [start])

  return {
    status,
    progress,
    stepIndex,
    stepLabel,
    statusText,
    estRemainingMs,
    stats,
    cancel,
    retry,
  }
}

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
