'use client';

import { useState } from 'react';
import { useRole } from '@/app/context/RoleContext';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { TeacherSidebar } from '@/app/dashboard/teacher/components/TeacherSidebar';
import { DashboardHeader } from '@/app/dashboard/student/components/DashboardHeader';
import { TeacherStatsCards } from '@/app/dashboard/teacher/components/TeacherStatsCards';
import { TeacherTableView } from '@/app/dashboard/teacher/components/TeacherTableView';
import { StudentsManagementView } from '@/app/dashboard/teacher/components/StudentsManagementView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherDashboard() {
  const { user } = useRole();
  const [selectedView, setSelectedView] = useState<'overview' | 'pending' | 'approved' | 'all' | 'students'>('overview');

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '280px',
          '--header-height': '60px',
        } as React.CSSProperties
      }
    >
      <TeacherSidebar onViewChange={setSelectedView} currentView={selectedView} />
      <SidebarInset>
        <DashboardHeader userName={user?.name || ''} userRole="Osztályfőnök" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {selectedView === 'overview' && (
            <div className="space-y-4">
              <TeacherStatsCards />
              <Card>
                <CardHeader>
                  <CardTitle>Áttekintés</CardTitle>
                  <CardDescription>A legutóbbi igazolások és fontosabb statisztikák</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Válassz a menüből az igazolások kezeléséhez:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ellenőrzésre vár - Jóváhagyásra váró igazolások</li>
                      <li>Jóváhagyott - Elfogadott igazolások</li>
                      <li>Összes igazolás - Teljes lista</li>
                      <li>Diákok - Diákok kezelése és statisztikák</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              <TeacherTableView filter="all" />
            </div>
          )}
          {selectedView === 'pending' && (
            <TeacherTableView filter="pending" />
          )}
          {selectedView === 'approved' && (
            <TeacherTableView filter="approved" />
          )}
          {selectedView === 'all' && (
            <TeacherTableView filter="all" />
          )}
          {selectedView === 'students' && (
            <StudentsManagementView />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
