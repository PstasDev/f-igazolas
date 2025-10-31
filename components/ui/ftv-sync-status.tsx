import { FTVSyncMetadata } from '@/lib/types';
import { Badge } from './badge';
import { Button } from './button';
import { RefreshCcw, CheckCircle2, XCircle, AlertCircle, Clapperboard, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface FTVSyncStatusProps {
  metadata: FTVSyncMetadata | null;
  isSyncing: boolean;
  onSyncNow?: () => void;
  compact?: boolean;
}

export function FTVSyncStatus({
  metadata,
  isSyncing,
  onSyncNow,
  compact = false,
}: FTVSyncStatusProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Calculate time ago from last_sync_time and update every second
  useEffect(() => {
    if (!metadata?.last_sync_time) {
      setTimeAgo('Még soha');
      return;
    }

    const updateTimeAgo = () => {
      const syncTime = new Date(metadata.last_sync_time!);
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - syncTime.getTime()) / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);

      if (diffMinutes < 1) {
        setTimeAgo(`${diffSeconds} másodperce`);
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes} perce`);
      } else {
        const hours = Math.floor(diffMinutes / 60);
        setTimeAgo(`${hours} órája`);
      }
    };

    // Update immediately
    updateTimeAgo();

    // Update every second
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [metadata?.last_sync_time]);

  if (!metadata) {
    return null;
  }

  const shouldShowWarning = () => {
    if (!metadata.last_sync_time) return false;
    const syncTime = new Date(metadata.last_sync_time);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - syncTime.getTime()) / 1000 / 60);
    return diffMinutes > 5 && metadata.last_sync_status === 'success';
  };

  const getStatusBadge = () => {
    if (isSyncing) {
      return (
        <Badge variant="outline" className="gap-1">
          <RefreshCcw className="h-3 w-3 animate-spin" />
          Szinkronizálás...
        </Badge>
      );
    }

    switch (metadata.last_sync_status) {
      case 'success':
        return (
          <Badge variant="outline" className="gap-1 border-green-500/50 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Sikeres
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="gap-1 border-red-500/50 text-red-700 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            Sikertelen
          </Badge>
        );
      case 'never':
        return (
          <Badge variant="outline" className="gap-1 border-yellow-500/50 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="h-3 w-3" />
            Még nem volt szinkronizálás
          </Badge>
        );
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        {onSyncNow && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="h-7 gap-1"
          >
            <RefreshCcw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
            Szinkronizálás
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-lg bg-muted/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto overflow-hidden">
        {/* FTV Sync Branding */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Clapperboard className="h-4 w-4 text-blue-500 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="text-sm font-bold text-blue-500 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
            FTV
          </span>
          <span className="text-xs font-medium text-blue-500/70 dark:text-blue-400/70">
            Sync
          </span>
        </div>
        
        {/* Separator - hidden on mobile */}
        <div className="hidden sm:block h-4 w-px bg-border flex-shrink-0" />
        
        {/* Status Info */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {timeAgo}
          </div>
          {getStatusBadge()}
          {shouldShowWarning() && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="gap-1 border-yellow-500/50 text-yellow-700 dark:text-yellow-400 cursor-help whitespace-nowrap">
                    <AlertCircle className="h-3 w-3" />
                    Régi adatok
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Az adatok több mint 5 perce nem frissültek.</p>
                  <p className="text-xs text-muted-foreground">Kattints a Frissítés gombra az aktualizáláshoz.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      {onSyncNow && (
        <Button
          size="sm"
          variant="outline"
          onClick={onSyncNow}
          disabled={isSyncing}
          className="gap-2 w-full sm:w-auto flex-shrink-0"
        >
          <RefreshCcw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          {isSyncing ? 'Szinkronizálás...' : 'Frissítés'}
        </Button>
      )}
    </div>
  );
}
