'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '../data-table';
import { studentColumns } from '../columns';
import { apiClient } from '@/lib/api';
import { Igazolas, TanevRendje } from '@/lib/types';
import { FTVLoadingState } from '@/components/ui/ftv-loading-state';
import { FTVSyncStatus } from '@/components/ui/ftv-sync-status';
import { mapApiResponseToPeriods } from '@/lib/periods';
import { useFTVSync } from '@/hooks/use-ftv-sync';
import { isAttendanceRequired } from '@/lib/attendance-utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface StudentTableViewProps {
  studentId?: string;
  filter?: 'all' | 'pending' | 'approved' | 'rejected';
}

// Helper function to map Igazolas to the format expected by columns
function mapIgazolasToTableData(igazolas: Igazolas) {
  // Use the new period calculation logic
  const { originalPeriods, correctedPeriods } = mapApiResponseToPeriods(
    igazolas.eleje,
    igazolas.vege,
    igazolas.diak_extra_ido_elotte,
    igazolas.diak_extra_ido_utana
  );
  
  return {
    id: igazolas.id.toString(),
    studentId: igazolas.profile.user.id.toString(),
    studentName: `${igazolas.profile.user.last_name} ${igazolas.profile.user.first_name}`,
    studentClass: igazolas.profile.osztalyom?.nev || 'N/A',
    type: igazolas.tipus.nev,
    date: new Date(igazolas.eleje).toLocaleDateString('hu-HU'),
    startDate: igazolas.eleje,
    endDate: igazolas.vege,
    hours: originalPeriods,
    correctedHours: correctedPeriods,
    status: igazolas.allapot,
    reason: igazolas.megjegyzes_diak || igazolas.megjegyzes || 'Nincs megjegyzés',
    imageUrl: igazolas.imgDriveURL || '',
    imgDriveURL: igazolas.imgDriveURL || undefined,
    bkk_verification: igazolas.bkk_verification || undefined,
    teacherNote: igazolas.megjegyzes_tanar || '',
    submittedAt: igazolas.rogzites_datuma,
    allapot: igazolas.allapot,
    fromFTV: igazolas.ftv || false,
    minutesBefore: igazolas.diak_extra_ido_elotte || 0,
    minutesAfter: igazolas.diak_extra_ido_utana || 0,
  };
}

export function StudentTableView({ filter = 'all' }: StudentTableViewProps) {
  // Check if user is registered in FTV system
  const [isFtvRegistered, setIsFtvRegistered] = useState<boolean | null>(null);
  const [schedule, setSchedule] = useState<TanevRendje | null>(null);
  const [userProfile, setUserProfile] = useState<{ osztalyom?: { id: number; nev: string; tagozat: string; kezdes_eve: number } } | null>(null);

  useEffect(() => {
    const checkFtvRegistration = async () => {
      try {
        const profile = await apiClient.getMyProfile();
        setIsFtvRegistered(profile.ftv_registered ?? false);
        setUserProfile(profile);
        
        // Load schedule for filtering
        const now = new Date();
        const currentYear = now.getFullYear();
        const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
        const fromDate = `${startYear}-09-01`;
        const toDate = `${startYear + 1}-08-31`;
        
        const scheduleData = await apiClient.getTanevRendje(fromDate, toDate);
        setSchedule(scheduleData);
      } catch (error) {
        console.error('Failed to check FTV registration:', error);
        setIsFtvRegistered(false);
      }
    };

    checkFtvRegistration();
  }, []);

  // Use the FTV sync hook for optimized data loading
  // Only enable autoSync if user is FTV registered
  const {
    data: allIgazolasok,
    isLoading,
    isSyncing,
    metadata,
    syncNow,
  } = useFTVSync({
    fetchFunction: (mode) => apiClient.getMyIgazolas(mode),
    autoSync: isFtvRegistered ?? false, // Only auto-sync if FTV registered
    checkFtvRegistration: true, // Enable FTV registration check in the hook
    syncType: 'user', // Students use user-level sync
  });

  // Filter data based on the filter prop
  // Also filters out igazolások that fall entirely on non-attendance days
  const igazolasok = useMemo(() => {
    let filtered = allIgazolasok;
    
    // Filter out igazolások that fall entirely on non-attendance days
    if (schedule && userProfile?.osztalyom) {
      filtered = filtered.filter(i => {
        const start = new Date(i.eleje);
        const end = new Date(i.vege);
        
        // Check if at least one day requires attendance
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          if (isAttendanceRequired(dateStr, userProfile.osztalyom, schedule)) {
            return true; // Has at least one attendance-required day
          }
        }
        
        return false; // All days are non-attendance days, filter it out
      });
    }
    
    // Apply status filter
    if (filter === 'pending') filtered = filtered.filter(i => i.allapot === 'Függőben');
    if (filter === 'approved') filtered = filtered.filter(i => i.allapot === 'Elfogadva');
    if (filter === 'rejected') filtered = filtered.filter(i => i.allapot === 'Elutasítva');
    
    return filtered;
  }, [allIgazolasok, filter, schedule, userProfile]);

  // Map data to table format
  const tableData = igazolasok.map(mapIgazolasToTableData);

  // Get filter-specific title and description
  const getFilterTitle = () => {
    switch (filter) {
      case 'pending': return 'Függőben lévő igazolások';
      case 'approved': return 'Jóváhagyott igazolások';
      case 'rejected': return 'Elutasított igazolások';
      default: return 'Igazolásaim';
    }
  };

  const getFilterDescription = () => {
    const baseDesc = (() => {
      switch (filter) {
        case 'pending': return 'Ellenőrzésre váró igazolások';
        case 'approved': return 'Osztályfőnök által elfogadott igazolások';
        case 'rejected': return 'Osztályfőnök által elutasított igazolások';
        default: return 'Az összes beküldött igazolásod';
      }
    })();
    
    if (schedule) {
      return (
        <>
          {baseDesc}
          <Badge variant="outline" className="ml-2 text-xs bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-900">
            Szünnapokra vonatkozó igazolások elrejtve
          </Badge>
        </>
      );
    }
    
    return baseDesc;
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle><h1 className='text-xl'>{getFilterTitle()}</h1></CardTitle>
          <CardDescription>
            {getFilterDescription()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4">
            {isFtvRegistered ? (
              <FTVLoadingState 
                variant="default"
                title="Igazolásaid betöltése"
                description="Gyors betöltés cache-elt adatokkal. Háttérben szinkronizálás folyik..."
              />
            ) : (
              <div className="flex items-center justify-center py-4">
                <div className="text-center text-muted-foreground">
                  Betöltés...
                </div>
              </div>
            )}
          </div>
        ) : (
          <DataTable 
            columns={studentColumns} 
            data={tableData}
            ftvSyncStatus={
              isFtvRegistered && metadata ? (
                <FTVSyncStatus
                  metadata={metadata}
                  isSyncing={isSyncing}
                  onSyncNow={syncNow}
                  compact={false}
                />
              ) : null
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
