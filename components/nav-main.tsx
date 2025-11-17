"use client"

import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onViewChange,
  currentView,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    isPrimary?: boolean
    isExperimental?: boolean
  }[]
  onViewChange?: (view: string) => void
  currentView?: string
}) {
  const handleNavClick = (url: string) => {
    const view = url.replace('#', '')
    if (onViewChange && view) {
      onViewChange(view)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title}
                className={
                  item.isPrimary ? 
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground transition-all duration-200 ease-in-out cursor-pointer hover:transform hover:scale-[1.02] active:scale-[0.98]" : 
                  item.isExperimental ?
                    "bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 border border-teal-300 dark:border-teal-800 cursor-pointer transition-all duration-200 ease-in-out hover:transform hover:scale-[1.02] active:scale-[0.98]" :
                    "cursor-pointer transition-all duration-200 ease-in-out hover:transform hover:scale-[1.02] active:scale-[0.98]"
                }
                isActive={currentView === item.url.replace('#', '')}
                onClick={() => handleNavClick(item.url)}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
