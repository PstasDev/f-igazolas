'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Clock, CheckCircle2, XCircle, Calendar, Eye, Inbox } from 'lucide-react';
import { getIgazolasType } from '../../types';

interface Igazolas {
  id: string;
  title: string;
  date: string;
  type: 'studio' | 'egyeb' | 'beteg';
  status: 'pending' | 'approved' | 'rejected';
  description: string;
}

const mockIgazolasok: Igazolas[] = [
  {
    id: '1',
    title: 'Stúdiós hiányzás - Forgatás',
    date: '2025-10-15',
    type: 'studio',
    status: 'approved',
    description: 'Filmforgatáson való részvétel a Kossuth téren.',
  },
  {
    id: '2',
    title: 'Orvosi igazolás',
    date: '2025-10-18',
    type: 'beteg',
    status: 'pending',
    description: 'Influenza miatt otthon maradás.',
  },
  {
    id: '3',
    title: 'Családi esemény',
    date: '2025-10-20',
    type: 'egyeb',
    status: 'pending',
    description: 'Nagyszülő 80. születésnapja.',
  },
];

interface IgazolasokListProps {
  variant: 'all' | 'recent';
}

export function IgazolasokList({ variant }: IgazolasokListProps) {
  const [selectedIgazolas, setSelectedIgazolas] = useState<Igazolas | null>(null);
  
  const igazolasok = variant === 'recent' ? mockIgazolasok.slice(0, 3) : mockIgazolasok;

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

  const getStatusIcon = (status: Igazolas['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
  };

  if (variant === 'all') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {/* List View */}
        <Card>
          <CardHeader>
            <CardTitle>Igazolásaim</CardTitle>
            <CardDescription>Kattints egy igazolásra a részletek megtekintéséhez</CardDescription>
          </CardHeader>
          <CardContent>
            {igazolasok.length === 0 ? (
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
                  {igazolasok.map((igazolas) => (
                    <Item
                      key={igazolas.id}
                      className="cursor-pointer hover:bg-accent rounded-lg p-3 transition-colors"
                      onClick={() => setSelectedIgazolas(igazolas)}
                    >
                      <ItemMedia variant="icon">
                        {getStatusIcon(igazolas.status)}
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{igazolas.title}</ItemTitle>
                        <ItemDescription className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3" />
                          {igazolas.date}
                          {getStatusBadge(igazolas.status)}
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

                <div>
                  <h4 className="text-sm font-medium mb-2">Típus</h4>
                  {(() => {
                    const typeInfo = getIgazolasType(selectedIgazolas.type)
                    return (
                      <Badge 
                        variant="outline" 
                        className={`${typeInfo.color} inline-flex items-center gap-1.5 font-medium`}
                      >
                        <span className="text-sm">{typeInfo.emoji}</span>
                        {typeInfo.name}
                      </Badge>
                    )
                  })()}
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Melléklet megtekintése
                  </Button>
                </div>
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
        <CardDescription>Az utolsó 3 beküldött igazolás</CardDescription>
      </CardHeader>
      <CardContent>
        {igazolasok.length === 0 ? (
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
            {igazolasok.map((igazolas) => (
              <Item key={igazolas.id} className="p-3 rounded-lg border">
                <ItemMedia variant="icon">
                  {getStatusIcon(igazolas.status)}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{igazolas.title}</ItemTitle>
                  <ItemDescription className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3 w-3" />
                    {igazolas.date}
                    {getStatusBadge(igazolas.status)}
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
