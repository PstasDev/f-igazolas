'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle2, Users } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

interface TeacherStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalHours: number;
  totalStudents: number;
}

export function TeacherStatsCards() {
  const [stats, setStats] = useState<TeacherStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalHours: 0,
    totalStudents: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const [igazolasok, profiles] = await Promise.all([
          apiClient.listIgazolas(),
          apiClient.listProfiles(),
        ]);

        const calculatedStats: TeacherStats = {
          total: igazolasok.length,
          approved: igazolasok.filter(i => i.allapot === 'elfogadva').length,
          pending: igazolasok.filter(i => 
            i.allapot === 'fuggohiany' || i.allapot === 'feldolgozas_alatt'
          ).length,
          rejected: igazolasok.filter(i => i.allapot === 'elutasitva').length,
          totalHours: igazolasok.reduce((sum, i) => {
            const start = new Date(i.eleje);
            const end = new Date(i.vege);
            const hours = Math.abs(end.getTime() - start.getTime()) / 36e5;
            return sum + hours;
          }, 0),
          totalStudents: profiles.length,
        };

        setStats(calculatedStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0;

  const statCards = [
    {
      title: 'Összes igazolás',
      value: stats.total.toString(),
      description: `${Math.round(stats.totalHours)} óra összesen`,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Jóváhagyott',
      value: stats.approved.toString(),
      description: `Az összes ${approvalRate}%-a`,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Ellenőrzésre vár',
      value: stats.pending.toString(),
      description: stats.rejected > 0 ? `${stats.rejected} elutasítva` : 'Nincs elutasítva',
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Diákok',
      value: stats.totalStudents.toString(),
      description: 'Osztály',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex justify-center items-center py-8">
              <Spinner />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
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
