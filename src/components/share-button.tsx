"use client"

import { Button } from "../components/ui/button"
import { Share2 } from 'lucide-react'
import { useState } from "react"

type Props = {
  title?: string
  text?: string
  url?: string
  onFallbackCopy?: () => void
}

export default function ShareButton({ title = "CitiBank CSV transformed", text = "File ready for Sage Bank Manager", url = typeof window !== "undefined" ? window.location.href : "", onFallbackCopy = () => {} }: Props) {
  const [shared, setShared] = useState(false)

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
        setShared(true)
      } else {
        await onFallbackCopy()
        setShared(true)
      }
      setTimeout(() => setShared(false), 2000)
    } catch {
      // ignore if user cancels share
    }
  }

  return (
    <Button variant="outline" onClick={onShare} className="gap-2" aria-live="polite">
      <Share2 className="h-4 w-4" aria-hidden="true" />
      {shared ? "Copied!" : "Share"}
    </Button>
  )
}
