'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api';
import { IconUsers, IconAlertCircle, IconSearch, IconCheck } from '@tabler/icons-react';
import { toast } from 'sonner';

interface Classmate {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_studios: boolean;
}

interface GroupIgazolasSelectorProps {
  selectedTipusId: number | null;
  onGroupChange: (selectedIds: number[]) => void;
  initialSelected?: number[];
}

export function GroupIgazolasSelector({ 
  selectedTipusId, 
  onGroupChange,
  initialSelected = []
}: GroupIgazolasSelectorProps) {
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>(initialSelected);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupType, setIsGroupType] = useState(false);

  const checkGroupSupport = async () => {
    try {
      const groupTypes = await apiClient.getGroupEnabledTypes() as Array<{ id: number }>;
      const isGroup = groupTypes.some(t => t.id === selectedTipusId);
      setIsGroupType(isGroup);
      
      if (!isGroup) {
        // Clear selection if type doesn't support groups
        setSelectedStudents([]);
      }
    } catch (error) {
      console.error('Failed to check group support:', error);
    }
  };

  const loadClassmates = async () => {
    if (!selectedTipusId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.getEligibleClassmates() as { 
        eligible_students: Classmate[];
        total_count: number;
      };
      setClassmates(response.eligible_students);
    } catch (error) {
      console.error('Failed to load classmates:', error);
      toast.error('Nem sikerült betölteni az osztálytársakat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTipusId) {
      void checkGroupSupport();
      void loadClassmates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTipusId]);

  useEffect(() => {
    onGroupChange(selectedStudents);
  }, [selectedStudents, onGroupChange]);

  const toggleStudent = (studentId: number) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAll = () => {
    const filtered = getFilteredClassmates();
    if (selectedStudents.length === filtered.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filtered.map(c => c.id));
    }
  };

  const getFilteredClassmates = () => {
    if (!searchQuery) return classmates;
    
    const query = searchQuery.toLowerCase();
    return classmates.filter(c =>
      c.full_name.toLowerCase().includes(query) ||
      c.username.toLowerCase().includes(query)
    );
  };

  if (!isGroupType) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredClassmates = getFilteredClassmates();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconUsers className="h-5 w-5" />
              Csoportos igazolás
            </CardTitle>
            <CardDescription>
              Válaszd ki azokat az osztálytársaidat, akik veled együtt hiányoztak
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {selectedStudents.length} kiválasztva
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            A csoportos igazolás minden kiválasztott diák számára létrehoz egy kapcsolt igazolást. 
            Te leszel a csoport vezetője, és a jóváhagyás mindenkire vonatkozik.
          </AlertDescription>
        </Alert>

        {/* Search and Select All */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Keresés név vagy felhasználónév alapján..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
          >
            {selectedStudents.length === filteredClassmates.length && filteredClassmates.length > 0 
              ? 'Kijelölés törlése' 
              : 'Összes kijelölése'}
          </Button>
        </div>

        {/* Classmate List */}
        <div className="max-h-80 overflow-y-auto border rounded-lg">
          {filteredClassmates.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? 'Nincs találat' : 'Nincsenek elérhető osztálytársak'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredClassmates.map((classmate) => (
                <div
                  key={classmate.id}
                  className="flex items-center space-x-3 p-3 hover:bg-accent cursor-pointer transition"
                  onClick={() => toggleStudent(classmate.id)}
                >
                  <Checkbox
                    checked={selectedStudents.includes(classmate.id)}
                    onCheckedChange={() => toggleStudent(classmate.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{classmate.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{classmate.username}
                    </p>
                  </div>
                  {classmate.is_studios && (
                    <Badge variant="outline" className="text-xs">
                      Stúdiós
                    </Badge>
                  )}
                  {selectedStudents.includes(classmate.id) && (
                    <IconCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {selectedStudents.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Összegzés</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Kiválasztott diákok:</span>
              <span className="font-medium">{selectedStudents.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Teljes létszám (veled együtt):</span>
              <span className="font-medium">{selectedStudents.length + 1}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
