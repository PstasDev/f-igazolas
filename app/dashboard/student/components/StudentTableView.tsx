'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '../data-table';
import { studentColumns } from '../columns';
import { apiClient } from '@/lib/api';
import { Igazolas } from '@/lib/types';
import { toast } from 'sonner';
import { FTVLoadingState } from '@/components/ui/ftv-loading-state';
import { mapApiResponseToPeriods } from '@/lib/periods';

interface StudentTableViewProps {
  studentId: string;
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

export function StudentTableView({ studentId, filter = 'all' }: StudentTableViewProps) {
  const [igazolasok, setIgazolasok] = useState<Igazolas[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIgazolasok = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getMyIgazolas();
        setIgazolasok(data);
      } catch (error) {
        console.error('Failed to fetch igazolások:', error);
        toast.error('Hiba történt az igazolások betöltésekor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIgazolasok();
  }, [studentId]);

  // Filter data based on the filter prop
  const filteredIgazolasok = igazolasok.filter(igazolas => {
    if (filter === 'all') return true;
    if (filter === 'pending') return igazolas.allapot === 'Függőben';
    if (filter === 'approved') return igazolas.allapot === 'Elfogadva';
    if (filter === 'rejected') return igazolas.allapot === 'Elutasítva';
    return true;
  });

  // Map data to table format
  const tableData = filteredIgazolasok.map(mapIgazolasToTableData);

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
        <CardTitle><h1 className='text-xl'>{getFilterTitle()}</h1></CardTitle>
        <CardDescription>{getFilterDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4">
            <FTVLoadingState 
              variant="default"
              title="Igazolásaid betöltése"
              description="Adatok betöltése az FTV rendszerből. Kérjük, várjon..."
            />
          </div>
        ) : (
          <DataTable columns={studentColumns} data={tableData} />
        )}
      </CardContent>
    </Card>
  );
}
