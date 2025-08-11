"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import DataComparisonView from "@/components/data-comparison-view"
import StatisticsPanel from "@/components/statistics-panel"
import ValidationBadge from "@/components/validation-badge"
import { useRouter } from "next/navigation"
import { Download, FileText, FileUp, AlertTriangle } from 'lucide-react'

type OriginalRow = {
  "Account Number": string
  "Value Date": string // MM/DD/YYYY
  "Customer Reference": string
  "Amount": string // quoted decimal string, e.g., "123.45"
}

type TransformedRow = {
  Date: string // DD/MM/YYYY
  Description: string
  Amount: number // integer cents
}

// Sample dataset (12 rows)
const originalData: OriginalRow[] = [
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
]

// Simple transform to Sage schema
function transformRow(o: OriginalRow): { row: TransformedRow; issues?: { type: "warning" | "error"; message: string }[] } {
  const issues: { type: "warning" | "error"; message: string }[] = []

  // Date MM/DD/YYYY -> DD/MM/YYYY
  const parts = o["Value Date"].split("/")
  let tDate = o["Value Date"]
  if (parts.length === 3) {
    tDate = `${parts[1].padStart(2, "0")}/${parts[0].padStart(2, "0")}/${parts[2]}`
  } else {
    issues.push({ type: "error", message: "Invalid date format" })
  }

  // Description: clip to 50 chars with warning if truncated
  let desc = o["Customer Reference"].trim()
  if (desc.length > 50) {
    desc = desc.slice(0, 47) + "…"
    issues.push({ type: "warning", message: "Description truncated to 50 characters" })
  }

  // Amount string -> integer cents
  const amtStr = o["Amount"].replace(/"/g, "")
  const maybe = Number.parseFloat(amtStr)
  if (Number.isNaN(maybe)) {
    issues.push({ type: "error", message: "Invalid amount" })
  }
  const amountCents = Math.round(maybe * 100)

  // Example extra warning for small negative charge
  if (amountCents < 0 && Math.abs(amountCents) < 500) {
    issues.push({ type: "warning", message: "Small debit detected" })
  }

  return {
    row: {
      Date: tDate,
      Description: desc,
      Amount: amountCents,
    },
    issues: issues.length ? issues : undefined,
  }
}

export default function PreviewPage() {
  const router = useRouter()
  const transformedWithIssues = useMemo(() => originalData.map(transformRow), [])
  const transformed = transformedWithIssues.map((t) => t.row)

  const total = transformedWithIssues.length
  const errors = transformedWithIssues.reduce((acc, r) => acc + (r.issues?.filter(i => i.type === "error").length ? 1 : 0), 0)
  const warnings = transformedWithIssues.reduce((acc, r) => acc + (r.issues?.filter(i => i.type === "warning").length ? 1 : 0), 0)
  const successes = total - errors
  const overallStatus: "success" | "warning" | "error" = errors > 0 ? "error" : warnings > 0 ? "warning" : "success"

  // Rough processing time and size delta
  const processingTimeMs = 1780
  const origCsv = buildOriginalCsv(originalData)
  const newCsv = buildTransformedCsv(transformed)
  const sizeDelta = newCsv.length - origCsv.length

  const [expanded, setExpanded] = useState(false)

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Preview & Validation</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Review the transformed data before download.</p>
          </div>
          <ValidationBadge status={overallStatus} />
        </header>

        <StatisticsPanel
          totalRows={total}
          successRows={successes}
          warningRows={warnings}
          errorRows={errors}
          processingTimeMs={processingTimeMs}
          sizeDeltaBytes={sizeDelta}
        />

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Data comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataComparisonView
              originalRows={originalData}
              transformedRows={transformed}
              expanded={expanded}
              onToggleExpanded={() => setExpanded((v) => !v)}
              issues={transformedWithIssues.map(t => t.issues)}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>{"Click column headers to sort. Use “View full dataset” for complete review."}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Go Back
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="gap-2"
            >
              <FileUp className="h-4 w-4" aria-hidden="true" />
              Upload New File
            </Button>
            <Button
              onClick={() => downloadBlob("transformed.csv", newCsv, "text/csv")}
              className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600 gap-2"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download CSV
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const report = buildValidationReport(transformedWithIssues)
                downloadBlob("validation-report.csv", report, "text/csv")
              }}
            >
              Export validation report
            </Button>
            <Button
              onClick={() => router.push("/download")}
              className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600 gap-2"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Continue to Download
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
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
function buildValidationReport(items: { row: TransformedRow; issues?: { type: "warning" | "error"; message: string }[] }[]) {
  const headers = ["Row","Status","Messages"]
  const body = items.map((it, idx) => {
    const errs = it.issues?.map(i => `${i.type.toUpperCase()}: ${i.message}`).join(" | ") ?? "OK"
    const status = it.issues?.some(i => i.type === "error") ? "ERROR" : it.issues?.some(i => i.type === "warning") ? "WARNING" : "SUCCESS"
    return [idx + 1, status, `"${errs.replace(/"/g, '""')}"`].join(",")
  })
  return [headers.join(","), ...body].join("\n")
}
function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}
