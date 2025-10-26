'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Upload, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { IgazolasTipus } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function NewIgazolasForm() {
  const router = useRouter();
  const [igazolasTipusok, setIgazolasTipusok] = useState<IgazolasTipus[]>([]);
  const [isLoadingTipusok, setIsLoadingTipusok] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedTipus, setSelectedTipus] = useState<string>('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endDateTime, setEndDateTime] = useState<string>('');
  const [megjegyzesDiak, setMegjegyzesDiak] = useState<string>('');
  const [imageURL, setImageURL] = useState<string>('');

  useEffect(() => {
    const fetchTipusok = async () => {
      try {
        const data = await apiClient.listIgazolasTipus();
        setIgazolasTipusok(data);
      } catch (error) {
        console.error('Failed to fetch igazolás types:', error);
        toast.error('Hiba történt az igazolás típusok betöltésekor');
      } finally {
        setIsLoadingTipusok(false);
      }
    };

    fetchTipusok();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTipus || !startDateTime || !endDateTime) {
      toast.error('Kérlek töltsd ki az összes kötelező mezőt!');
      return;
    }

    // Validate that start is before end
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    if (start >= end) {
      toast.error('A befejezés időpontja később kell legyen, mint a kezdés!');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.createIgazolas({
        eleje: startDateTime,
        vege: endDateTime,
        tipus: parseInt(selectedTipus),
        megjegyzes_diak: megjegyzesDiak || undefined,
        imgDriveURL: imageURL || undefined,
        diak: true,
        korrigalt: false,
      });

      toast.success('Igazolás sikeresen beküldve!');
      
      // Reset form
      setSelectedTipus('');
      setStartDateTime('');
      setEndDateTime('');
      setMegjegyzesDiak('');
      setImageURL('');
      
      // Navigate back to overview
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to create igazolás:', error);
      const errorMessage = (error as Error)?.message || 'Hiba történt az igazolás beküldésekor';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Új igazolás beküldése</CardTitle>
        <CardDescription>Töltsd ki az űrlapot és küld be az igazolást az osztályfőnöknek</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="type">Hiányzás oka *</Label>
            <Select 
              value={selectedTipus} 
              onValueChange={setSelectedTipus}
              disabled={isLoadingTipusok || isSubmitting}
              required
            >
              <SelectTrigger id="type">
                <SelectValue placeholder={isLoadingTipusok ? "Betöltés..." : "Válassz okot"} />
              </SelectTrigger>
              <SelectContent>
                {igazolasTipusok.map(tipus => (
                  <SelectItem key={tipus.id} value={tipus.id.toString()}>
                    {tipus.nev}
                    {tipus.iskolaerdeku && ' (iskolai)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Kezdés dátuma és időpontja *</Label>
              <div className="relative">
                <Input 
                  id="start-date" 
                  type="datetime-local" 
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Befejezés dátuma és időpontja *</Label>
              <div className="relative">
                <Input 
                  id="end-date" 
                  type="datetime-local" 
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Megjegyzés / Részletes leírás (opcionális)</Label>
            <Textarea 
              id="description"
              placeholder="Add meg a hiányzás részleteit, pl. miért hiányoztál, mi volt az ok..."
              rows={4}
              value={megjegyzesDiak}
              onChange={(e) => setMegjegyzesDiak(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-url">Melléklet URL (opcionális)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-url"
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={imageURL}
                onChange={(e) => setImageURL(e.target.value)}
                disabled={isSubmitting}
              />
              {imageURL && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  Link megadva
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Google Drive vagy más felhő szolgáltatás link
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting || isLoadingTipusok}
            >
              {isSubmitting ? (
                <>Beküldés...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Igazolás beküldése
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Mégse
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
