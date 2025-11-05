'use client';

import React, { useState } from 'react';
import { SystemMessage } from '@/lib/system-message-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Info, AlertTriangle, AlertCircle, User, Code, Settings, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Mock system messages for testing
const mockMessages: SystemMessage[] = [
  {
    id: 1,
    title: 'Tervezett karbantartás',
    message: 'A rendszer karbantartása miatt 2025. november 10-én 18:00-tól 20:00-ig lehet, hogy nem lesz elérhető a rendszer. Kérjük, erre az időszakra tervezze igazolásbeküldését.',
    severity: 'info',
    messageType: 'user',
    showFrom: '2025-11-05T09:00:00Z',
    showTo: '2025-11-10T20:00:00Z',
    created_at: '2025-11-05T08:00:00Z',
    updated_at: '2025-11-05T08:00:00Z',
    is_active: true,
  },
  {
    id: 2,
    title: 'Ismert hiba: PDF feltöltés',
    message: 'Jelenleg dolgozunk egy ismert hiba javításán, amely miatt egyes PDF fájlok feltöltése sikertelen lehet. Kérjük, próbálja meg később újra, vagy használjon JPG/PNG formátumot.',
    severity: 'warning',
    messageType: 'developer',
    showFrom: '2025-11-05T10:00:00Z',
    showTo: '2025-11-06T23:59:59Z',
    created_at: '2025-11-05T09:30:00Z',
    updated_at: '2025-11-05T11:15:00Z', // Modified - different from created_at
    is_active: true,
  },
  {
    id: 3,
    title: 'KRITIKUS: Adatbázis hiba',
    message: 'Sürgős adatbázis-probléma miatt előfordulhat, hogy egyes felhasználók nem tudnak bejelentkezni. A problémán dolgozunk, várhatóan 30 percen belül helyreáll a szolgáltatás.',
    severity: 'error',
    messageType: 'operator',
    showFrom: '2025-11-05T11:00:00Z',
    showTo: '2025-11-05T12:00:00Z',
    created_at: '2025-11-05T11:05:00Z',
    updated_at: '2025-11-05T11:05:00Z',
    is_active: true,
  },
  {
    id: 4,
    title: 'Új funkció: BKK igazolás ellenőrzés',
    message: 'Örömmel jelentjük, hogy mostantól automatikusan ellenőrizhetők a BKK igazolások! Próbálja ki az új funkciót az igazolásbeküldési űrlapon.',
    severity: 'info',
    messageType: 'support',
    showFrom: '2025-11-04T00:00:00Z',
    showTo: '2025-11-15T23:59:59Z',
    created_at: '2025-11-04T12:00:00Z',
    updated_at: '2025-11-04T12:00:00Z',
    is_active: true,
  },
];

const severityConfig = {
  info: {
    icon: Info,
    className: 'text-blue-600 dark:text-blue-400',
    bgClassName: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  },
  warning: {
    icon: AlertTriangle,
    className: 'text-amber-600 dark:text-amber-400',
    bgClassName: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  },
  error: {
    icon: AlertCircle,
    className: 'text-red-600 dark:text-red-400',
    bgClassName: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
  },
};

const messageTypeConfig = {
  user: {
    icon: User,
    label: 'Felhasználó',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  developer: {
    icon: Code,
    label: 'Fejlesztő',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  operator: {
    icon: Settings,
    label: 'Operátor',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  support: {
    icon: HelpCircle,
    label: 'Támogatás',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
};

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    
    // Check if the date is today
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      // If today, show only time
      return new Intl.DateTimeFormat('hu-HU', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } else {
      // Otherwise show date with time
      return new Intl.DateTimeFormat('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
  } catch {
    return isoString;
  }
}

export function SystemMessageTestComponent() {
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  const visibleMessages = mockMessages.filter(
    msg => !dismissedIds.includes(msg.id)
  );

  const dismissMessage = (id: number) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const resetDismissed = () => {
    setDismissedIds([]);
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rendszerüzenetek - Teszt Komponens</CardTitle>
          <CardDescription>
            Ez a komponens a rendszerüzenetek megjelenítésének tesztelésére szolgál.
            A valós rendszerben ezek az üzenetek a backend API-ból érkeznek.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={resetDismissed} variant="outline">
              Bezárt üzenetek visszaállítása ({dismissedIds.length})
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Aktív üzenetek: {visibleMessages.length} / {mockMessages.length}
          </div>
        </CardContent>
      </Card>

      {visibleMessages.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nincsenek megjelenítendő rendszerüzenetek
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleMessages.map(message => {
            const severity = severityConfig[message.severity];
            const messageType = messageTypeConfig[message.messageType];
            const SeverityIcon = severity.icon;
            const TypeIcon = messageType.icon;

            // Check if message was modified (different created_at and updated_at)
            const wasModified = message.created_at !== message.updated_at;
            const publishedDate = formatDate(message.created_at);
            const modifiedDate = wasModified ? formatDate(message.updated_at) : null;

            return (
              <Alert key={message.id} className={cn('relative pr-12', severity.bgClassName)}>
                <div className="flex items-start gap-3">
                  <SeverityIcon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', severity.className)} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTitle className="mb-0 font-semibold">
                        {message.title}
                      </AlertTitle>
                      <Badge variant="secondary" className={cn('text-xs', messageType.color)}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {messageType.label}
                      </Badge>
                    </div>
                    
                    <AlertDescription className="text-sm whitespace-pre-wrap">
                      {message.message}
                    </AlertDescription>
                    
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Közzétéve:</span> {publishedDate}
                        {modifiedDate && (
                          <>
                            {' - '}
                            <span className="font-medium">Módosítva:</span> {modifiedDate}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                  onClick={() => dismissMessage(message.id)}
                  aria-label="Üzenet bezárása"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Alert>
            );
          })}
        </div>
      )}
    </div>
  );
}
