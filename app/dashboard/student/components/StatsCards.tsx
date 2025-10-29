'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { FTVLoadingState } from '@/components/ui/ftv-loading-state';

interface StatsCardsProps {
  studentId: string;
}

interface StudentStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalHours: number;
}

export function StatsCards({ studentId }: StatsCardsProps) {
  const [studentStats, setStudentStats] = useState<StudentStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalHours: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const igazolasok = await apiClient.getMyIgazolas();
        
        const stats: StudentStats = {
          total: igazolasok.length,
          approved: igazolasok.filter(i => i.allapot === 'Elfogadva').length,
          pending: igazolasok.filter(i => i.allapot === 'Függőben').length,
          rejected: igazolasok.filter(i => i.allapot === 'Elutasítva').length,
          totalHours: igazolasok.reduce((sum, i) => {
            const start = new Date(i.eleje);
            const end = new Date(i.vege);
            const hours = Math.abs(end.getTime() - start.getTime()) / 36e5;
            return sum + hours;
          }, 0),
        };

        setStudentStats(stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [studentId]);
  
  const stats = [
    {
      title: 'Összes igazolás',
      value: studentStats.total.toString(),
      description: `${Math.round(studentStats.totalHours)} óra összesen`,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Jóváhagyott',
      value: studentStats.approved.toString(),
      description: 'Elfogadva',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Függőben',
      value: studentStats.pending.toString(),
      description: 'Ellenőrzés alatt',
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Elutasítva',
      value: studentStats.rejected.toString(),
      description: studentStats.rejected > 0 ? 'Javítást igényel' : 'Nincs elutasítva',
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex justify-center items-center py-6">
              <FTVLoadingState 
                variant="default"
                title="Statisztikák betöltése"
                description="Betöltés az FTV rendszerből..."
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
