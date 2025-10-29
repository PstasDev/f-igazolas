'use client';

import { useState, useEffect } from 'react';
import { useRole } from '@/app/context/RoleContext';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { StudentSidebar } from '@/app/dashboard/student/components/StudentSidebar';
import { DashboardHeader } from '@/app/dashboard/student/components/DashboardHeader';
import { StatsCards } from './components/StatsCards';
import BKKGTFSTest from './components/BKKGTFSTest';
import { StudentTableView } from '@/app/dashboard/student/components/StudentTableView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

interface StudentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export default function StudentDashboard() {
  const { user } = useRole();
  const [selectedView, setSelectedView] = useState<'overview' | 'pending' | 'approved' | 'rejected' | 'all' | 'bkk-test'>('overview');
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  
  // For demo purposes, use a fixed student ID (in real app, this would come from auth)
  const studentId = '1';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const igazolasok = await apiClient.getMyIgazolas();
        
        const newStats: StudentStats = {
          total: igazolasok.length,
          approved: igazolasok.filter(i => i.allapot === 'Elfogadva').length,
          pending: igazolasok.filter(i => i.allapot === 'Függőben').length,
          rejected: igazolasok.filter(i => i.allapot === 'Elutasítva').length,
        };

        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [studentId]);

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '280px',
          '--header-height': '60px',
        } as React.CSSProperties
      }
    >
      <StudentSidebar onViewChange={setSelectedView} currentView={selectedView} stats={stats} />
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
                      <li>Függőben - Ellenőrzésre váró igazolások</li>
                      <li>Jóváhagyott - Elfogadott igazolások</li>
                      <li>Elutasított - Elutasított igazolások</li>
                      <li>Összes igazolás - Teljes lista és státusz követés</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {selectedView === 'pending' && (
            <StudentTableView studentId={studentId} filter="pending" />
          )}
          {selectedView === 'approved' && (
            <StudentTableView studentId={studentId} filter="approved" />
          )}
          {selectedView === 'rejected' && (
            <StudentTableView studentId={studentId} filter="rejected" />
          )}
          {selectedView === 'all' && (
            <StudentTableView studentId={studentId} filter="all" />
          )}
          {selectedView === 'bkk-test' && (
            <BKKGTFSTest />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
