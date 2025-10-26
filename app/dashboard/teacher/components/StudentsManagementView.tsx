'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StudentIgazolasokHistory } from './StudentIgazolasokHistory';
import { apiClient } from '@/lib/api';
import { Profile } from '@/lib/types';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface StudentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalHours: number;
}

export function StudentsManagementView() {
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentStats, setStudentStats] = useState<Map<number, StudentStats>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [profilesData, igazolasokData] = await Promise.all([
          apiClient.listProfiles(),
          apiClient.listIgazolas(),
        ]);

        setProfiles(profilesData);

        // Calculate stats for each student
        const stats = new Map<number, StudentStats>();
        profilesData.forEach(profile => {
          const studentIgazolasok = igazolasokData.filter(
            i => i.profile.user.id === profile.user.id
          );

          const totalHours = studentIgazolasok.reduce((sum, i) => {
            const start = new Date(i.eleje);
            const end = new Date(i.vege);
            const hours = Math.abs(end.getTime() - start.getTime()) / 36e5;
            return sum + hours;
          }, 0);

          stats.set(profile.user.id, {
            total: studentIgazolasok.length,
            pending: studentIgazolasok.filter(
              i => i.allapot === 'fuggohiany' || i.allapot === 'feldolgozas_alatt'
            ).length,
            approved: studentIgazolasok.filter(i => i.allapot === 'elfogadva').length,
            rejected: studentIgazolasok.filter(i => i.allapot === 'elutasitva').length,
            totalHours: Math.round(totalHours),
          });
        });

        setStudentStats(stats);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Hiba történt az adatok betöltésekor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleViewStudent = (student: Profile) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Diákok kezelése</CardTitle>
          <CardDescription>Osztály létszám: {profiles.length} fő</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Név</TableHead>
                  <TableHead className="w-[100px]">Osztály</TableHead>
                  <TableHead className="w-[220px]">Email</TableHead>
                  <TableHead className="w-[100px]">Összes igazolás</TableHead>
                  <TableHead className="w-[100px]">Függőben</TableHead>
                  <TableHead className="w-[100px]">Jóváhagyva</TableHead>
                  <TableHead className="w-[100px]">Elutasítva</TableHead>
                  <TableHead className="w-[100px]">Órák összesen</TableHead>
                  <TableHead className="w-[80px]">Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => {
                  const stats = studentStats.get(profile.user.id) || {
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    totalHours: 0,
                  };
                  
                  return (
                    <TableRow key={profile.id} className="hover:bg-accent/50">
                      <TableCell className="font-medium">
                        {profile.user.first_name} {profile.user.last_name}
                      </TableCell>
                      <TableCell>{profile.osztalyom?.nev || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {profile.user.email || 'Nincs email'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{stats.total}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {stats.pending > 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            {stats.pending}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {stats.approved > 0 ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {stats.approved}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {stats.rejected > 0 ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {stats.rejected}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{stats.totalHours}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewStudent(profile)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedStudent && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selectedStudent.user.first_name} {selectedStudent.user.last_name}
                </SheetTitle>
                <SheetDescription>
                  {selectedStudent.osztalyom?.nev || 'N/A'} • {selectedStudent.user.email || 'Nincs email'}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <StudentIgazolasokHistory studentId={selectedStudent.user.id.toString()} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
