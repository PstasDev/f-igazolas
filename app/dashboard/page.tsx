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
import { CalendarView } from "./components/CalendarView"
import { AdminView } from "./components/AdminView"
import { SystemMessageBanner } from "@/app/components/SystemMessageBanner"

export default function Page() {
  const { isAuthenticated, user, isLoading } = useRole()
  const router = useRouter()
  const [currentView, setCurrentView] = useState<string>('igazolasok')

  useEffect(() => {
    // Only redirect after loading is complete and user is not authenticated
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

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
  const isSuperuser = user?.isSuperuser || false;

  const handleViewChange = (view: string) => {
    setCurrentView(view)
    window.location.hash = view
  }

  const getPageTitle = () => {
    if (currentView === 'naptar') return 'Naptár'
    if (currentView === 'adminisztracio' && isSuperuser) return 'Adminisztráció'
    
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
          {/* Naptár view (all users) */}
          {currentView === 'naptar' && (
            <div>
              <CalendarView />
            </div>
          )}
          
          {/* Adminisztráció view (superusers only) */}
          {currentView === 'adminisztracio' && isSuperuser && (
            <div>
              <AdminView />
            </div>
          )}
          
          {isTeacher ? (
            <>
              {currentView === 'igazolasok' && (
                <div>
                  <SystemMessageBanner />
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
                  <SystemMessageBanner />
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
