"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Inter } from 'next/font/google'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from "@/lib/utils"
import ProgressIndicator from "@/components/progress-indicator"
import FileUploadZone from "@/components/file-upload-zone"
import ValidationMessage from "@/components/validation-message"
import ActionButton from "@/components/action-button"
import FileInput from "@/components/file-input"
import { useRouter } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

type FileState =
  | { status: "idle" }
  | { status: "valid"; file: File }
  | { status: "error"; message: string; tips?: string[] }

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export default function Page() {
  const [fileState, setFileState] = useState<FileState>({ status: "idle" })
  const errorRef = useRef<HTMLDivElement | null>(null)
  const proceedButtonRef = useRef<HTMLButtonElement | null>(null)
  const router = useRouter()

  const validateFile = useCallback((file: File): FileState => {
    const name = file.name.toLowerCase()
    const isCsv = name.endsWith(".csv")
    const sizeOk = file.size <= MAX_SIZE_BYTES

    if (!isCsv && !sizeOk) {
      return {
        status: "error",
        message: "Invalid file type and size.",
        tips: [
          "Upload a .csv file exported from CitiBank.",
          "Ensure the file is 10MB or smaller.",
          "If you have an Excel file (.xlsx), export it as CSV first.",
        ],
      }
    }
    if (!isCsv) {
      return {
        status: "error",
        message: "Only CSV files are allowed.",
        tips: [
          "Export your statement as .csv (not .xlsx or .xls).",
          "Most banking portals have an 'Export as CSV' option.",
        ],
      }
    }
    if (!sizeOk) {
      return {
        status: "error",
        message: "File is too large.",
        tips: [
          "Reduce the date range and export again.",
          "Split your data into multiple CSV files under 10MB each.",
        ],
      }
    }
    return { status: "valid", file }
  }, [])

  const reset = useCallback(() => setFileState({ status: "idle" }), [])

  const onFileSelected = useCallback(
    (file?: File) => {
      if (!file) return
      const result = validateFile(file)
      setFileState(result)
      if (result.status === "error") {
        // Move focus to error for screen readers
        setTimeout(() => {
          errorRef.current?.focus()
        }, 0)
      } else if (result.status === "valid") {
        // Focus the proceed button to encourage next action
        setTimeout(() => {
          proceedButtonRef.current?.focus()
        }, 0)
      }
    },
    [validateFile]
  )

  const successText = useMemo(() => {
    if (fileState.status !== "valid") return null
    const { file } = fileState
    return `${file.name} • ${formatBytes(file.size)}`
  }, [fileState])

  const onProceed = useCallback(() => {
    if (fileState.status !== "valid") return
    router.push("/process")
  }, [fileState, router])

  return (
    <main className={cn("min-h-screen bg-slate-50 text-slate-900", inter.className)}>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">CitiBank CSV Transformer</h1>
            <p className="text-sm text-slate-600">Upload your statement to get started.</p>
          </div>
          <ProgressIndicator current={1} total={4} />
        </header>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upload CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUploadZone
              acceptExtensions={[".csv"]}
              maxSizeBytes={MAX_SIZE_BYTES}
              onFileAccepted={(file) => onFileSelected(file)}
              onError={(message, tips) => setFileState({ status: "error", message, tips })}
              description="Drag & drop your CitiBank CSV here"
              hint="CSV only, up to 10MB"
            >
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600 transition-transform duration-200 group-hover:scale-105" aria-hidden="true" />
                <span className="font-medium text-slate-800">Drag & drop your CitiBank CSV here</span>
              </div>
              <p id="upload-hint" className="text-sm text-slate-500">
                or
                <span className="mx-1" />
                <FileInput
                  accept=".csv"
                  onFile={(file) => onFileSelected(file)}
                  buttonLabel="Browse files"
                  buttonAriaLabel="Browse to select a CSV file"
                />
              </p>
              <p className="sr-only" aria-live="polite">
                Accepted file type: .csv. Maximum size: 10 megabytes.
              </p>
            </FileUploadZone>

            {fileState.status === "valid" && (
              <ValidationMessage
                variant="success"
                icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                title="File ready"
                message={successText ?? ""}
                ariaLive="polite"
              />
            )}

            {fileState.status === "error" && (
              <ValidationMessage
                ref={errorRef}
                variant="error"
                icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />}
                title="There was a problem with your file"
                message={fileState.message}
                tips={fileState.tips}
                ariaLive="assertive"
                focusable
              />
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                className="text-slate-600 hover:text-slate-900"
                onClick={reset}
                aria-label="Reset selected file"
              >
                Reset
              </Button>
              <ActionButton
                ref={proceedButtonRef}
                disabled={fileState.status !== "valid"}
                onClick={onProceed}
                label="Process File"
              />
            </div>
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-slate-500">
          We never store your files. Your data is processed securely.
        </footer>
      </div>
    </main>
  )
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
