"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Props = {
  onConfirm?: () => void
  disabled?: boolean
  label?: string
}

export default function CancelButton({ onConfirm = () => {}, disabled = false, label = "Cancel" }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-disabled={disabled}
          className="hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel processing?</DialogTitle>
          <DialogDescription>
            Your CSV transformation will stop and no output will be generated.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Keep processing
          </Button>
          <Button
            className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
            onClick={() => {
              onConfirm()
              setOpen(false)
            }}
          >
            Cancel anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
