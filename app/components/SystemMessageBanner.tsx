'use client';

import React from 'react';
import { useSystemMessages } from '@/app/context/SystemMessageContext';
import { SystemMessage, SystemMessageSeverity, SystemMessageType } from '@/lib/system-message-types';
import { X, Info, AlertTriangle, AlertCircle, User, Code, Settings, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Severity configurations
const severityConfig: Record<SystemMessageSeverity, {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  bgClassName: string;
}> = {
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

// Message type configurations
const messageTypeConfig: Record<SystemMessageType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}> = {
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

// Format date with smart timestamp handling
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

interface SystemMessageItemProps {
  message: SystemMessage;
  onDismiss: (id: number) => void;
}

function SystemMessageItem({ message, onDismiss }: SystemMessageItemProps) {
  const severity = severityConfig[message.severity];
  const messageType = messageTypeConfig[message.messageType];
  const SeverityIcon = severity.icon;
  const TypeIcon = messageType.icon;

  // Check if message was modified (different created_at and updated_at)
  const wasModified = message.created_at !== message.updated_at;
  const publishedDate = formatDate(message.created_at);
  const modifiedDate = wasModified ? formatDate(message.updated_at) : null;

  return (
    <Alert className={cn('relative pr-12', severity.bgClassName)}>
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
        onClick={() => onDismiss(message.id)}
        aria-label="Üzenet bezárása"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}

export function SystemMessageBanner() {
  const { messages, dismissedMessageIds, dismissMessage, isLoading } = useSystemMessages();

  // Filter out dismissed messages
  const visibleMessages = messages.filter(
    msg => !dismissedMessageIds.includes(msg.id)
  );

  // Don't render anything if there are no visible messages
  if (!isLoading && visibleMessages.length === 0) {
    return null;
  }

  // Show loading state briefly (but don't show anything if it takes too long)
  if (isLoading && messages.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-4">
      <div className="space-y-3">
        {visibleMessages.map(message => (
          <SystemMessageItem
            key={message.id}
            message={message}
            onDismiss={dismissMessage}
          />
        ))}
      </div>
    </div>
  );
}
