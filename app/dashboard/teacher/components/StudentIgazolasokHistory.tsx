'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Igazolas } from '@/lib/types';
import { getIgazolasType } from '@/app/dashboard/types';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface StudentIgazolasokHistoryProps {
  studentId: string;
}

interface StudentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalHours: number;
}

export function StudentIgazolasokHistory({ studentId }: StudentIgazolasokHistoryProps) {
  const [igazolasok, setIgazolasok] = useState<Igazolas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalHours: 0,
  });

  useEffect(() => {
    const fetchIgazolasok = async () => {
      try {
        setIsLoading(true);
        const allIgazolasok = await apiClient.listIgazolas();
        
        // Filter by student ID
        const studentIgazolasok = allIgazolasok.filter(
          i => i.profile.user.id.toString() === studentId
        );

        setIgazolasok(studentIgazolasok);

        // Calculate stats
        const totalHours = studentIgazolasok.reduce((sum, i) => {
          // Only count hours from igazolások where beleszamit is true (hivatalos mulasztás)
          if (i.tipus.beleszamit) {
            const start = new Date(i.eleje);
            const end = new Date(i.vege);
            const hours = Math.abs(end.getTime() - start.getTime()) / 36e5;
            return sum + hours;
          }
          return sum;
        }, 0);

        setStats({
          total: studentIgazolasok.length,
          pending: studentIgazolasok.filter(
            i => i.allapot === 'Függőben'
          ).length,
          approved: studentIgazolasok.filter(i => i.allapot === 'Elfogadva').length,
          rejected: studentIgazolasok.filter(i => i.allapot === 'Elutasítva').length,
          totalHours: Math.round(totalHours),
        });
      } catch (error) {
        console.error('Failed to fetch igazolások:', error);
        toast.error('Hiba történt az igazolások betöltésekor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIgazolasok();
  }, [studentId]);

  const getStatusBadge = (allapot: string) => {
    if (allapot === 'Elfogadva') {
      return <Badge variant="approved" className="flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" /> Jóváhagyva
      </Badge>;
    } else if (allapot === 'Elutasítva') {
      return <Badge variant="rejected" className="flex items-center gap-1 w-fit">
        <XCircle className="h-3 w-3" /> Elutasítva
      </Badge>;
    }
    return <Badge variant="warning" className="flex items-center gap-1 w-fit">
      <Clock className="h-3 w-3" /> Függőben
    </Badge>;
  };

  const getHoursFromDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startHour = startDate.getHours();
    const endHour = endDate.getHours();
    
    const hours: number[] = [];
    for (let h = Math.max(0, startHour - 8); h <= Math.min(8, endHour - 8); h++) {
      if (h >= 0 && h <= 8) {
        hours.push(h);
      }
    }
    return hours;
  };

  const getHoursDisplay = (start: string, end: string) => {
    const hours = getHoursFromDateRange(start, end);
    return hours.map(h => (
      <span
        key={h}
        className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      >
        {h}
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Összes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Függőben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jóváhagyva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Órák</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Igazolások története</CardTitle>
        </CardHeader>
        <CardContent>
          {igazolasok.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nincs még igazolás
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Típus</TableHead>
                  <TableHead>Órák</TableHead>
                  <TableHead>Megjegyzés</TableHead>
                  <TableHead>Státusz</TableHead>
                  <TableHead>Beküldve</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {igazolasok.map((igazolas) => (
                  <TableRow key={igazolas.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(igazolas.eleje).toLocaleDateString('hu-HU')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const typeConfig = getIgazolasType(igazolas.tipus.nev);
                        return (
                          <Badge variant="outline" className={typeConfig.color}>
                            <span className="mr-1.5">{typeConfig.emoji}</span>
                            {typeConfig.name}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getHoursDisplay(igazolas.eleje, igazolas.vege)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {igazolas.megjegyzes_diak || igazolas.megjegyzes || 'Nincs megjegyzés'}
                    </TableCell>
                    <TableCell>{getStatusBadge(igazolas.allapot)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(igazolas.rogzites_datuma).toLocaleDateString('hu-HU')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
