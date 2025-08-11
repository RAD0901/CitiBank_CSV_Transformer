import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  expanded?: boolean
  onClick?: () => void
}

export default function ExpandButton({ expanded = false, onClick = () => {} }: Props) {
  return (
    <Button variant="outline" onClick={onClick} className="gap-2">
      {expanded ? (
        <>
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
          Show fewer rows
        </>
      ) : (
        <>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
          Show all rows
        </>
      )}
    </Button>
  )
}
