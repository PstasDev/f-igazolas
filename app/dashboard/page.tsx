"use client"

import { useRole } from "@/app/context/RoleContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { StudentTableView } from "./student/components/StudentTableView"
import { TeacherTableView } from "./teacher/components/TeacherTableView"
import { StudentsManagementView } from "./teacher/components/StudentsManagementView"
import { MultiStepIgazolasForm } from "./student/components/MultiStepIgazolasForm"

export default function Page() {
  const { isAuthenticated, user } = useRole()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<string>('igazolasok')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, router])

  // Handle hash changes for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      setCurrentView(hash || (user?.role === 'teacher' ? 'igazolasok' : 'igazolasok'))
    }
    
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [user?.role])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  const isTeacher = user?.role === 'teacher';

  const handleViewChange = (view: string) => {
    setCurrentView(view)
    window.location.hash = view
  }

  const getPageTitle = () => {
    if (isTeacher) {
      switch (currentView) {
        case 'igazolasok': return 'Igazolások'
        case 'students': return 'Diákok kezelése'
        default: return 'Irányítópult'
      }
    } else {
      switch (currentView) {
        case 'igazolasok': return 'Igazolásaim'
        case 'new': return 'Új igazolás'
        default: return 'Irányítópult'
      }
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar onViewChange={handleViewChange} currentView={currentView} />
      <SidebarInset>
        <SiteHeader title={getPageTitle()} />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {isTeacher ? (
            <>
              {currentView === 'igazolasok' && (
                <div>
                  <TeacherTableView filter="all" />
                </div>
              )}
              {currentView === 'students' && (
                <div>
                  <StudentsManagementView />
                </div>
              )}
            </>
          ) : (
            <>
              {currentView === 'igazolasok' && (
                <div>
                  <StudentTableView />
                </div>
              )}
              {currentView === 'new' && (
                <div>
                  <MultiStepIgazolasForm />
                </div>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
