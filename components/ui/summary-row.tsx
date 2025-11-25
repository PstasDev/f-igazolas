'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

export interface SummaryRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  details?: React.ReactNode;
  editAction?: () => void;
}

export function SummaryRow({ icon, label, value, details, editAction }: SummaryRowProps) {
  return (
    <div className="flex gap-3 items-start py-3 border-b last:border-0">
      <div className="text-muted-foreground mt-1 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-muted-foreground mb-1">
          {label}
        </div>
        <div className="text-base break-words">{value}</div>
        {details && <div className="mt-2">{details}</div>}
      </div>
      {editAction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={editAction}
          className="flex-shrink-0"
          aria-label={`Szerkesztés: ${label}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
