"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Keyboard } from 'lucide-react'

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?") {
        setOpen((v) => !v)
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        // Batch process
        const btn = document.getElementById("process-all-btn") as HTMLButtonElement | null
        btn?.click()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" aria-label="Keyboard shortcuts">
          <Keyboard className="h-4 w-4" aria-hidden="true" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          <li><kbd className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">?</kbd> Toggle shortcuts</li>
          <li><kbd className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">⌘/Ctrl</kbd> + <kbd className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">B</kbd> Process all in queue</li>
          <li><kbd className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">Enter</kbd> Activate focused control</li>
          <li><kbd className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">Tab</kbd> Keyboard navigation</li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}
