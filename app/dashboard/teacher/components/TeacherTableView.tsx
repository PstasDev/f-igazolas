'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '../data-table';
import { createColumns } from '../columns';
import { apiClient } from '@/lib/api';
import { Igazolas } from '@/lib/types';
import { toast } from 'sonner';
import { FTVLoadingState } from '@/components/ui/ftv-loading-state';
import { FTVSyncStatus } from '@/components/ui/ftv-sync-status';
import { mapApiResponseToPeriods } from '@/lib/periods';
import { useFTVSync } from '@/hooks/use-ftv-sync';

interface TeacherTableViewProps {
  filter: 'all' | 'pending' | 'approved' | 'rejected';
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
  
  // Map allapot to the new status structure
  const allapot = igazolas.allapot;
  
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
    status: igazolas.megjegyzes_diak || igazolas.megjegyzes || 'Nincs megjegyzés',
    imageUrl: igazolas.imgDriveURL || '',
    imgDriveURL: igazolas.imgDriveURL || undefined,
    bkk_verification: igazolas.bkk_verification || undefined,
    teacherNote: igazolas.megjegyzes_tanar || '',
    submittedAt: igazolas.rogzites_datuma,
    allapot: allapot,
    fromFTV: igazolas.ftv || false,
    minutesBefore: igazolas.diak_extra_ido_elotte || 0,
    minutesAfter: igazolas.diak_extra_ido_utana || 0,
  };
}

export function TeacherTableView({ filter }: TeacherTableViewProps) {
  // Use the FTV sync hook for optimized data loading
  const {
    data: allIgazolasok,
    isLoading,
    isSyncing,
    metadata,
    syncNow,
  } = useFTVSync({
    fetchFunction: (mode) => apiClient.listIgazolas(mode),
    autoSync: true,
  });

  // Filter based on status
  const igazolasok = useMemo(() => {
    if (filter === 'pending') {
      return allIgazolasok.filter(i => i.allapot === 'Függőben');
    } else if (filter === 'approved') {
      return allIgazolasok.filter(i => i.allapot === 'Elfogadva');
    } else if (filter === 'rejected') {
      return allIgazolasok.filter(i => i.allapot === 'Elutasítva');
    }
    return allIgazolasok;
  }, [allIgazolasok, filter]);

  // Local state for optimistic updates
  const [localIgazolasok, setLocalIgazolasok] = useState<Igazolas[]>([]);

  // Sync local state with filtered data
  useEffect(() => {
    setLocalIgazolasok(igazolasok);
  }, [igazolasok]);

  const handleApprove = async (id: string) => {
    try {
      // Optimistic update - update state immediately
      setLocalIgazolasok(prevIgazolasok => 
        prevIgazolasok.map(igazolas => 
          igazolas.id.toString() === id 
            ? { ...igazolas, allapot: 'Elfogadva' as const } 
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), { action: 'Elfogadva' });
      toast.success('Igazolás jóváhagyva');
    } catch (error) {
      console.error('Failed to approve igazolás:', error);
      toast.error('Hiba történt az igazolás jóváhagyásakor');
      
      // Revert optimistic update on error
      setLocalIgazolasok(igazolasok);
    }
  };

  const handleReject = async (id: string) => {
    try {
      // Optimistic update - update state immediately
      setLocalIgazolasok(prevIgazolasok => 
        prevIgazolasok.map(igazolas => 
          igazolas.id.toString() === id 
            ? { ...igazolas, allapot: 'Elutasítva' as const } 
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), { action: 'Elutasítva' });
      toast.success('Igazolás elutasítva');
    } catch (error) {
      console.error('Failed to reject igazolás:', error);
      toast.error('Hiba történt az igazolás elutasításakor');
      
      // Revert optimistic update on error
      setLocalIgazolasok(igazolasok);
    }
  };

  const handleSetPending = async (id: string) => {
    try {
      // Optimistic update - update state immediately
      setLocalIgazolasok(prevIgazolasok => 
        prevIgazolasok.map(igazolas => 
          igazolas.id.toString() === id 
            ? { ...igazolas, allapot: 'Függőben' as const } 
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), { action: 'Függőben' });
      toast.success('Igazolás státusza visszaállítva függőben állapotra');
    } catch (error) {
      console.error('Failed to set pending:', error);
      toast.error('Hiba történt a státusz módosításakor');
      
      // Revert optimistic update on error
      setLocalIgazolasok(igazolasok);
    }
  };

  // Handle optimistic updates for the data table
  const handleOptimisticUpdate = useCallback((id: string, newAllapot: string) => {
    setLocalIgazolasok(prevIgazolasok => 
      prevIgazolasok.map(igazolas => 
        igazolas.id.toString() === id 
          ? { ...igazolas, allapot: newAllapot as 'Függőben' | 'Elfogadva' | 'Elutasítva' } 
          : igazolas
      )
    );
  }, []);

  // Create columns with action handlers
  const columns = createColumns({
    onApprove: handleApprove,
    onReject: handleReject,
    onSetPending: handleSetPending,
  });

  const getTitle = () => {
    switch (filter) {
      case 'pending': return 'Ellenőrzésre váró igazolások';
      case 'approved': return 'Jóváhagyott igazolások';
      case 'rejected': return 'Elutasított igazolások';
      default: return 'Összes igazolás';
    }
  };

  const getDescription = () => {
    switch (filter) {
      case 'pending': return 'Jóváhagyásra váró igazolások listája';
      case 'approved': return 'Elfogadott igazolások listája';
      case 'rejected': return 'Elutasított igazolások listája';
      default: return 'Az összes beküldött igazolás';
    }
  };

  // Map data to table format
  const tableData = localIgazolasok.map(mapIgazolasToTableData);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle><h1 className="text-xl">{getTitle()}</h1></CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4">
            <FTVLoadingState 
              variant="sync"
              title="Igazolások betöltése"
              description="Gyors betöltés cache-elt adatokkal. Háttérben szinkronizálás folyik..."
            />
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={tableData} 
            onDataChange={syncNow} 
            onOptimisticUpdate={handleOptimisticUpdate}
            ftvSyncStatus={
              metadata ? (
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
