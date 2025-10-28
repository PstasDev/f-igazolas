'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Clock, Calendar, Eye, Inbox, User, Check, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Igazolas } from '@/lib/types';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

interface TeacherIgazolasokListProps {
  variant: 'all' | 'recent';
  filter: 'all' | 'pending' | 'approved' | 'rejected';
}

export function TeacherIgazolasokList({ variant, filter }: TeacherIgazolasokListProps) {
  const [selectedIgazolas, setSelectedIgazolas] = useState<Igazolas | null>(null);
  const [igazolasok, setIgazolasok] = useState<Igazolas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchIgazolasok = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.listIgazolas();
      
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

  const displayedIgazolasok = variant === 'recent' ? igazolasok.slice(0, 3) : igazolasok;

  const getStatusBadge = (allapot: string) => {
    if (allapot === 'Elfogadva') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Jóváhagyva</Badge>;
    } else if (allapot === 'Elutasítva') {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Elutasítva</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Függőben</Badge>;
  };

  const getStatusIcon = (allapot: string) => {
    if (allapot === 'Elfogadva') {
      return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
    } else if (allapot === 'Elutasítva') {
      return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
    return <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  };

  const handleApprove = async (id: number) => {
    try {
      setIsUpdating(true);
      await apiClient.quickActionIgazolas(id, { action: 'Elfogadva' });
      toast.success('Igazolás jóváhagyva');
      await fetchIgazolasok();
      // Update selected if it's the same one
      if (selectedIgazolas && selectedIgazolas.id === id) {
        const updated = await apiClient.getIgazolas(id);
        setSelectedIgazolas(updated);
      }
    } catch (error) {
      console.error('Failed to approve igazolás:', error);
      toast.error('Hiba történt az igazolás jóváhagyásakor');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setIsUpdating(true);
      await apiClient.quickActionIgazolas(id, { action: 'Elutasítva' });
      toast.success('Igazolás elutasítva');
      await fetchIgazolasok();
      // Update selected if it's the same one
      if (selectedIgazolas && selectedIgazolas.id === id) {
        const updated = await apiClient.getIgazolas(id);
        setSelectedIgazolas(updated);
      }
    } catch (error) {
      console.error('Failed to reject igazolás:', error);
      toast.error('Hiba történt az igazolás elutasításakor');
    } finally {
      setIsUpdating(false);
    }
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

  if (variant === 'all') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {/* List View */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === 'pending' && 'Ellenőrzésre váró igazolások'}
              {filter === 'approved' && 'Jóváhagyott igazolások'}
              {filter === 'all' && 'Összes igazolás'}
            </CardTitle>
            <CardDescription>Kattints egy igazolásra a részletek megtekintéséhez</CardDescription>
          </CardHeader>
          <CardContent>
            {displayedIgazolasok.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>Nincs igazolás</EmptyTitle>
                <EmptyDescription>
                  Jelenleg nincsenek {filter === 'pending' ? 'ellenőrzésre váró' : filter === 'approved' ? 'jóváhagyott' : ''} igazolások.
                </EmptyDescription>
              </Empty>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-2">
                  {displayedIgazolasok.map((igazolas) => (
                    <Item
                      key={igazolas.id}
                      className="cursor-pointer hover:bg-accent rounded-lg p-3 transition-colors"
                      onClick={() => setSelectedIgazolas(igazolas)}
                    >
                      <ItemMedia variant="icon">
                        {getStatusIcon(igazolas.allapot)}
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{igazolas.tipus.nev}</ItemTitle>
                        <ItemDescription className="flex flex-col gap-1 text-xs">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {igazolas.profile.user.first_name} {igazolas.profile.user.last_name} ({igazolas.profile.osztalyom?.nev || 'N/A'})
                          </span>
                          <span className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(igazolas.eleje).toLocaleDateString('hu-HU')}
                            {getStatusBadge(igazolas.allapot)}
                          </span>
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Detail View */}
        <Card>
          <CardHeader>
            <CardTitle>Részletek</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedIgazolas ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedIgazolas.tipus.nev}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedIgazolas.profile.user.first_name} {selectedIgazolas.profile.user.last_name} - {selectedIgazolas.profile.osztalyom?.nev || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Hiányzás: {new Date(selectedIgazolas.eleje).toLocaleString('hu-HU')} - {new Date(selectedIgazolas.vege).toLocaleString('hu-HU')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Beküldve: {new Date(selectedIgazolas.rogzites_datuma).toLocaleDateString('hu-HU')}
                    </div>
                  </div>
                  {getStatusBadge(selectedIgazolas.allapot)}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Diák megjegyzése</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedIgazolas.megjegyzes_diak || selectedIgazolas.megjegyzes || 'Nincs megjegyzés'}
                  </p>
                </div>

                {selectedIgazolas.megjegyzes_tanar && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tanári megjegyzés</h4>
                    <p className="text-sm text-muted-foreground">{selectedIgazolas.megjegyzes_tanar}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-2">Típus részletei</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedIgazolas.tipus.leiras || 'Nincs leírás'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {selectedIgazolas.tipus.iskolaerdeku && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">Iskolai</Badge>
                    )}
                    {selectedIgazolas.tipus.beleszamit && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">Beleszámít</Badge>
                    )}
                  </div>
                </div>

                {selectedIgazolas.imgDriveURL && (
                  <div className="pt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <a href={selectedIgazolas.imgDriveURL} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-2" />
                        Melléklet megtekintése
                      </a>
                    </Button>
                  </div>
                )}

                {selectedIgazolas.allapot === 'Függőben' && (
                  <div className="pt-4 grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleApprove(selectedIgazolas.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={isUpdating}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Jóváhagy
                    </Button>
                    <Button 
                      onClick={() => handleReject(selectedIgazolas.id)}
                      variant="destructive"
                      disabled={isUpdating}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Elutasít
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Empty>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>Válassz egy igazolást</EmptyTitle>
                <EmptyDescription>
                  Válaszd ki az igazolást a listából a részletek megtekintéséhez
                </EmptyDescription>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Recent view for overview
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legutóbbi igazolások</CardTitle>
        <CardDescription>Az utolsó 3 beküldött igazolás</CardDescription>
      </CardHeader>
      <CardContent>
        {displayedIgazolasok.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>Nincs igazolás</EmptyTitle>
            <EmptyDescription>
              Jelenleg nincsenek beküldött igazolások.
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-2">
            {displayedIgazolasok.map((igazolas) => (
              <Item key={igazolas.id} className="p-3 rounded-lg border">
                <ItemMedia variant="icon">
                  {getStatusIcon(igazolas.allapot)}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{igazolas.tipus.nev}</ItemTitle>
                  <ItemDescription className="flex flex-col gap-1 text-xs">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {igazolas.profile.user.first_name} {igazolas.profile.user.last_name} ({igazolas.profile.osztalyom?.nev || 'N/A'})
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {new Date(igazolas.eleje).toLocaleDateString('hu-HU')}
                      {getStatusBadge(igazolas.allapot)}
                    </span>
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
