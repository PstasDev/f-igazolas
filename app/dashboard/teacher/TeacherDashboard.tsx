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
import { TeacherCreateIgazolasView } from '@/app/dashboard/teacher/components/TeacherCreateIgazolasView';
import { PeriodConfiguration } from '@/components/admin/PeriodConfiguration';

export default function TeacherDashboard() {
  const { user } = useRole();
  const [selectedView, setSelectedView] = useState<'overview' | 'pending' | 'approved' | 'all' | 'students' | 'create' | 'periods'>('overview');

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
              <div>
                <h2 className="text-lg font-semibold">Áttekintés</h2>
                <p className="text-sm text-muted-foreground mt-1">A legutóbbi igazolások és fontosabb statisztikák</p>
                <div className="text-sm text-muted-foreground mt-3">
                  <p className="mb-2">Válassz a menüből az igazolások kezeléséhez:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Ellenőrzésre vár - Jóváhagyásra váró igazolások</li>
                    <li>Jóváhagyott - Elfogadott igazolások</li>
                    <li>Összes igazolás - Teljes lista</li>
                    <li>Diákok - Diákok kezelése és statisztikák</li>
                  </ul>
                </div>
              </div>
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
          {selectedView === 'create' && (
            <TeacherCreateIgazolasView />
          )}
          {selectedView === 'periods' && user?.profile?.osztalyom && (
            <PeriodConfiguration 
              classId={user.profile.osztalyom.id} 
              className={user.profile.osztalyom.nev}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
