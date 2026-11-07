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
import { MulasztasokView } from "./student/components/MulasztasokView"
import { CalendarView } from "./components/CalendarView"
import { AdminView } from "./components/AdminView"
import { SystemMessageBanner } from "@/app/components/SystemMessageBanner"
import { PasskeySetupDrawer } from "@/components/passkey-setup-drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Page() {
  const { isAuthenticated, user, isLoading } = useRole()
  const router = useRouter()
  const [currentView, setCurrentView] = useState<string>('igazolasok')
  const [selectedTeacherClassId, setSelectedTeacherClassId] = useState<number | null>(null)
  const isTeacher = user?.role === 'teacher';
  const isSuperuser = user?.isSuperuser || false;
  const teacherClasses = user?.profile?.osztalyaim || []
  const selectedTeacherClass = teacherClasses.find((osztaly) => osztaly.id === selectedTeacherClassId)
    || teacherClasses[0]
    || user?.profile?.osztalyom

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

  // Deep link from the "hiánypótlás szükséges" email CTA: ?editIgazolas=<id>
  // stashes the target igazolás id for the student table to pick up, then
  // jumps to the igazolások view.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('editIgazolas')
    if (editId) {
      sessionStorage.setItem('auto_open_igazolas_edit', editId)
      window.location.hash = 'igazolasok'
      window.history.replaceState(null, '', window.location.pathname + window.location.hash)
    }
  }, [])

  useEffect(() => {
    if (!isTeacher || !user || teacherClasses.length === 0) return
    const savedId = Number(window.localStorage.getItem(`teacher-selected-class-${user.id}`))
    const savedClass = teacherClasses.find((osztaly) => osztaly.id === savedId)
    const defaultClass = teacherClasses.find((osztaly) => osztaly.id === user.profile?.osztalyom?.id)
      || teacherClasses[0]
    const initialClass = savedClass || defaultClass
    if (initialClass) setSelectedTeacherClassId(initialClass.id)
  }, [isTeacher, user?.id, user?.profile?.osztalyaim, user?.profile?.osztalyom?.id, teacherClasses])

  const handleTeacherClassChange = (value: string) => {
    const classId = Number(value)
    if (!Number.isFinite(classId)) return
    setSelectedTeacherClassId(classId)
    if (user) window.localStorage.setItem(`teacher-selected-class-${user.id}`, String(classId))
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view)
    window.location.hash = view
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="w-8 h-8" />
      </div>
    )
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
        case 'mulasztasok': return 'Mulasztások (eKréta)'
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
          {isTeacher && teacherClasses.length > 1 && (currentView === 'igazolasok' || currentView === 'students' || currentView === 'naptar') && (
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-medium">Kezelt osztály</p>
              <Select
                value={selectedTeacherClass ? String(selectedTeacherClass.id) : undefined}
                onValueChange={handleTeacherClassChange}
              >
                <SelectTrigger aria-label="Kezelt osztály kiválasztása">
                  <SelectValue placeholder="Válassz osztályt" />
                </SelectTrigger>
                <SelectContent>
                  {teacherClasses.map((osztaly) => (
                    <SelectItem key={osztaly.id} value={String(osztaly.id)}>
                      {osztaly.nev}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Naptár view (all users) */}
          {currentView === 'naptar' && (
            <div>
              <CalendarView
                key={isTeacher ? selectedTeacherClass?.id : 'student-calendar'}
                classId={isTeacher ? selectedTeacherClass?.id : undefined}
                isFClass={selectedTeacherClass?.tagozat === 'F'}
              />
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
                  {selectedTeacherClass && (
                    <TeacherTableView
                      key={selectedTeacherClass.id}
                      filter="all"
                      classId={selectedTeacherClass.id}
                      isFClass={selectedTeacherClass.tagozat === 'F'}
                    />
                  )}
                </div>
              )}
              {currentView === 'students' && (
                <div>
                  {selectedTeacherClass && (
                    <StudentsManagementView key={selectedTeacherClass.id} classId={selectedTeacherClass.id} />
                  )}
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
              {currentView === 'mulasztasok' && (
                <div>
                  <MulasztasokView />
                </div>
              )}
            </>
          )}
        </div>
      </SidebarInset>
      <PasskeySetupDrawer />
    </SidebarProvider>
  )
}
