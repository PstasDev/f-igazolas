"use client"

import * as React from "react"
import {
  IconPlus,
  IconFileText,
  IconUsers,
  IconCalendarEvent,
  IconSettings,
  IconSchool,
} from "@tabler/icons-react"
import Link from "next/link"
import { Logo } from "@/components/Logo"

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
import { useExperimentalFeatures } from "@/app/context/ExperimentalFeaturesContext"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onViewChange?: (view: string) => void
  currentView?: string
}

export function AppSidebar({ onViewChange, currentView, ...props }: AppSidebarProps) {
  const { user } = useRole()
  const { ekretaMulasztasokEnabled } = useExperimentalFeatures()
  
  const isTeacher = user?.role === 'teacher'
  const isSuperuser = user?.isSuperuser || false
  
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
    // Add Mulasztások menu item if experimental feature is enabled
    ...(ekretaMulasztasokEnabled ? [{
      title: "Mulasztások",
      url: "#mulasztasok",
      icon: IconSchool,
      isExperimental: true,
    }] : []),
    {
      title: "Naptár",
      url: "#naptar",
      icon: IconCalendarEvent,
    },
    // Add Administration for superuser students
    ...(isSuperuser ? [{
      title: "Adminisztráció",
      url: "#adminisztracio",
      icon: IconSettings,
    }] : []),
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
    {
      title: "Naptár",
      url: "#naptar",
      icon: IconCalendarEvent,
    },
    // Add Administration for superuser teachers
    ...(isSuperuser ? [{
      title: "Adminisztráció",
      url: "#adminisztracio",
      icon: IconSettings,
    }] : []),
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
                <Logo className="!size-5 shrink-0" />
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
