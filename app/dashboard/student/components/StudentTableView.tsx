'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '../data-table';
import { studentColumns } from '../columns';
import { apiClient } from '@/lib/api';
import { Igazolas } from '@/lib/types';
import { FTVLoadingState } from '@/components/ui/ftv-loading-state';
import { FTVSyncStatus } from '@/components/ui/ftv-sync-status';
import { mapApiResponseToPeriods } from '@/lib/periods';
import { useFTVSync } from '@/hooks/use-ftv-sync';

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

  useEffect(() => {
    const checkFtvRegistration = async () => {
      try {
        const profile = await apiClient.getMyProfile();
        setIsFtvRegistered(profile.ftv_registered ?? false);
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
  const igazolasok = useMemo(() => {
    if (filter === 'pending') return allIgazolasok.filter(i => i.allapot === 'Függőben');
    if (filter === 'approved') return allIgazolasok.filter(i => i.allapot === 'Elfogadva');
    if (filter === 'rejected') return allIgazolasok.filter(i => i.allapot === 'Elutasítva');
    return allIgazolasok;
  }, [allIgazolasok, filter]);

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
    switch (filter) {
      case 'pending': return 'Ellenőrzésre váró igazolások';
      case 'approved': return 'Osztályfőnök által elfogadott igazolások';
      case 'rejected': return 'Osztályfőnök által elutasított igazolások';
      default: return 'Az összes beküldött igazolásod';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle><h1 className='text-xl'>{getFilterTitle()}</h1></CardTitle>
            <CardDescription>{getFilterDescription()}</CardDescription>
          </div>
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
