'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { DiakjaSignle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function DiakjaimTestComponent() {
  const [students, setStudents] = useState<DiakjaSignle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testGetDiakjaim = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getDiakjaim();
      setStudents(data);
      toast.success(`Sikeresen betöltve ${data.length} diák`);
    } catch (error) {
      console.error('Error fetching diakjaim:', error);
      toast.error('Hiba történt a diákok betöltésekor');
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateDiakjaim = async () => {
    try {
      setIsLoading(true);
      const testStudents = [
        {
          first_name: 'Test',
          last_name: 'Student',
          email: 'test.student@example.com'
        }
      ];
      
      const response = await apiClient.createDiakjaim(testStudents);
      toast.success(response.message);
      
      // Refresh the list
      await testGetDiakjaim();
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error('Hiba történt a diák létrehozásakor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testGetDiakjaim();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diakjaim API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testGetDiakjaim} 
            disabled={isLoading}
          >
            Diákok betöltése
          </Button>
          <Button 
            onClick={testCreateDiakjaim} 
            disabled={isLoading}
            variant="outline"
          >
            Test diák létrehozása
          </Button>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Betöltött diákok ({students.length}):</h3>
          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.id} className="p-2 border rounded">
                <div className="font-medium">
                  {student.last_name} {student.first_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{student.username} • {student.email}
                </div>
                <div className="text-sm">
                  Igazolások: {student.igazolasok.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}