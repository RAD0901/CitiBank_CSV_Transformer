"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { BookOpenCheck, Video, LifeBuoy, ExternalLink } from 'lucide-react'

type Topic = {
  q: string
  a: string
  tags?: string[]
}

const TOPICS: Topic[] = [
  {
    q: "How do I set the date format?",
    a: "Open Settings → Date and amount → choose your preferred date format. This applies to all files in the current session.",
    tags: ["settings","date","format"],
  },
  {
    q: "What is the error handling strategy?",
    a: "Choose 'Skip' to continue past invalid rows, 'Stop' to cancel processing, or 'Fix' to attempt auto-correction.",
    tags: ["errors","strategy"],
  },
  {
    q: "How to export a validation report?",
    a: "In Preview or Error Dashboard, use 'Export error report' to download a CSV with line-by-line diagnostics.",
    tags: ["export","report","validation"],
  },
  {
    q: "Can I schedule processing?",
    a: "Scheduling is available in Enterprise plans. Contact support to configure webhooks and schedule windows.",
    tags: ["schedule","enterprise","webhooks"],
  },
]

export default function HelpSystem({ expanded = false }: { expanded?: boolean }) {
  const [query, setQuery] = useState("")
  const topics = useMemo(() => {
    if (!query.trim()) return TOPICS
    const q = query.toLowerCase()
    return TOPICS.filter((t) => t.q.toLowerCase().includes(q) || t.tags?.some((tag) => tag.includes(q)))
  }, [query])

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
          Help & documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Search help..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <Accordion type="multiple" defaultValue={expanded ? topics.map((_, i) => `t_${i}`) : []}>
          {topics.map((t, i) => (
            <AccordionItem key={i} value={`t_${i}`}>
              <AccordionTrigger className="text-left">{t.q}</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-slate-700 dark:text-slate-300">{t.a}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="grid gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.open("https://www.youtube.com/results?search_query=Sage+Bank+Manager+CSV+import", "_blank")}>
            <Video className="h-4 w-4" aria-hidden="true" />
            Watch video guides
            <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.open("https://vercel.com/help", "_blank")}>
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Contact support
            <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
