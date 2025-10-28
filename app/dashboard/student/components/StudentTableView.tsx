'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '../data-table';
import { studentColumns } from '../columns';
import { apiClient } from '@/lib/api';
import { Igazolas } from '@/lib/types';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface StudentTableViewProps {
  studentId: string;
}

// Helper function to map Igazolas to the format expected by columns
function mapIgazolasToTableData(igazolas: Igazolas) {
  // Calculate hours array from start and end time
  const start = new Date(igazolas.eleje);
  const end = new Date(igazolas.vege);
  
  // Extract hours (assuming school day starts at 8:00 AM = hour 0)
  const startHour = start.getHours();
  const endHour = end.getHours();
  
  // Generate hours array (0-8 representing school hours)
  const hours: number[] = [];
  for (let h = Math.max(0, startHour - 8); h <= Math.min(8, endHour - 8); h++) {
    if (h >= 0 && h <= 8) {
      hours.push(h);
    }
  }
  
  return {
    id: igazolas.id.toString(),
    studentId: igazolas.profile.user.id.toString(),
    studentName: `${igazolas.profile.user.first_name} ${igazolas.profile.user.last_name}`,
    studentClass: igazolas.profile.osztalyom?.nev || 'N/A',
    type: igazolas.tipus.nev,
    date: new Date(igazolas.eleje).toLocaleDateString('hu-HU'),
    hours: hours,
    status: igazolas.megjegyzes_diak || igazolas.megjegyzes || 'Nincs megjegyzés',
    imageUrl: igazolas.imgDriveURL || '',
    teacherNote: igazolas.megjegyzes_tanar || '',
    submittedAt: igazolas.rogzites_datuma,
    allapot: igazolas.allapot,
    fromFTV: igazolas.ftv || false,
    minutesBefore: igazolas.diak_extra_ido_elotte || 0,
    minutesAfter: igazolas.diak_extra_ido_utana || 0,
  };
}

export function StudentTableView({ studentId }: StudentTableViewProps) {
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

  // Map data to table format
  const tableData = igazolasok.map(mapIgazolasToTableData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Igazolásaim</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner />
          </div>
        ) : (
          <DataTable columns={studentColumns} data={tableData} />
        )}
      </CardContent>
    </Card>
  );
}
