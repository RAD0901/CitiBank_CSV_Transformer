"use client"

import { useEffect, useRef } from "react"
import { CheckCircle2 } from 'lucide-react'

export default function SuccessConfirmation() {
  const confettiRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = confettiRef.current
    if (!el) return
    // create a simple burst of confetti dots
    const colors = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"]
    const count = 18
    const fragments: HTMLSpanElement[] = []
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span")
      s.className = "absolute h-1.5 w-1.5 rounded-full"
      s.style.backgroundColor = colors[i % colors.length]
      const angle = (i / count) * Math.PI * 2
      const dist = 20 + Math.random() * 26
      const tx = Math.cos(angle) * dist
      const ty = Math.sin(angle) * dist
      s.style.transform = "translate(0, 0)"
      s.style.opacity = "0"
      s.style.animation = `burst 600ms ease-out forwards`
      s.style.setProperty("--tx", `${tx}px`)
      s.style.setProperty("--ty", `${ty}px`)
      s.style.left = "50%"
      s.style.top = "50%"
      el.appendChild(s)
      fragments.push(s)
    }
    const t = setTimeout(() => {
      fragments.forEach((f) => f.remove())
    }, 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-900" role="status" aria-live="polite">
      <div ref={confettiRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
      <CheckCircle2 className="h-5 w-5 animate-in fade-in zoom-in-50" aria-hidden="true" />
      <div className="text-sm font-medium">File generated successfully. Ready for Sage import.</div>
      <style>{`
        @keyframes burst {
          0% { opacity: 0; transform: translate(0,0) scale(1); }
          100% { opacity: 1; transform: translate(var(--tx), var(--ty)) scale(1); }
        }
      `}</style>
    </div>
  )
}
