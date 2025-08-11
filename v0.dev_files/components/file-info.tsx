import { cn } from "@/lib/utils"
import { FileSpreadsheet, FileType } from 'lucide-react'

type Props = {
  fileName: string
  fileSizeBytes: number
  format: string
  description?: string
  className?: string
}

export default function FileInfo({ fileName, fileSizeBytes, format, description, className }: Props) {
  return (
    <div className={cn("flex items-start gap-3", className)} aria-label="Generated file information">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900">
        <FileSpreadsheet className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fileName}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">{format} • {formatBytes(fileSizeBytes)}</div>
        {description && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</div>}
      </div>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const sizes = ["B","KB","MB","GB","TB"]
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
