'use client';

import { useEffect, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TeacherDashboard() {
  const { user } = useRole();
  const [selectedView, setSelectedView] = useState<'overview' | 'pending' | 'approved' | 'all' | 'students' | 'create' | 'periods'>('overview');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const teacherClasses = user?.profile?.osztalyaim || [];
  const selectedClass = teacherClasses.find((osztaly) => osztaly.id === selectedClassId) || teacherClasses[0] || user?.profile?.osztalyom;

  useEffect(() => {
    if (teacherClasses.length && !teacherClasses.some((osztaly) => osztaly.id === selectedClassId)) {
      setSelectedClassId(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClassId]);

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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-w-0 overflow-hidden">
          {teacherClasses.length > 1 && selectedClass && (
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-medium">Kezelt osztály</p>
              <Select value={String(selectedClass.id)} onValueChange={(value) => setSelectedClassId(Number(value))}>
                <SelectTrigger aria-label="Kezelt osztály kiválasztása">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teacherClasses.map((osztaly) => (
                    <SelectItem key={osztaly.id} value={String(osztaly.id)}>{osztaly.nev}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {selectedView === 'overview' && (
            <div className="space-y-4">
              <TeacherStatsCards classId={selectedClass?.id} />
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
              <TeacherTableView key={selectedClass?.id} filter="all" classId={selectedClass?.id} isFClass={selectedClass?.tagozat === 'F'} />
            </div>
          )}
          {selectedView === 'pending' && (
            <TeacherTableView key={selectedClass?.id} filter="pending" classId={selectedClass?.id} isFClass={selectedClass?.tagozat === 'F'} />
          )}
          {selectedView === 'approved' && (
            <TeacherTableView key={selectedClass?.id} filter="approved" classId={selectedClass?.id} isFClass={selectedClass?.tagozat === 'F'} />
          )}
          {selectedView === 'all' && (
            <TeacherTableView key={selectedClass?.id} filter="all" classId={selectedClass?.id} isFClass={selectedClass?.tagozat === 'F'} />
          )}
          {selectedView === 'students' && (
            <StudentsManagementView key={selectedClass?.id} classId={selectedClass?.id} />
          )}
          {selectedView === 'create' && (
            <TeacherCreateIgazolasView key={selectedClass?.id} classId={selectedClass?.id} />
          )}
          {selectedView === 'periods' && selectedClass && (
            <PeriodConfiguration 
              classId={selectedClass.id} 
              className={selectedClass.nev}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
