'use client';

import { Clapperboard } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

interface FTVLoadingStateProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'sync' | 'details';
}

export function FTVLoadingState({ 
  title, 
  description,
  variant = 'default' 
}: FTVLoadingStateProps) {
  const getContent = () => {
    switch (variant) {
      case 'sync':
        return {
          title: title || 'Szinkronizálás az FTV Sync-el',
          description: description || 'Ez eltarthat egy darabig. Kérjük, ne frissítse az oldalt.',
        };
      case 'details':
        return {
          title: title || 'Diák adatainak betöltése',
          description: description || 'Betöltés az FTV rendszerből...',
        };
      default:
        return {
          title: title || 'Betöltés',
          description: description || 'Adatok betöltése az FTV rendszerből. Kérjük, várjon.',
        };
    }
  };

  const content = getContent();

  return (
    <Empty className="w-full py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <div className="relative">
            <Spinner className="h-8 w-8" />
            {/* <div className="absolute inset-0 flex items-center justify-center">
              <Clapperboard className="h-4 w-4 text-muted-foreground animate-pulse" />
            </div> */}
          </div>
        </EmptyMedia>
        <EmptyTitle className="flex items-center gap-1 justify-center">
          <Clapperboard className="h-5 w-5 text-blue-500 dark:text-blue-400 drop-shadow-md" />
          <span className="text-blue-500 dark:text-blue-400 drop-shadow-md shadow-blue-500 dark:shadow-blue-400">FTV</span>
          {variant === 'sync' && <span className="text-sm font-normal text-blue-500/80 dark:text-blue-400 drop-shadow-md shadow-blue-500 dark:shadow-blue-400">Sync</span>}
        </EmptyTitle>
        <EmptyDescription className="max-w-md mx-auto">
          {content.description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <p className="text-sm text-muted-foreground">{content.title}</p>
      </EmptyContent>
    </Empty>
  );
}
