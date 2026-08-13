'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Clock, Calendar, Eye, Inbox, User, X, Loader2, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Igazolas } from '@/lib/types';
import { getIgazolasType } from '@/app/dashboard/types';
import { mapApiResponseToPeriods } from '@/lib/periods';
import { useLongPress } from '@/hooks/use-long-press';
import { QuickActionButtons } from './QuickActionButtons';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface TeacherIgazolasokListProps {
  variant: 'all' | 'recent';
  filter: 'all' | 'pending' | 'approved' | 'rejected';
}

// ------------------------------------------------------------------
// Small coloured period squares shown on each card
// ------------------------------------------------------------------
function getPeriodActiveColor(allapot: string): string {
  if (allapot === 'Elfogadva') return 'bg-green-400 dark:bg-green-500';
  if (allapot === 'Elutasítva') return 'bg-red-400 dark:bg-red-500';
  return 'bg-blue-400 dark:bg-blue-500';
}

function PeriodSquares({ igazolas }: { igazolas: Igazolas }) {
  const { originalPeriods } = mapApiResponseToPeriods(
    igazolas.eleje,
    igazolas.vege,
    igazolas.diak_extra_ido_elotte,
    igazolas.diak_extra_ido_utana,
    igazolas.reszletes_idopontok,
  );

  if (originalPeriods.length === 0) return null;

  const activeColor = getPeriodActiveColor(igazolas.allapot);

  return (
    <div className="flex gap-0.5 mt-1" aria-label="Érintett órák">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
        <span
          key={h}
          title={`${h}. óra`}
          className={`inline-flex items-center justify-center w-4 h-4 rounded-sm text-[9px] font-bold text-white transition-colors ${
            originalPeriods.includes(h) ? activeColor : 'bg-muted'
          }`}
        >
          {originalPeriods.includes(h) ? h : ''}
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// Status icon – right side of card (colour only, no background circle)
// ------------------------------------------------------------------
function StatusIcon({ allapot }: { allapot: string }) {
  if (allapot === 'Elfogadva')
    return <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 shrink-0" />;
  if (allapot === 'Elutasítva')
    return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0" />;
  if (allapot === 'Hiánypótlásra visszaküldve')
    return <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400 shrink-0" />;
  return <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400 shrink-0" />;
}

// ------------------------------------------------------------------
// getStatusBadge helper (kept for the detail view)
// ------------------------------------------------------------------
function getStatusBadge(allapot: string) {
  if (allapot === 'Elfogadva')
    return <Badge variant="approved">Jóváhagyva</Badge>;
  if (allapot === 'Elutasítva')
    return <Badge variant="rejected">Elutasítva</Badge>;
  if (allapot === 'Hiánypótlásra visszaküldve')
    return <Badge variant="revision">Hiánypótlásra visszaküldve</Badge>;
  return <Badge variant="pending">Függőben</Badge>;
}

// ------------------------------------------------------------------
// Single card item with long-press support
// ------------------------------------------------------------------
interface IgazolasCardItemProps {
  igazolas: Igazolas;
  isLongPressActive: boolean;
  onClick: () => void;
  onLongPress: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSetPending: () => void;
  onDismissActions: () => void;
  className?: string;
}

function IgazolasCardItem({
  igazolas,
  isLongPressActive,
  onClick,
  onLongPress,
  onApprove,
  onReject,
  onSetPending,
  onDismissActions,
  className = '',
}: IgazolasCardItemProps) {
  const typeConfig = getIgazolasType(igazolas.tipus.nev);

  const longPressProps = useLongPress({ onLongPress, onClick });

  return (
    <div className="relative">
      <Item
        {...longPressProps}
        className={`cursor-pointer hover:bg-accent rounded-lg p-3 transition-colors select-none gap-3 ${className}`}
      >
        {/* Left: emoji in type-coloured circle */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${typeConfig.bgClass}`}
        >
          {typeConfig.emoji}
        </div>

        {/* Center: type name + student + date + period squares */}
        <ItemContent className="min-w-0 flex-1">
          <ItemTitle className="w-full">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground leading-none">
              {typeConfig.name}
            </span>
          </ItemTitle>
          <ItemDescription className="flex flex-col gap-0.5 text-xs mt-0.5">
            <span className="flex items-center gap-1 text-foreground/80 font-medium">
              <User className="h-3 w-3 shrink-0" />
              {igazolas.profile.user.last_name} {igazolas.profile.user.first_name}
              {igazolas.profile.osztalyom ? ` (${igazolas.profile.osztalyom.nev})` : ''}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {new Date(igazolas.eleje).toLocaleDateString('hu-HU')}
            </span>
            <PeriodSquares igazolas={igazolas} />
          </ItemDescription>
        </ItemContent>

        {/* Right: status icon */}
        <StatusIcon allapot={igazolas.allapot} />
      </Item>

      {/* Long-press action overlay */}
      {isLongPressActive && (
        <div
          className="absolute inset-0 rounded-lg bg-background/90 backdrop-blur-sm flex items-center justify-center gap-2 z-10 border border-border shadow-lg"
          // @ts-ignore - e is a MouseEvent; React types unavailable in this project
          onClick={(e) => { e.stopPropagation(); onDismissActions(); }}
        >
          <QuickActionButtons
            allapot={igazolas.allapot}
            onApprove={() => { onApprove(); onDismissActions(); }}
            onReject={() => { onReject(); onDismissActions(); }}
            onSetPending={() => { onSetPending(); onDismissActions(); }}
            size="md"
          />
          <button
            className="absolute top-1 right-1 text-muted-foreground hover:text-foreground rounded-full p-0.5"
            // @ts-ignore - e is a MouseEvent; React types unavailable in this project
            onClick={(e) => { e.stopPropagation(); onDismissActions(); }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export function TeacherIgazolasokList({ variant, filter }: TeacherIgazolasokListProps) {
  const [selectedIgazolas, setSelectedIgazolas] = useState<Igazolas | null>(null);
  const [igazolasok, setIgazolasok] = useState<Igazolas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  /** ID of the card currently showing the long-press action overlay */
  const [longPressedId, setLongPressedId] = useState<number | null>(null);

  // Server-stored image display
  const [attachmentBlobUrl, setAttachmentBlobUrl] = useState<string | null>(null);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  useEffect(() => {
    setIsImageFullscreen(false);
    setAttachmentBlobUrl((prev: string | null) => { if (prev) URL.revokeObjectURL(prev); return null; });
    if (!selectedIgazolas?.image_url) return;
    let cancelled = false;
    apiClient.getIgazolasImageBlob(selectedIgazolas.id)
      .then(blob => {
        if (cancelled) return;
        setAttachmentBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedIgazolas?.id, selectedIgazolas?.image_url]);

  const fetchIgazolasok = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.listIgazolas();
      
      let filtered = data.filter(i => !i.undoed);
      if (filter === 'pending') {
        filtered = filtered.filter(i => i.allapot === 'Függőben');
      } else if (filter === 'approved') {
        filtered = filtered.filter(i => i.allapot === 'Elfogadva');
      } else if (filter === 'rejected') {
        filtered = filtered.filter(i => i.allapot === 'Elutasítva');
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

  // ------------------------------------------------------------------
  // Action handlers
  // ------------------------------------------------------------------
  const handleApprove = async (id: number) => {
    try {
      setIsUpdating(true);
      await apiClient.quickActionIgazolas(id, { action: 'Elfogadva' });
      toast.success('Igazolás jóváhagyva');
      await fetchIgazolasok();
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

  const handleSetPending = async (id: number) => {
    try {
      setIsUpdating(true);
      await apiClient.quickActionIgazolas(id, { action: 'Függőben' });
      toast.success('Igazolás státusza visszaállítva függőben állapotra');
      await fetchIgazolasok();
      if (selectedIgazolas && selectedIgazolas.id === id) {
        const updated = await apiClient.getIgazolas(id);
        setSelectedIgazolas(updated);
      }
    } catch (error) {
      console.error('Failed to set pending:', error);
      toast.error('Hiba történt a státusz módosításakor');
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
      <>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* List View */}
          <Card>
            <CardHeader>
              <CardTitle>
                {filter === 'pending' && 'Ellenőrzésre váró igazolások'}
                {filter === 'approved' && 'Jóváhagyott igazolások'}
                {filter === 'all' && 'Összes igazolás'}
              </CardTitle>
              <CardDescription>Kattints egy igazolásra a részletek megtekintéséhez · Hosszan tartva gyors műveletek</CardDescription>
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
                    {displayedIgazolasok.map((igazolas: Igazolas) => (
                      <IgazolasCardItem
                        key={igazolas.id}
                        igazolas={igazolas}
                        isLongPressActive={longPressedId === igazolas.id}
                        onClick={() => setSelectedIgazolas(igazolas)}
                        onLongPress={() => setLongPressedId(igazolas.id)}
                        onApprove={() => { void handleApprove(igazolas.id); }}
                        onReject={() => { void handleReject(igazolas.id); }}
                        onSetPending={() => { void handleSetPending(igazolas.id); }}
                        onDismissActions={() => setLongPressedId(null)}
                      />
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
                    <div className="flex items-center gap-3 mb-4">
                      {(() => {
                        const typeConfig = getIgazolasType(selectedIgazolas.tipus.nev);
                        return (
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${typeConfig.bgClass}`}>
                              {typeConfig.emoji}
                            </div>
                            <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                              {typeConfig.name}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedIgazolas.profile.user.last_name} {selectedIgazolas.profile.user.first_name} - {selectedIgazolas.profile.osztalyom?.nev || 'N/A'}
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
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Iskolai</Badge>
                      )}
                      {selectedIgazolas.tipus.beleszamit && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">Beleszámít</Badge>
                      )}
                    </div>
                  </div>

                  {(selectedIgazolas.image_url || selectedIgazolas.imgDriveURL) && (
                    <div className="pt-4 space-y-2">
                      <h4 className="text-sm font-medium">Mellékelt kép</h4>
                      {selectedIgazolas.image_url ? (
                        attachmentBlobUrl ? (
                          <div
                            className="relative cursor-pointer rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-700 hover:opacity-95 transition-opacity"
                            onClick={() => setIsImageFullscreen(true)}
                            title="Kattints a teljes képernyős nézethez"
                          >
                            <img
                              src={attachmentBlobUrl}
                              alt="Mellékelt kép"
                              className="w-full max-h-48 object-contain bg-muted/30"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 text-center pointer-events-none">
                              <span className="text-white text-xs">Kattints a teljes képernyős nézethez</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-24 rounded-lg bg-muted/30 border">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        )
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            if (selectedIgazolas.imgDriveURL) {
                              window.open(selectedIgazolas.imgDriveURL, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Megtékintés Google Drive-on
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="pt-4">
                    <QuickActionButtons
                      allapot={selectedIgazolas.allapot}
                      onApprove={() => { void handleApprove(selectedIgazolas.id); }}
                      onReject={() => { void handleReject(selectedIgazolas.id); }}
                      onSetPending={() => { void handleSetPending(selectedIgazolas.id); }}
                      size="md"
                      className="justify-start"
                    />
                    {isUpdating && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Frissítés…
                      </div>
                    )}
                  </div>
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

        {/* Fullscreen Image Dialog */}
        <Dialog open={isImageFullscreen} onOpenChange={setIsImageFullscreen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 flex items-center justify-center">
            {attachmentBlobUrl && (
              <img
                src={attachmentBlobUrl}
                alt="Mellékelt kép"
                className="max-w-full max-h-[90vh] object-contain rounded"
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Recent view for overview
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legutóbbi igazolások</CardTitle>
        <CardDescription>Az utolsó 3 beküldött igazolás · Hosszan tartva gyors műveletek</CardDescription>
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
            {displayedIgazolasok.map((igazolas: Igazolas) => (
              <IgazolasCardItem
                key={igazolas.id}
                igazolas={igazolas}
                isLongPressActive={longPressedId === igazolas.id}
                onClick={() => {}}
                onLongPress={() => setLongPressedId(igazolas.id)}
                onApprove={() => { void handleApprove(igazolas.id); }}
                onReject={() => { void handleReject(igazolas.id); }}
                onSetPending={() => { void handleSetPending(igazolas.id); }}
                onDismissActions={() => setLongPressedId(null)}
                className="border"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
