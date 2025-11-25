'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { IconPlus, IconAlertCircle, IconUsers, IconUser } from '@tabler/icons-react';

interface EligibleStudent {
  id: number;
  username: string;
  full_name: string;
  class_name: string;
  recent_absences: number;
}

interface IgazolasTipus {
  id: number;
  nev: string;
  leiras?: string;
}

export function TeacherCreateIgazolasView() {
  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [tipusok, setTipusok] = useState<IgazolasTipus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  
  // Form fields
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedTipus, setSelectedTipus] = useState<number | null>(null);
  const [eleje, setEleje] = useState('');
  const [vege, setVege] = useState('');
  const [megjegyzes, setMegjegyzes] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [studentsData, tipusokData] = await Promise.all([
          apiClient.getEligibleStudentsForIgazolas(),
          apiClient.listIgazolasTipus()
        ]);
        setStudents(studentsData as EligibleStudent[]);
        setTipusok(tipusokData as IgazolasTipus[]);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Nem sikerült betölteni az adatokat.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const validateForm = (): string | null => {
    if (mode === 'single' && !selectedStudent) {
      return 'Kérlek válassz ki egy diákot!';
    }
    if (mode === 'bulk' && selectedStudents.length === 0) {
      return 'Kérlek válassz ki legalább egy diákot!';
    }
    if (!selectedTipus) {
      return 'Kérlek válaszd ki az igazolás típusát!';
    }
    if (!eleje || !vege) {
      return 'Kérlek add meg az igazolás időtartamát!';
    }
    
    const elejeDate = new Date(eleje);
    const vegeDate = new Date(vege);
    if (elejeDate >= vegeDate) {
      return 'A végdátumnak későbbinek kell lennie a kezdődátumnál!';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSubmitting(true);

      if (mode === 'single') {
        const result = await apiClient.createIgazolasForStudent({
          student_id: selectedStudent,
          eleje: new Date(eleje).toISOString(),
          vege: new Date(vege).toISOString(),
          tipus: selectedTipus,
          megjegyzes_diak: megjegyzes || null
        });

        toast.success((result as { message: string }).message || 'Igazolás sikeresen létrehozva.');
      } else {
        const result = await apiClient.bulkCreateIgazolasForStudents({
          student_ids: selectedStudents,
          eleje: new Date(eleje).toISOString(),
          vege: new Date(vege).toISOString(),
          tipus: selectedTipus,
          megjegyzes_diak: megjegyzes || null
        });

        const data = result as { created: number; failed: number };
        toast.success(`${data.created} igazolás létrehozva${data.failed > 0 ? `, ${data.failed} sikertelen` : ''}.`);
      }

      // Reset form
      setSelectedStudent(null);
      setSelectedStudents([]);
      setSelectedTipus(null);
      setEleje('');
      setVege('');
      setMegjegyzes('');
      
    } catch (error) {
      console.error('Failed to create igazolás:', error);
      toast.error('Nem sikerült létrehozni az igazolást. Próbáld újra később.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Igazolás létrehozása diákoknak</CardTitle>
              <CardDescription>
                Igazolás rögzítése egy vagy több diák nevében (pl. osztálykirándulás, verseny)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={mode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('single')}
              >
                <IconUser className="mr-2 h-4 w-4" />
                Egyéni
              </Button>
              <Button
                variant={mode === 'bulk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('bulk')}
              >
                <IconUsers className="mr-2 h-4 w-4" />
                Tömeges
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>
              Az itt létrehozott igazolások automatikusan jóváhagyott állapotúak lesznek, és &ldquo;Tanár által rögzített&rdquo; jelöléssel láthatók.
            </AlertDescription>
          </Alert>

          {/* Student Selection */}
          {mode === 'single' ? (
            <div className="space-y-2">
              <Label htmlFor="student">Diák kiválasztása</Label>
              <Select
                value={selectedStudent?.toString() || ''}
                onValueChange={(value) => setSelectedStudent(parseInt(value))}
              >
                <SelectTrigger id="student">
                  <SelectValue placeholder="Válassz diákot..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.full_name}
                      {student.recent_absences > 0 && (
                        <Badge variant="outline" className="ml-2">
                          {student.recent_absences} hiányzás (30 nap)
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Diákok kiválasztása ({selectedStudents.length}/{students.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllStudents}
                >
                  {selectedStudents.length === students.length ? 'Kijelölés törlése' : 'Összes kijelölése'}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-1">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                    onClick={() => toggleStudentSelection(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                    />
                    <span className="flex-1">{student.full_name}</span>
                    {student.recent_absences > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {student.recent_absences}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Igazolás Type */}
          <div className="space-y-2">
            <Label htmlFor="tipus">Igazolás típusa</Label>
            <Select
              value={selectedTipus?.toString() || ''}
              onValueChange={(value) => setSelectedTipus(parseInt(value))}
            >
              <SelectTrigger id="tipus">
                <SelectValue placeholder="Válassz típust..." />
              </SelectTrigger>
              <SelectContent>
                {tipusok.map((tipus) => (
                  <SelectItem key={tipus.id} value={tipus.id.toString()}>
                    {tipus.nev}
                    {tipus.leiras && (
                      <span className="text-xs text-muted-foreground ml-2">
                        - {tipus.leiras}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eleje">Kezdés</Label>
              <Input
                id="eleje"
                type="datetime-local"
                value={eleje}
                onChange={(e) => setEleje(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vege">Befejezés</Label>
              <Input
                id="vege"
                type="datetime-local"
                value={vege}
                onChange={(e) => setVege(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="megjegyzes">Megjegyzés (opcionális)</Label>
            <Textarea
              id="megjegyzes"
              value={megjegyzes}
              onChange={(e) => setMegjegyzes(e.target.value)}
              placeholder="Pl. Osztálykirándulás a Városligetbe..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
            >
              {submitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Létrehozás...
                </>
              ) : (
                <>
                  <IconPlus className="mr-2 h-4 w-4" />
                  {mode === 'single' ? 'Igazolás létrehozása' : `${selectedStudents.length} igazolás létrehozása`}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Használati útmutató</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p><strong>Egyéni mód:</strong> Egy diák számára hozz létre igazolást.</p>
          <p><strong>Tömeges mód:</strong> Több diák számára egyszerre hozz létre azonos igazolást (pl. teljes osztály részére).</p>
          <p>Az itt létrehozott igazolások automatikusan jóváhagyott státuszúak, és &ldquo;Tanár által rögzített&rdquo; jelzéssel jelennek meg a rendszerben.</p>
          <p>A diákok látni fogják az igazolásokat, de nem tudják szerkeszteni vagy törölni.</p>
        </CardContent>
      </Card>
    </div>
  );
}
