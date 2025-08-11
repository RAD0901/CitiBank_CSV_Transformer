"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Clipboard, Eye, RotateCcw } from 'lucide-react'

type Props = {
  onViewDetails?: () => void
  onStartOver?: () => void
  onCopySummary?: () => void
}

export default function ActionMenu({ onViewDetails = () => {}, onStartOver = () => {}, onCopySummary = () => {} }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          More actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onViewDetails} className="gap-2">
          <Eye className="h-4 w-4" aria-hidden="true" />
          View processing details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopySummary} className="gap-2">
          <Clipboard className="h-4 w-4" aria-hidden="true" />
          Copy summary to clipboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onStartOver} className="gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Process another file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
