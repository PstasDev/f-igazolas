'use client';

import { useState } from 'react';
import { useRole } from '@/app/context/RoleContext';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { StudentSidebar } from '@/app/dashboard/student/components/StudentSidebar';
import { DashboardHeader } from '@/app/dashboard/student/components/DashboardHeader';
import { StatsCards } from '@/app/dashboard/student/components/StatsCards';
import { StudentTableView } from '@/app/dashboard/student/components/StudentTableView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentDashboard() {
  const { user } = useRole();
  const [selectedView, setSelectedView] = useState<'overview' | 'igazolasok'>('overview');
  
  // For demo purposes, use a fixed student ID (in real app, this would come from auth)
  const studentId = '1';

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '280px',
          '--header-height': '60px',
        } as React.CSSProperties
      }
    >
      <StudentSidebar onViewChange={setSelectedView} currentView={selectedView} />
      <SidebarInset>
        <DashboardHeader userName={user?.name || ''} userRole="Diák" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {selectedView === 'overview' && (
            <div className="space-y-4">
              <StatsCards studentId={studentId} />
              <Card>
                <CardHeader>
                  <CardTitle>Üdvözöllek!</CardTitle>
                  <CardDescription>Itt kezelheted az igazolásaidat</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">Mit tehetsz itt:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Igazolásaim - Megtekintheted az összes beküldött igazolást</li>
                      <li>Státusz követés - Lásd, hogy az osztályfőnök jóváhagyta-e az igazolásaidat</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {selectedView === 'igazolasok' && (
            <StudentTableView studentId={studentId} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
