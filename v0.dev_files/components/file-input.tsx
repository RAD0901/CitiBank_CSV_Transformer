"use client"

import { forwardRef, useRef } from "react"
import { Button } from "@/components/ui/button"

type FileInputProps = {
  accept?: string
  buttonLabel?: string
  buttonAriaLabel?: string
  onFile?: (file?: File) => void
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(function FileInput(
  { accept = ".csv", buttonLabel = "Browse", buttonAriaLabel = "Browse for file", onFile = () => {} },
  _ref
) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          onFile(file ?? undefined)
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
        aria-label={buttonAriaLabel}
        onClick={(e) => {
          e.stopPropagation()
          inputRef.current?.click()
        }}
      >
        {buttonLabel}
      </Button>
    </>
  )
})

export default FileInput
