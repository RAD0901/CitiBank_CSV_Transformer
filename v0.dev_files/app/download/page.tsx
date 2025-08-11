"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import DownloadButton from "@/components/download-button"
import SuccessConfirmation from "@/components/success-confirmation"
import ProcessingSummary from "@/components/processing-summary"
import FileInfo from "@/components/file-info"
import ActionMenu from "@/components/action-menu"
import ShareButton from "@/components/share-button"
import { CheckCircle2, Download, FileText } from 'lucide-react'
import { useRouter } from "next/navigation"

type OriginalRow = {
  "Account Number": string
  "Value Date": string // MM/DD/YYYY
  "Customer Reference": string
  "Amount": string // quoted
}
type TransformedRow = {
  Date: string // DD/MM/YYYY
  Description: string
  Amount: number // cents
}

export default function DownloadPage() {
  const router = useRouter()

  // Simulated data set (align with Preview)
  const originalData = useMemo<OriginalRow[]>(
    () => [
      { "Account Number": "XXXX-1234", "Value Date": "06/01/2025", "Customer Reference": "Payment to ACME Co. Invoice 8891", "Amount": "\"123.45\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/02/2025", "Customer Reference": "Salary May 2025", "Amount": "\"5190.00\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/03/2025", "Customer Reference": "Coffee Shop Downtown", "Amount": "\"-4.35\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/04/2025", "Customer Reference": "International Transfer Reference ABCDEFGHIJKLMNOPQRSTUVWXYZ", "Amount": "\"-250.00\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/05/2025", "Customer Reference": "ATM Withdrawal 123", "Amount": "\"-60.00\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/06/2025", "Customer Reference": "Supermarket Grocery", "Amount": "\"-145.89\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/07/2025", "Customer Reference": "Gym Membership", "Amount": "\"-45.00\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/08/2025", "Customer Reference": "Electric Bill", "Amount": "\"-120.55\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/09/2025", "Customer Reference": "Refund Store #234", "Amount": "\"15.00\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/10/2025", "Customer Reference": "Dining - Sushi Place Downtown", "Amount": "\"-78.60\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/11/2025", "Customer Reference": "RideShare Trip 2025-06-11 09:32", "Amount": "\"-18.75\"" },
      { "Account Number": "XXXX-1234", "Value Date": "06/12/2025", "Customer Reference": "Interest Payment", "Amount": "\"1.23\"" },
    ],
    []
  )

  const transformedWithIssues = useMemo(() => originalData.map(transformRow), [originalData])
  const transformed = transformedWithIssues.map((t) => t.row)

  // Build CSVs and filename
  const originalCsv = useMemo(() => buildOriginalCsv(originalData), [originalData])
  const transformedCsv = useMemo(() => buildTransformedCsv(transformed), [transformed])
  const fileName = useMemo(() => buildFilename(), [])
  const fileSize = useMemo(() => new Blob([transformedCsv], { type: "text/csv;charset=utf-8" }).size, [transformedCsv])

  // Summary metrics
  const total = transformedWithIssues.length
  const errorRows = transformedWithIssues.reduce((acc, r) => acc + (r.issues?.some(i => i.type === "error") ? 1 : 0), 0)
  const warningRows = transformedWithIssues.reduce((acc, r) => acc + (r.issues?.some(i => i.type === "warning") ? 1 : 0), 0)
  const successRows = total - errorRows
  const processingTimeMs = 1780
  const successRate = Math.round((successRows / total) * 100)
  const sizeDelta = transformedCsv.length - originalCsv.length

  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "success" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)
  const durationMs = 1200 // simulate 1.2s download

  const startDownload = () => {
    try {
      setDownloadStatus("downloading")
      setProgress(0)
      startRef.current = performance.now()
      const tick = (now: number) => {
        const elapsed = now - startRef.current
        const raw = Math.min(1, elapsed / durationMs)
        const eased = easeInOutCubic(raw)
        setProgress(Math.round(eased * 100))
        if (raw < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          // trigger actual browser download
          const blob = new Blob([transformedCsv], { type: "text/csv;charset=utf-8" })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 0)
          setDownloadStatus("success")
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (e) {
      console.error("Download error", e)
      setDownloadStatus("error")
    }
  }

  useEffect(() => {
    startDownload()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const summaryText = useMemo(() => {
    return [
      `CitiBank CSV transformed for Sage Bank Manager`,
      `Transactions: ${total} | Success: ${successRows} | Warnings: ${warningRows} | Errors: ${errorRows}`,
      `Processing time: ${Math.max(1, Math.round(processingTimeMs / 1000))}s`,
      `Generated file: ${fileName} (${formatBytes(fileSize)})`,
    ].join("\n")
  }, [total, successRows, warningRows, errorRows, processingTimeMs, fileName, fileSize])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Download & Results</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Your file is ready for Sage Bank Manager.</p>
          </div>
          {downloadStatus === "success" ? (
            <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900" role="status" aria-live="polite">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-medium">Ready</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
              {downloadStatus === "downloading" ? "Preparing download…" : downloadStatus === "error" ? "Download failed" : "Idle"}
            </div>
          )}
        </header>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your converted file</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <FileInfo
                fileName={fileName}
                fileSizeBytes={fileSize}
                format="CSV"
                description="Sage Bank Manager import file"
              />
              <div className="flex flex-wrap items-center gap-2">
                <DownloadButton
                  status={downloadStatus}
                  progress={progress}
                  onRetry={startDownload}
                  label={downloadStatus === "success" ? "Download again" : "Download"}
                />
                <ShareButton
                  title="Sage import file ready"
                  text={`Transformed ${total} transactions. ${successRate}% success.`}
                  onFallbackCopy={() => navigator.clipboard.writeText(summaryText)}
                />
                <ActionMenu
                  onViewDetails={() => router.push("/preview")}
                  onStartOver={() => router.push("/")}
                  onCopySummary={() => navigator.clipboard.writeText(summaryText)}
                />
              </div>
            </div>

            {downloadStatus === "success" && <SuccessConfirmation />}

            <ProcessingSummary
              originalFileName={"citibank_statement.csv"}
              originalFileSizeBytes={new Blob([originalCsv]).size}
              generatedFileName={fileName}
              generatedFileSizeBytes={fileSize}
              transactionsProcessed={total}
              processingTimeMs={processingTimeMs}
              successRate={successRate}
              warnings={warningRows}
              errors={errorRows}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Download completed? Import into Sage Bank Manager to finish.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push("/preview")} className="gap-2">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  View details
                </Button>
                <Button onClick={() => router.push("/")} className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600">
                  Process another file
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

// Helpers and transforms
function buildFilename() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  const ss = String(d.getSeconds()).padStart(2, "0")
  return `sage_bank_import_${yyyy}-${mm}-${dd}_${hh}${mi}${ss}.csv`
}
function transformRow(o: OriginalRow): { row: TransformedRow; issues?: { type: "warning" | "error"; message: string }[] } {
  const issues: { type: "warning" | "error"; message: string }[] = []
  const parts = o["Value Date"].split("/")
  let tDate = o["Value Date"]
  if (parts.length === 3) {
    tDate = `${parts[1].padStart(2, "0")}/${parts[0].padStart(2, "0")}/${parts[2]}`
  } else {
    issues.push({ type: "error", message: "Invalid date format" })
  }
  let desc = o["Customer Reference"].trim()
  if (desc.length > 50) {
    desc = desc.slice(0, 47) + "…"
    issues.push({ type: "warning", message: "Description truncated" })
  }
  const amtStr = o["Amount"].replace(/"/g, "")
  const maybe = Number.parseFloat(amtStr)
  if (Number.isNaN(maybe)) {
    issues.push({ type: "error", message: "Invalid amount" })
  }
  const amountCents = Math.round((Number.isNaN(maybe) ? 0 : maybe) * 100)
  if (amountCents < 0 && Math.abs(amountCents) < 500) {
    issues.push({ type: "warning", message: "Small debit detected" })
  }
  return { row: { Date: tDate, Description: desc, Amount: amountCents }, issues: issues.length ? issues : undefined }
}
function buildOriginalCsv(rows: OriginalRow[]) {
  const headers = ["Account Number","Value Date","Customer Reference","Amount"]
  const body = rows.map(r => [r["Account Number"], r["Value Date"], `"${r["Customer Reference"].replace(/"/g, '""')}"`, r["Amount"]].join(","))
  return [headers.join(","), ...body].join("\n")
}
function buildTransformedCsv(rows: TransformedRow[]) {
  const headers = ["Date","Description","Amount"]
  const body = rows.map(r => [r.Date, `"${r.Description.replace(/"/g, '""')}"`, r.Amount].join(","))
  return [headers.join(","), ...body].join("\n")
}
function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B","KB","MB","GB","TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
