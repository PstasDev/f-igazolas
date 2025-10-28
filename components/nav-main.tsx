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
                className={item.isPrimary ? 
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground duration-200 ease-linear" : 
                  ""
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
