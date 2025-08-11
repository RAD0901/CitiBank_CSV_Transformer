"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ProgressBar from "@/components/progress-bar"
import StepIndicator from "@/components/step-indicator"
import StatusMessage from "@/components/status-message"
import ProcessingStats from "@/components/processing-stats"
import CancelButton from "@/components/cancel-button"
import ErrorBoundary from "@/components/error-boundary"
import ProgressIndicator from "@/components/progress-indicator"
import { CheckCircle2 } from 'lucide-react'
import { useProcessingSimulator } from "@/hooks/use-processing-simulator"
import { useRouter } from "next/navigation"

export default function ProcessingPage() {
  return (
    <ErrorBoundary>
      <ProcessingView />
    </ErrorBoundary>
  )
}

function ProcessingView() {
  const router = useRouter()
  const {
    status,
    progress,
    stepIndex,
    stepLabel,
    statusText,
    estRemainingMs,
    stats,
    cancel,
    retry,
  } = useProcessingSimulator()

  const isProcessing = status === "processing"
  const isComplete = status === "completed"
  const isCancelled = status === "cancelled"
  const isError = status === "error"

  const steps = useMemo(
    () => [
      { key: "parse", title: "Parse", description: "Parsing CSV file", icon: "file" as const },
      { key: "find", title: "Find", description: "Finding transaction data", icon: "search" as const },
      { key: "transform", title: "Transform", description: "Transforming records", icon: "wand" as const },
      { key: "generate", title: "Generate", description: "Generating output", icon: "download" as const },
    ],
    []
  )

  return (
    <main className={cn("min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100")}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Processing your CSV</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Please keep this tab open.</p>
          </div>
          <ProgressIndicator current={2} total={4} />
        </header>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">CSV Transformation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <StepIndicator steps={steps} currentIndex={stepIndex} status={status} />

            <div className="space-y-2">
              <ProgressBar value={progress} colorClass="bg-emerald-500" animated active={isProcessing} />
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>{Math.round(progress)}%</span>
                <span aria-live="polite">
                  {isComplete
                    ? "Done"
                    : isCancelled
                    ? "Cancelled"
                    : isError
                    ? "Stopped due to error"
                    : `~${formatEta(estRemainingMs)} remaining`}
                </span>
              </div>
            </div>

            <StatusMessage
              status={status}
              message={statusText}
              active={isProcessing}
              stepLabel={stepLabel}
            />

            <ProcessingStats
              processed={stats.processedRows}
              total={stats.totalRows}
              errors={stats.errors}
              loading={isProcessing && stats.totalRows === 0}
            />

            <div className="flex items-center justify-between pt-2">
              <CancelButton
                disabled={!isProcessing}
                onConfirm={cancel}
                label="Cancel"
              />
              {isComplete && (
                <div className="flex items-center gap-2">
                  <SuccessCelebrate />
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600"
                    onClick={() => router.push("/preview")}
                  >
                    Continue
                  </Button>
                </div>
              )}
              {isError && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={retry}>
                    Retry
                  </Button>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600"
                    onClick={() => alert("Open help / docs")}
                  >
                    Get help
                  </Button>
                </div>
              )}
              {isCancelled && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={retry}>
                    Restart
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-slate-500 dark:text-slate-400">
          Processing runs in your browser. No files are stored.
        </footer>
      </div>
    </main>
  )
}

function SuccessCelebrate() {
  return (
    <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900">
      <CheckCircle2 className="h-5 w-5 animate-in fade-in zoom-in-50" aria-hidden="true" />
      <span className="text-sm font-medium">Completed</span>
      <span className="ml-1 inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
    </div>
  )
}

function formatEta(ms: number) {
  const sec = Math.max(0, Math.ceil(ms / 1000))
  if (sec <= 1) return "1s"
  return `${sec}s`
}
