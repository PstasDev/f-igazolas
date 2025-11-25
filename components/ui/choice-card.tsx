'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export interface ChoiceCardProps {
  title: string;
  description: string;
  emoji?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
  tooltip?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

export function ChoiceCard({
  title,
  description,
  emoji,
  icon,
  disabled = false,
  disabledReason,
  tooltip,
  badge,
  onClick,
  selected = false,
  className,
}: ChoiceCardProps) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${title}: ${description}`}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        selected && 'ring-2 ring-primary',
        disabled && 'opacity-50 cursor-not-allowed hover:shadow-none',
        className
      )}
    >
      <CardHeader className="p-4">
        <div className="flex gap-4 items-start">
          {/* Emoji or Icon */}
          <div className="text-4xl flex-shrink-0">
            {icon || emoji}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{title}</h3>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{description}</p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {badge && (
                <Badge variant={badge.variant || 'default'}>
                  {badge.text}
                </Badge>
              )}
              {disabled && disabledReason && (
                <Badge variant="destructive" className="text-xs">
                  {disabledReason}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
