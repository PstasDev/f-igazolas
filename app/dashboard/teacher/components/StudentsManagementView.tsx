'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Plus, 
  UserPlus, 
  Search,
  Download,
  RefreshCw,
  Trash2,
  ChevronDown
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StudentIgazolasokHistory } from './StudentIgazolasokHistory';
import { apiClient } from '@/lib/api';
import { DiakjaSignle, DiakjaCreateRequest } from '@/lib/types';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import * as XLSX from 'xlsx';

interface StudentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalHours: number;
}

export function StudentsManagementView() {
  const [selectedStudent, setSelectedStudent] = useState<DiakjaSignle | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [students, setStudents] = useState<DiakjaSignle[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<DiakjaSignle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'none'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // New student form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [newStudents, setNewStudents] = useState<DiakjaCreateRequest[]>([
    { first_name: '', last_name: '', email: '' }
  ]);

  // Bulk operations - TODO: Implement bulk operations in future
  // const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const studentsData = await apiClient.getDiakjaim();
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Hiba történt a diákok betöltésekor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on search and status
  useEffect(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => {
        const pendingCount = student.igazolasok.filter(i => i.allapot === 'Függőben').length;
        const totalCount = student.igazolasok.length;

        switch (statusFilter) {
          case 'pending':
            return pendingCount > 0;
          case 'active':
            return totalCount > 0;
          case 'none':
            return totalCount === 0;
          default:
            return true;
        }
      });
    }

    // Date range filter - filter students by their igazolások dates
    if (dateFrom || dateTo) {
      filtered = filtered.filter(student => {
        if (student.igazolasok.length === 0) return false;
        
        return student.igazolasok.some(igazolas => {
          const igazolasDate = new Date(igazolas.rogzites_datuma);
          let isValid = true;
          
          if (dateFrom) {
            const fromDate = new Date(dateFrom);
            isValid = isValid && igazolasDate >= fromDate;
          }
          
          if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999); // Include the entire end date
            isValid = isValid && igazolasDate <= toDate;
          }
          
          return isValid;
        });
      });
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, statusFilter, dateFrom, dateTo]);

  const calculateStudentStats = (student: DiakjaSignle): StudentStats => {
    const igazolasok = student.igazolasok;
    
    const totalHours = igazolasok.reduce((sum, i) => {
      const start = new Date(i.eleje);
      const end = new Date(i.vege);
      const hours = Math.abs(end.getTime() - start.getTime()) / 36e5;
      return sum + hours;
    }, 0);

    return {
      total: igazolasok.length,
      pending: igazolasok.filter(i => i.allapot === 'Függőben').length,
      approved: igazolasok.filter(i => i.allapot === 'Elfogadva').length,
      rejected: igazolasok.filter(i => i.allapot === 'Elutasítva').length,
      totalHours: Math.round(totalHours),
    };
  };

  const handleViewStudent = (student: DiakjaSignle) => {
    setSelectedStudent(student);
    setIsDetailOpen(true);
  };

  const handleAddStudent = () => {
    setNewStudents([{ first_name: '', last_name: '', email: '' }]);
    setIsAddDialogOpen(true);
  };

  const handleStudentInputChange = (index: number, field: keyof DiakjaCreateRequest, value: string) => {
    const updated = [...newStudents];
    updated[index] = { ...updated[index], [field]: value };
    setNewStudents(updated);
  };

  const handleAddStudentRow = () => {
    setNewStudents([...newStudents, { first_name: '', last_name: '', email: '' }]);
  };

  const handleRemoveStudentRow = (index: number) => {
    if (newStudents.length > 1) {
      const updated = newStudents.filter((_, i) => i !== index);
      setNewStudents(updated);
    }
  };

  const handleSubmitNewStudents = async () => {
    // Validate inputs
    const validStudents = newStudents.filter(student => 
      student.first_name.trim() && 
      student.last_name.trim() && 
      student.email.trim()
    );

    if (validStudents.length === 0) {
      toast.error('Legalább egy diákot ki kell tölteni!');
      return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validStudents.filter(student => !emailRegex.test(student.email));
    if (invalidEmails.length > 0) {
      toast.error('Érvénytelen email cím(ek) találhatók!');
      return;
    }

    try {
      setIsAddingStudents(true);
      const response = await apiClient.createDiakjaim(validStudents);
      
      if (response.created_count > 0) {
        toast.success(response.message);
        setIsAddDialogOpen(false);
        await fetchStudents(); // Refresh the list
      } else {
        toast.warning('Nem sikerült diákokat létrehozni');
      }

      if (response.failed_users.length > 0) {
        console.warn('Failed users:', response.failed_users);
        // Show detailed error messages
        response.failed_users.forEach((error, index) => {
          setTimeout(() => toast.error(`Hiba: ${error}`), index * 1000);
        });
      }
    } catch (error) {
      console.error('Failed to create students:', error);
      toast.error('Hiba történt a diákok létrehozásakor');
    } finally {
      setIsAddingStudents(false);
    }
  };

  const handleExportData = (format: 'csv' | 'tsv' | 'xlsx') => {
    const data = filteredStudents.map(student => {
      const stats = calculateStudentStats(student);
      return {
        'Vezetéknév': student.last_name,
        'Keresztnév': student.first_name,
        'Felhasználónév': student.username,
        'Email': student.email || '',
        'Összes igazolás': stats.total,
        'Függőben': stats.pending,
        'Jóváhagyva': stats.approved,
        'Elutasítva': stats.rejected,
        'Órák összesen': stats.totalHours
      };
    });

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      // Export as XLSX
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Diákok');
      XLSX.writeFile(wb, `diakok_${timestamp}.xlsx`);
    } else {
      // Export as CSV or TSV
      const separator = format === 'csv' ? ',' : '\t';
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(separator),
        ...data.map(row => headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape values containing separator, quotes, or newlines
          const stringValue = String(value);
          if (stringValue.includes(separator) || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(separator))
      ];

      const content = csvRows.join('\n');
      // Use UTF-8 BOM for proper encoding in Excel
      const bom = '\uFEFF';
      const blob = new Blob([bom + content], { 
        type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/tab-separated-values;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `diakok_${timestamp}.${format}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    toast.success(`Adatok exportálva ${format.toUpperCase()} formátumban!`);
  };

  const totalStats = {
    totalStudents: students.length,
    studentsWithPending: students.filter(s => s.igazolasok.some(i => i.allapot === 'Függőben')).length,
    totalIgazolasok: students.reduce((sum, s) => sum + s.igazolasok.length, 0),
    totalPendingIgazolasok: students.reduce((sum, s) => sum + s.igazolasok.filter(i => i.allapot === 'Függőben').length, 0),
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
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Összes diák</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{totalStats.studentsWithPending}</div>
            <p className="text-xs text-muted-foreground">Függőben lévő diák</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalStats.totalIgazolasok}</div>
            <p className="text-xs text-muted-foreground">Összes igazolás</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{totalStats.totalPendingIgazolasok}</div>
            <p className="text-xs text-muted-foreground">Függőben lévő igazolás</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list">Diákok listája</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStudents()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Frissítés
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportData('csv')}>
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('tsv')}>
                  Export TSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('xlsx')}>
                  Export XLSX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={handleAddStudent}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Diák hozzáadása
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Új diákok hozzáadása</DialogTitle>
                  <DialogDescription>
                    Adja meg az új diákok adatait. Az email címből automatikusan generálódik a felhasználónév.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {newStudents.map((student, index) => (
                    <div key={index} className="flex items-end gap-2 p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor={`lastName-${index}`}>Vezetéknév</Label>
                        <Input
                          id={`lastName-${index}`}
                          value={student.last_name}
                          onChange={(e) => handleStudentInputChange(index, 'last_name', e.target.value)}
                          placeholder="Kovács"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`firstName-${index}`}>Keresztnév</Label>
                        <Input
                          id={`firstName-${index}`}
                          value={student.first_name}
                          onChange={(e) => handleStudentInputChange(index, 'first_name', e.target.value)}
                          placeholder="János"
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`email-${index}`}>Email</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={student.email}
                          onChange={(e) => handleStudentInputChange(index, 'email', e.target.value)}
                          placeholder="kovacs.janos@example.com"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveStudentRow(index)}
                        disabled={newStudents.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddStudentRow}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    További diák hozzáadása
                  </Button>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Mégse
                  </Button>
                  <Button
                    onClick={handleSubmitNewStudents}
                    disabled={isAddingStudents}
                  >
                    {isAddingStudents && <Spinner className="mr-2 h-4 w-4" />}
                    Diákok létrehozása
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Keresés név, email vagy felhasználónév alapján..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Select 
                    value={statusFilter} 
                    onValueChange={(value: 'all' | 'active' | 'pending' | 'none') => setStatusFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Státusz szűrő" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Összes diák</SelectItem>
                      <SelectItem value="pending">Függőben lévő igazolással</SelectItem>
                      <SelectItem value="active">Van igazolása</SelectItem>
                      <SelectItem value="none">Nincs igazolása</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Igazolások ettől</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Igazolások eddig</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <CardTitle>Diákok kezelése</CardTitle>
              <CardDescription>
                Összesen: {filteredStudents.length} diák {searchTerm || statusFilter !== 'all' || dateFrom || dateTo ? `(${students.length} diákból szűrve)` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Név</TableHead>
                      <TableHead className="w-[120px]">Felhasználónév</TableHead>
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
                    {filteredStudents.map((student) => {
                      const stats = calculateStudentStats(student);
                      
                      return (
                        <TableRow key={student.id} className="hover:bg-accent/50">
                          <TableCell className="font-medium">
                            {student.last_name} {student.first_name}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {student.username}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.email || 'Nincs email'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{stats.total}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {stats.pending > 0 ? (
                              <Badge variant="warning">
                                {stats.pending}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {stats.approved > 0 ? (
                              <Badge variant="approved">
                                {stats.approved}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {stats.rejected > 0 ? (
                              <Badge variant="rejected">
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
                              onClick={() => handleViewStudent(student)}
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
        </TabsContent>
      </Tabs>

      {/* Student Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedStudent && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selectedStudent.last_name} {selectedStudent.first_name}
                </SheetTitle>
                <SheetDescription>
                  @{selectedStudent.username} • {selectedStudent.email || 'Nincs email'}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <StudentIgazolasokHistory studentId={selectedStudent.id.toString()} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
