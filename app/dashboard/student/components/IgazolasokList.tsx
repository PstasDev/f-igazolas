'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Clock, CheckCircle2, XCircle, Calendar, Eye, Inbox, RotateCcw } from 'lucide-react';
import { getIgazolasType } from '../../types';
import { useLongPress } from '@/hooks/use-long-press';
import { toast } from 'sonner';

interface Igazolas {
  id: string;
  title: string;
  date: string;
  type: 'studio' | 'egyeb' | 'beteg';
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  hours?: number[];
}

// Map local mock type keys to the getIgazolasType lookup keys
const TYPE_MAP: Record<Igazolas['type'], string> = {
  studio: 'stúdiós távollét',
  beteg: 'orvosi igazolás',
  egyeb: 'egyéb',
};

const mockIgazolasok: Igazolas[] = [
  {
    id: '1',
    title: 'Stúdiós hiányzás - Forgatás',
    date: '2025-10-15',
    type: 'studio',
    status: 'approved',
    description: 'Filmforgatáson való részvétel a Kossuth téren.',
    hours: [1, 2, 3],
  },
  {
    id: '2',
    title: 'Orvosi igazolás',
    date: '2025-10-18',
    type: 'beteg',
    status: 'pending',
    description: 'Influenza miatt otthon maradás.',
    hours: [1, 2, 3, 4, 5, 6],
  },
  {
    id: '3',
    title: 'Családi esemény',
    date: '2025-10-20',
    type: 'egyeb',
    status: 'pending',
    description: 'Nagyszülő 80. születésnapja.',
    hours: [4, 5],
  },
];

interface IgazolasokListProps {
  variant: 'all' | 'recent';
}

// ------------------------------------------------------------------
// Small coloured period squares shown on each card
// ------------------------------------------------------------------
function getPeriodActiveColor(status: Igazolas['status']): string {
  if (status === 'approved') return 'bg-green-400 dark:bg-green-500';
  if (status === 'rejected') return 'bg-red-400 dark:bg-red-500';
  return 'bg-blue-400 dark:bg-blue-500';
}

function PeriodSquares({ hours, status }: { hours?: number[]; status: Igazolas['status'] }) {
  if (!hours || hours.length === 0) return null;
  const activeColor = getPeriodActiveColor(status);
  return (
    <div className="flex gap-0.5 mt-1" aria-label="Érintett órák">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
        <span
          key={h}
          title={`${h}. óra`}
          className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm text-[8px] font-bold text-white transition-colors ${
            hours.includes(h) ? activeColor : 'bg-muted'
          }`}
        >
          {hours.includes(h) ? h : ''}
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// Status icon – right side of card (colour only, no background circle)
// ------------------------------------------------------------------
function StatusIcon({ status }: { status: Igazolas['status'] }) {
  if (status === 'approved')
    return <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 shrink-0" />;
  if (status === 'rejected')
    return <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0" />;
  return <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400 shrink-0" />;
}

// ------------------------------------------------------------------
// Single card item with long-press support (student)
// ------------------------------------------------------------------
interface StudentCardItemProps {
  igazolas: Igazolas;
  isLongPressActive: boolean;
  onClick: () => void;
  onLongPress: () => void;
  onUndo: () => void;
  onDismissActions: () => void;
  className?: string;
}

function StudentCardItem({
  igazolas,
  isLongPressActive,
  onClick,
  onLongPress,
  onUndo,
  onDismissActions,
  className = '',
}: StudentCardItemProps) {
  const typeConfig = getIgazolasType(TYPE_MAP[igazolas.type as Igazolas['type']]);
  const canUndo = igazolas.status === 'pending';

  const longPressProps = useLongPress({ onLongPress, onClick });

  return (
    <div className="relative">
      <Item
        {...longPressProps}
        className={`cursor-pointer hover:bg-accent rounded-lg p-3 transition-colors select-none gap-3 ${className}`}
      >
        {/* Left: emoji in type-coloured circle */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${typeConfig.bgClass}`}>
          {typeConfig.emoji}
        </div>

        {/* Center: type name + date */}
        <ItemContent className="min-w-0 flex-1">
          <ItemTitle className="w-full">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground leading-none">
              {typeConfig.name}
            </span>
          </ItemTitle>
          <ItemDescription className="flex flex-col gap-0.5 text-xs mt-0.5">
            <span className="font-medium text-foreground/80">{igazolas.title}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              {igazolas.date}
            </span>
            <PeriodSquares hours={igazolas.hours} status={igazolas.status} />
          </ItemDescription>
        </ItemContent>

        {/* Right: status icon */}
        <StatusIcon status={igazolas.status} />
      </Item>

      {/* Long-press action overlay (only show undo for pending) */}
      {isLongPressActive && (
        <div
          className="absolute inset-0 rounded-lg bg-background/90 backdrop-blur-sm flex items-center justify-center gap-2 z-10 border border-border shadow-lg"
          // @ts-ignore - e is a MouseEvent; React types unavailable in this project
          onClick={(e) => { e.stopPropagation(); onDismissActions(); }}
        >
          {canUndo ? (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              // @ts-ignore - e is a MouseEvent; React types unavailable in this project
              onClick={(e) => { e.stopPropagation(); onUndo(); onDismissActions(); }}
            >
              <RotateCcw className="h-4 w-4" />
              Visszavon
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Nem vonható vissza</span>
          )}
          <button
            className="absolute top-1 right-1 text-muted-foreground hover:text-foreground rounded-full p-0.5"
            // @ts-ignore - e is a MouseEvent; React types unavailable in this project
            onClick={(e) => { e.stopPropagation(); onDismissActions(); }}
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------
export function IgazolasokList({ variant }: IgazolasokListProps) {
  const [selectedIgazolas, setSelectedIgazolas] = useState<Igazolas | null>(null);
  const [longPressedId, setLongPressedId] = useState<string | null>(null);
  const [igazolasok, setIgazolasok] = useState<Igazolas[]>(mockIgazolasok);

  const displayedIgazolasok = variant === 'recent' ? igazolasok.slice(0, 3) : igazolasok;

  const handleUndo = (id: string) => {
    // TODO: call the withdrawal API endpoint once the student API client is available
    setIgazolasok((prev: Igazolas[]) => prev.filter((i: Igazolas) => i.id !== id));
    if (selectedIgazolas?.id === id) setSelectedIgazolas(null);
    toast.success('Igazolás visszavonva');
  };

  const getStatusBadge = (status: Igazolas['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Jóváhagyva</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Függőben</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Elutasítva</Badge>;
    }
  };

  if (variant === 'all') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {/* List View */}
        <Card>
          <CardHeader>
            <CardTitle><h1 className='text-xl'>Igazolásaim</h1></CardTitle>
            <CardDescription>Kattints egy igazolásra a részletek megtekintéséhez · Hosszan tartva visszavonás (függőben)</CardDescription>
          </CardHeader>
          <CardContent>
            {displayedIgazolasok.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon">
                  <Inbox />
                </EmptyMedia>
                <EmptyTitle>Még nincs igazolásod</EmptyTitle>
                <EmptyDescription>
                  Kezdj el igazolásokat beküldeni az &quot;Új igazolás&quot; gombra kattintva.
                </EmptyDescription>
              </Empty>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-2">
                  {displayedIgazolasok.map((igazolas: Igazolas) => (
                    <StudentCardItem
                      key={igazolas.id}
                      igazolas={igazolas}
                      isLongPressActive={longPressedId === igazolas.id}
                      onClick={() => setSelectedIgazolas(igazolas)}
                      onLongPress={() => setLongPressedId(igazolas.id)}
                      onUndo={() => handleUndo(igazolas.id)}
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
                  <div className="flex items-center gap-2 mb-4">
                    {(() => {
                      const typeConfig = getIgazolasType(TYPE_MAP[selectedIgazolas.type as Igazolas['type']]);
                      return (
                        <>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${typeConfig.bgClass}`}>
                            {typeConfig.emoji}
                          </div>
                          <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                            {typeConfig.name}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{selectedIgazolas.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4" />
                    {selectedIgazolas.date}
                  </div>
                  {getStatusBadge(selectedIgazolas.status)}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Leírás</h4>
                  <p className="text-sm text-muted-foreground">{selectedIgazolas.description}</p>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Melléklet megtekintése
                  </Button>
                </div>

                {selectedIgazolas.status === 'pending' && (
                  <div className="pt-2">
                    <Button
                      variant="destructive"
                      className="w-full gap-1.5"
                      onClick={() => handleUndo(selectedIgazolas.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Igazolás visszavonása
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Empty>
                <EmptyMedia variant="icon">
                  <FileText />
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
        <CardDescription>Az utolsó 3 beküldött igazolás · Hosszan tartva visszavonás (függőben)</CardDescription>
      </CardHeader>
      <CardContent>
        {displayedIgazolasok.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>Még nincs igazolásod</EmptyTitle>
            <EmptyDescription>
              Kezdj el igazolásokat beküldeni az &quot;Új igazolás&quot; gombra kattintva.
            </EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-2">
            {displayedIgazolasok.map((igazolas: Igazolas) => (
              <StudentCardItem
                key={igazolas.id}
                igazolas={igazolas}
                isLongPressActive={longPressedId === igazolas.id}
                onClick={() => {}}
                onLongPress={() => setLongPressedId(igazolas.id)}
                onUndo={() => handleUndo(igazolas.id)}
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

