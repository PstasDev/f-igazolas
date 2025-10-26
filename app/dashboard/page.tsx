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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "./teacher/data-table"
import { columns } from "./teacher/columns"
import { mockIgazolasok } from "./mockData"
import { StudentsManagementView } from "./teacher/components/StudentsManagementView"
import { StudentTableView } from "./student/components/StudentTableView"

export default function Page() {
  const { isAuthenticated, user } = useRole()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<string>('all')

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
      setCurrentView(hash || (user?.role === 'teacher' ? 'all' : 'igazolasok'))
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

  const isTeacher = user?.role === 'teacher'
  const studentId = '1' // For demo, in real app this comes from auth

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {isTeacher ? (
                <>
                  {currentView === 'all' && (
                    <div className="px-4 lg:px-6 space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle><h1 className="text-xl font-bold">Minden igazolás - 13.F</h1></CardTitle>
                          <CardDescription className="flex items-center justify-between">
                            <span>Osztályfőnöki nézet</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <DataTable columns={columns} data={mockIgazolasok} />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  {currentView === 'students' && (
                    <div className="px-4 lg:px-6">
                      <StudentsManagementView />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {currentView === 'igazolasok' && (
                    <div className="px-4 lg:px-6">
                      <StudentTableView studentId={studentId} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
