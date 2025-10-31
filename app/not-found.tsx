import { SearchIcon } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>404 - Nem található</EmptyTitle>
          <EmptyDescription>
            A keresett oldal nem létezik.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <EmptyDescription>
            Segítségre van szükséged? <a href="mailto:molnar.attila@szlgbp.hu" className="underline hover:text-primary">Vedd fel a kapcsolatot az adminisztrátorral</a>
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </div>
  )
}
