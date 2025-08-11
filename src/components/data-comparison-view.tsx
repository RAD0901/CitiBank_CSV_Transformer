"use client"

import { useMemo, useState } from "react"
import DataTable, { type Column } from "../components/data-table"
import ValidationBadge from "../components/validation-badge"
import ExpandButton from "../components/expand-button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Maximize2 } from 'lucide-react'

type OriginalRow = {
  "Account Number": string
  "Value Date": string
  "Customer Reference": string
  "Amount": string
}

type TransformedRow = {
  Date: string
  Description: string
  Amount: string  // ✅ FIXED - now string to preserve decimals
}

type Props = {
  originalRows: OriginalRow[]
  transformedRows: TransformedRow[]
  issues?: ({ type: "warning" | "error"; message: string }[] | undefined)[]
  expanded?: boolean
  onToggleExpanded?: () => void
}

export default function DataComparisonView({
  originalRows,
  transformedRows,
  issues = [],
  expanded = false,
  onToggleExpanded = () => {},
}: Props) {
  const [openFull, setOpenFull] = useState(false)

  // Determine changed cells per row for highlighting
  const changedOriginal = useMemo(() => {
    return originalRows.map((o, idx) => {
      const t = transformedRows[idx]
      const changed: Record<string, boolean> = {}
      if (!t) return changed
      // Date normalized
      changed["Value Date"] = true
      // Description from Customer Reference
      if (o["Customer Reference"].trim() !== t.Description.trim()) {
        changed["Customer Reference"] = true
      }
      // Amount string vs integer cents
      changed["Amount"] = true
      return changed
    })
  }, [originalRows, transformedRows])

  const changedTransformed = useMemo(() => {
    return transformedRows.map((_t, _idx) => {
      const changed: Record<string, boolean> = {}
      changed["Date"] = true
      changed["Description"] = true
      changed["Amount"] = true
      return changed
    })
  }, [transformedRows])

  const originalCols: Column<OriginalRow>[] = [
    { key: "Account Number", header: "Account Number", width: "w-[160px]" },
    { key: "Value Date", header: "Value Date", width: "w-[120px]" },
    { key: "Customer Reference", header: "Customer Reference", width: "min-w-[220px]" },
    { key: "Amount", header: "Amount", align: "right", width: "w-[120px]" },
  ]

  const transformedCols: Column<TransformedRow>[] = [
    { key: "Date", header: "Date", width: "w-[120px]" },
    { key: "Description", header: "Description", width: "min-w-[220px]" },
    { key: "Amount", header: "Amount (¢)", align: "right", width: "w-[120px]" },
  ]

  const previewCount = 5
  const oRows = expanded ? originalRows : originalRows.slice(0, previewCount)
  const tRows = expanded ? transformedRows : transformedRows.slice(0, previewCount)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ValidationBadge status={deriveOverall(issues)} />
          <p className="text-sm text-slate-600 dark:text-slate-400">Showing {oRows.length} of {originalRows.length} rows</p>
        </div>
        <div className="flex items-center gap-2">
          <ExpandButton expanded={expanded} onClick={onToggleExpanded} />
          <Dialog open={openFull} onOpenChange={setOpenFull}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                View full dataset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>Full dataset</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="px-1 pb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Original (CitiBank)</h3>
                  <DataTable
                    columns={originalCols}
                    rows={originalRows}
                    highlight={(rowIdx, key) => !!changedOriginal[rowIdx]?.[key]}
                    compact
                  />
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="px-1 pb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Transformed (Sage)</h3>
                  <DataTable
                    columns={transformedCols}
                    rows={transformedRows}
                    highlight={(rowIdx, key) => !!changedTransformed[rowIdx]?.[key]}
                    formatters={{
                      Amount: (v: string) => {
                        const numValue = parseFloat(v);
                        return isNaN(numValue) ? v : numValue.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                      },
                    }}
                    compact
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="px-1 pb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Original (CitiBank)</h3>
          <DataTable
            columns={originalCols}
            rows={oRows}
            highlight={(rowIdx, key) => !!changedOriginal[rowIdx]?.[key]}
          />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="px-1 pb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Transformed (Sage)</h3>
          <DataTable
            columns={transformedCols}
            rows={tRows}
            highlight={(rowIdx, key) => !!changedTransformed[rowIdx]?.[key]}
            formatters={{
              Amount: (v: string) => {
                const numValue = parseFloat(v);
                return isNaN(numValue) ? v : numValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

function deriveOverall(issues: ({ type: "warning" | "error"; message: string }[] | undefined)[]): "success" | "warning" | "error" {
  const hasError = issues.some(arr => (arr ?? []).some(i => i.type === "error"))
  const hasWarn = issues.some(arr => (arr ?? []).some(i => i.type === "warning"))
  return hasError ? "error" : hasWarn ? "warning" : "success"
}
