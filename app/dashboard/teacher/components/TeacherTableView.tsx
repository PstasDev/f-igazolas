'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '../data-table';
import { createColumns } from '../columns';
import { apiClient } from '@/lib/api';
import { Igazolas } from '@/lib/types';
import { toast } from 'sonner';
import { FTVLoadingState } from '@/components/ui/ftv-loading-state';
import { mapApiResponseToPeriods } from '@/lib/periods';

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
  const [igazolasok, setIgazolasok] = useState<Igazolas[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIgazolasok = useCallback(async () => {
    try {
      setIsLoading(true);
      // Teachers should see all igazolások from their class, not their own
      const data = await apiClient.listIgazolas();
      
      // Filter based on status
      let filtered = data;
      if (filter === 'pending') {
        filtered = data.filter(i => i.allapot === 'Függőben');
      } else if (filter === 'approved') {
        filtered = data.filter(i => i.allapot === 'Elfogadva');
      } else if (filter === 'rejected') {
        filtered = data.filter(i => i.allapot === 'Elutasítva');
      }
      
      setIgazolasok(filtered);
    } catch (error) {
      console.error('Failed to fetch igazolások:', error);
      toast.error('Hiba történt az igazolások betöltésekor');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchIgazolasok();
  }, [fetchIgazolasok]);

  const handleApprove = async (id: string) => {
    try {
      // Optimistic update - update state immediately
      setIgazolasok(prevIgazolasok => 
        prevIgazolasok.map(igazolas => 
          igazolas.id.toString() === id 
            ? { ...igazolas, allapot: 'Elfogadva' } 
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), { action: 'Elfogadva' });
      toast.success('Igazolás jóváhagyva');
      
      // No need to refetch - optimistic update already applied
    } catch (error) {
      console.error('Failed to approve igazolás:', error);
      toast.error('Hiba történt az igazolás jóváhagyásakor');
      
      // Revert optimistic update on error and refetch to get correct state
      await fetchIgazolasok();
    }
  };

  const handleReject = async (id: string) => {
    try {
      // Optimistic update - update state immediately
      setIgazolasok(prevIgazolasok => 
        prevIgazolasok.map(igazolas => 
          igazolas.id.toString() === id 
            ? { ...igazolas, allapot: 'Elutasítva' } 
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), { action: 'Elutasítva' });
      toast.success('Igazolás elutasítva');
      
      // No need to refetch - optimistic update already applied
    } catch (error) {
      console.error('Failed to reject igazolás:', error);
      toast.error('Hiba történt az igazolás elutasításakor');
      
      // Revert optimistic update on error and refetch to get correct state
      await fetchIgazolasok();
    }
  };

  const handleSetPending = async (id: string) => {
    try {
      // Optimistic update - update state immediately
      setIgazolasok(prevIgazolasok => 
        prevIgazolasok.map(igazolas => 
          igazolas.id.toString() === id 
            ? { ...igazolas, allapot: 'Függőben' } 
            : igazolas
        )
      );

      await apiClient.quickActionIgazolas(parseInt(id), { action: 'Függőben' });
      toast.success('Igazolás státusza visszaállítva függőben állapotra');
      
      // No need to refetch - optimistic update already applied
    } catch (error) {
      console.error('Failed to set pending:', error);
      toast.error('Hiba történt a státusz módosításakor');
      
      // Revert optimistic update on error and refetch to get correct state
      await fetchIgazolasok();
    }
  };

  // Handle optimistic updates for the data table
  const handleOptimisticUpdate = useCallback((id: string, newAllapot: string) => {
    setIgazolasok(prevIgazolasok => 
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
  const tableData = igazolasok.map(mapIgazolasToTableData);

  return (
    <Card>
      <CardHeader>
        <CardTitle><h1 className="text-xl">{getTitle()}</h1></CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4">
            <FTVLoadingState 
              variant="sync"
              title="Igazolások betöltése"
              description="Szinkronizálás az FTV Sync-el. Ez eltarthat egy darabig, kérjük ne frissítse az oldalt."
            />
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={tableData} 
            onDataChange={fetchIgazolasok} 
            onOptimisticUpdate={handleOptimisticUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
}
