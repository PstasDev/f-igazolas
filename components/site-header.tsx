import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ThemeToggle from "@/app/components/ThemeToggle"

interface SiteHeaderProps {
  title?: string
}

export function SiteHeader({ title = "Igazoláskezelő" }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">{title}</h1>
          <div className="ml-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="dark:text-white dark:bg-purple-600/30 border border-purple-600 text-xs font-semibold px-2 py-1 rounded-full shadow-sm cursor-help select-none">
                    Korai Hozzáférés
                  </span>
                </TooltipTrigger>
                <TooltipContent className="dark:bg-purple-600/30 dark:border-purple-600 border dark:text-white">
                  <p>Ez az alkalmazás fejlesztés alatt áll és tesztelési célokra szolgál.</p>
                  <p>Egyes funkciók hiányozhatnak vagy nem működnek megfelelően.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
