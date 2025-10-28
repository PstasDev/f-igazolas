"use client"

import * as React from "react"
import {
  IconPlus,
  IconFileText,
  IconUsers,
  IconSchool,
} from "@tabler/icons-react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useRole } from "@/app/context/RoleContext"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onViewChange?: (view: string) => void
  currentView?: string
}

export function AppSidebar({ onViewChange, currentView, ...props }: AppSidebarProps) {
  const { user } = useRole()
  
  const isTeacher = user?.role === 'teacher'
  
  // Student navigation
  const studentNavMain = [
    {
      title: "Új Igazolás",
      url: "#new",
      icon: IconPlus,
      isPrimary: true,
    },
    {
      title: "Igazolások",
      url: "#igazolasok",
      icon: IconFileText,
    },
  ]
  
  // Teacher navigation  
  const teacherNavMain = [
    {
      title: "Igazolások",
      url: "#igazolasok",
      icon: IconFileText,
    },
    {
      title: "Diákok",
      url: "#students",
      icon: IconUsers,
    },
  ]

  const userData = {
    name: user?.name || "Felhasználó",
    email: user?.email || "",
    avatar: user?.avatar || "/avatars/default.jpg",
  }

  const navItems = isTeacher ? teacherNavMain : studentNavMain

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconSchool className="!size-5" />
                <span className="text-base font-semibold"><h1>Igazoláskezelő</h1></span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain 
          items={navItems} 
          onViewChange={onViewChange}
          currentView={currentView}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
