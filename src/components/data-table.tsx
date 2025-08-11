"use client"

import { useMemo, useState } from "react"
import { cn } from "../lib/utils"
import { ArrowUpDown } from 'lucide-react'

export type Column<T extends Record<string, any>> = {
  key: keyof T | string
  header: string
  width?: string // Tailwind width classes
  align?: "left" | "right" | "center"
}

type Props<T extends Record<string, any>> = {
  columns: Column<T>[]
  rows: T[]
  highlight?: (rowIndex: number, key: string) => boolean
  formatters?: Partial<Record<keyof T | string, (value: any, row: T) => React.ReactNode>>
  compact?: boolean
}

type SortState = { key: string | null; dir: "asc" | "desc" }

export default function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  highlight,
  formatters,
  compact = false,
}: Props<T>) {
  const [sort, setSort] = useState<SortState>({ key: null, dir: "asc" })

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows
    const key = sort.key
    const dir = sort.dir === "asc" ? 1 : -1
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = get(a, key)
      const bv = get(b, key)
      if (av == null && bv == null) return 0
      if (av == null) return -1 * dir
      if (bv == null) return 1 * dir
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
    return copy
  }, [rows, sort])

  const onHeaderClick = (key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" }
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" }
    })
  }

  return (
    <div className="overflow-hidden rounded-md ring-1 ring-slate-200 dark:ring-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <tr>
              {columns.map((c) => {
                const key = String(c.key)
                const isSorted = sort.key === key
                const ariaSort = isSorted ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
                return (
                  <th
                    key={key}
                    role="columnheader"
                    aria-sort={ariaSort as any}
                    scope="col"
                    onClick={() => onHeaderClick(key)}
                    className={cn(
                      "select-none whitespace-nowrap px-3 py-2 text-left font-medium",
                      c.width,
                      "cursor-pointer"
                    )}
                  >
                    <div className={cn("flex items-center gap-1", c.align === "right" && "justify-end", c.align === "center" && "justify-center")}>
                      <span>{c.header}</span>
                      <ArrowUpDown className={cn("h-3.5 w-3.5 opacity-60", isSorted && "opacity-100")} aria-hidden="true" />
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900">
            {sortedRows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-slate-100 last:border-0 dark:border-slate-800",
                  "odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-950"
                )}
              >
                {columns.map((c) => {
                  const key = String(c.key)
                  const v = get(row, key)
                  const formatted = formatters?.[key]?.(v, row) ?? v
                  const hl = highlight?.(rows.indexOf(row), key) // map to original index for highlight
                  return (
                    <td
                      key={key}
                      className={cn(
                        "max-w-[360px] truncate px-3",
                        compact ? "py-1.5" : "py-2.5",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        hl && "bg-blue-50/70 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/20 dark:ring-blue-900/40"
                      )}
                      title={String(v ?? "")}
                    >
                      <span className="inline-block max-w-full overflow-hidden text-ellipsis align-middle">{formatted as any}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function get<T extends Record<string, any>>(obj: T, path: string) {
  return obj[path as keyof T]
}
