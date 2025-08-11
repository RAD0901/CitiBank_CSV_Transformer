"use client"

import { useCallback, useRef, useState } from "react"
import { cn } from "../lib/utils"

type FileUploadZoneProps = {
  acceptExtensions?: string[] // e.g., [".csv"]
  maxSizeBytes?: number
  onFileAccepted?: (file: File) => void
  onError?: (message: string, tips?: string[]) => void
  description?: string
  hint?: string
  children?: React.ReactNode
}

export default function FileUploadZone({
  acceptExtensions = [".csv"],
  maxSizeBytes = 10 * 1024 * 1024,
  onFileAccepted = () => {},
  onError = () => {},
  description = "Drag & drop your file here",
  hint = "",
  children,
}: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFiles = useCallback(
    (files?: FileList | null) => {
      if (!files || !files.length) return
      const file = files[0]
      const lower = file.name.toLowerCase()
      const extOk = acceptExtensions.some((ext) => lower.endsWith(ext))
      const sizeOk = file.size <= maxSizeBytes
      if (!extOk && !sizeOk) {
        onError("Invalid file type and size.", [
          `Accepted types: ${acceptExtensions.join(", ")}`,
          "Ensure the file is 10MB or smaller.",
        ])
        return
      }
      if (!extOk) {
        onError(`Only ${acceptExtensions.join(", ")} files are allowed.`, [
          "Export your data as CSV.",
        ])
        return
      }
      if (!sizeOk) {
        onError("File is too large.", ["Max size is 10MB. Try splitting the file."])
        return
      }
      onFileAccepted(file)
    },
    [acceptExtensions, maxSizeBytes, onError, onFileAccepted]
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      handleFiles(e.dataTransfer?.files)
    },
    [handleFiles]
  )

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Indicate copy operation
    e.dataTransfer.dropEffect = "copy"
    setDragActive(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        openFileDialog()
      }
    },
    [openFileDialog]
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="File upload area. Press Enter or Space to browse files."
      aria-describedby={hint ? "upload-hint" : undefined}
      onKeyDown={onKeyDown}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={openFileDialog}
      className={cn(
        "group relative w-full cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all",
        "bg-white shadow-xs",
        dragActive
          ? "border-blue-600 ring-4 ring-blue-100"
          : "border-slate-300 hover:border-blue-500 hover:bg-slate-50"
      )}
    >
      {/* Hidden input to support click/keyboard selection as a fallback */}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={acceptExtensions.join(",")}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {children ? (
          children
        ) : (
          <>
            <span className="text-base font-medium text-slate-800">{description}</span>
            {hint && <span className="text-sm text-slate-500">{hint}</span>}
          </>
        )}
      </div>
    </div>
  )
}
