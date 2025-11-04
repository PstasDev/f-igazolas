'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiClient } from '@/lib/api';
import { Igazolas } from '@/lib/types';
import { getIgazolasType, isMultiDayAbsence, buildCalendarGrid, getDayOfWeekShort } from '@/app/dashboard/types';
import { toast } from 'sonner';
import { FTVLoadingState } from '@/components/ui/ftv-loading-state';

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
      <div className="py-4">
        <FTVLoadingState 
          variant="details"
          title="Diák adatainak betöltése"
          description="Igazolások és statisztikák betöltése az FTV rendszerből. Kérjük, várjon..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Függőben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Igazolások története</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {igazolasok.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nincs még igazolás
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Dátum</TableHead>
                    <TableHead className="min-w-[140px]">Típus</TableHead>
                    <TableHead className="min-w-[200px]">Órarend</TableHead>
                    <TableHead className="min-w-[150px] max-w-[250px]">Megjegyzés</TableHead>
                    <TableHead className="min-w-[120px]">Státusz</TableHead>
                    <TableHead className="min-w-[100px]">Beküldve</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {igazolasok.map((igazolas) => {
                    const isMultiDay = isMultiDayAbsence(igazolas.eleje, igazolas.vege);
                    const startDate = new Date(igazolas.eleje);
                    const endDate = new Date(igazolas.vege);
                    
                    return (
                      <TableRow key={igazolas.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            {isMultiDay ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">
                                  {startDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-xs text-muted-foreground">→</span>
                                <span className="text-sm font-medium">
                                  {endDate.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm">
                                {startDate.toLocaleDateString('hu-HU')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const typeConfig = getIgazolasType(igazolas.tipus.nev);
                            return (
                              <Badge variant="outline" className={`${typeConfig.color} whitespace-nowrap`}>
                                <span className="mr-1.5">{typeConfig.emoji}</span>
                                {typeConfig.name}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {isMultiDay ? (
                            <TooltipProvider>
                              <div className="flex flex-col gap-0.5 w-fit">
                                {/* Day headers */}
                                <div className="grid grid-cols-7 gap-0.5">
                                  {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => (
                                    <div
                                      key={dayIndex}
                                      className="flex items-center justify-center text-[9px] font-semibold text-muted-foreground uppercase h-4 w-7"
                                    >
                                      {getDayOfWeekShort(dayIndex)}
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Calendar weeks */}
                                {buildCalendarGrid(igazolas.eleje, igazolas.vege).map((week, weekIndex) => (
                                  <div key={weekIndex} className="grid grid-cols-7 gap-0.5">
                                    {week.map((day, dayIndex) => {
                                      let bgColor = "period-inactive";
                                      let glowColor = "";
                                      let tooltipText = `${day.date.toLocaleDateString('hu-HU', { weekday: 'long' })}\n${day.date.toLocaleDateString('hu-HU')}`;
                                      
                                      if (day.isInRange) {
                                        if (igazolas.allapot === 'Függőben') {
                                          bgColor = "period-pending";
                                          glowColor = "period-glow-blue";
                                          tooltipText += "\nEllenőrzésre vár";
                                        } else if (igazolas.allapot === 'Elfogadva') {
                                          bgColor = "period-approved";
                                          glowColor = "period-glow-green";
                                          tooltipText += "\nJóváhagyva";
                                        } else if (igazolas.allapot === 'Elutasítva') {
                                          bgColor = "period-rejected";
                                          glowColor = "period-glow-red";
                                          tooltipText += "\nElutasítva";
                                        }
                                      } else {
                                        tooltipText = `${day.date.toLocaleDateString('hu-HU', { weekday: 'long' })}\n${day.date.toLocaleDateString('hu-HU')}\nNem érintett`;
                                      }
                                      
                                      return (
                                        <Tooltip key={dayIndex}>
                                          <TooltipTrigger asChild>
                                            <span
                                              className={`inline-flex items-center justify-center w-7 h-7 text-[10px] font-bold rounded-full cursor-help transition-all duration-300 ease-in-out transform ${bgColor} ${day.isInRange ? glowColor : ''} hover:scale-110`}
                                            >
                                              {day.dayOfMonth}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-600 dark:border-slate-400 font-medium text-xs whitespace-pre-line max-w-xs shadow-lg">
                                            {tooltipText}
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </TooltipProvider>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {getHoursDisplay(igazolas.eleje, igazolas.vege)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          <div className="text-xs text-muted-foreground line-clamp-2" title={igazolas.megjegyzes_diak || igazolas.megjegyzes || 'Nincs megjegyzés'}>
                            {igazolas.megjegyzes_diak || igazolas.megjegyzes || 'Nincs megjegyzés'}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(igazolas.allapot)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(igazolas.rogzites_datuma).toLocaleDateString('hu-HU')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
