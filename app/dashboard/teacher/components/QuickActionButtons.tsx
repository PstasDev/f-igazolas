'use client';

import React from 'react';
import { Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonsProps {
  allapot: string;
  onApprove?: () => void;
  onReject?: () => void;
  onSetPending?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const QuickActionButton = React.forwardRef<
  HTMLButtonElement,
  {
    active?: boolean;
    variant: 'approve' | 'reject' | 'pending';
    onClick?: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
>(({ active, variant, onClick, children, size = 'sm', className, ...props }, ref) => {
  const baseClasses = cn(
    "relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
    "transform hover:scale-105 active:scale-95",
    "shadow-sm hover:shadow-md",
    "border border-transparent",
    className
  );

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm", 
    lg: "h-12 w-12 text-base"
  };

  const variantClasses = {
    approve: active 
      ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/20 hover:shadow-green-500/30 focus:ring-green-500/50" 
      : "bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200 hover:from-green-100 hover:to-green-200 hover:border-green-300 focus:ring-green-500/50 dark:from-green-900/20 dark:to-green-900/30 dark:text-green-300 dark:border-green-800 dark:hover:from-green-900/30 dark:hover:to-green-900/40",
    reject: active 
      ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-500/20 hover:shadow-red-500/30 focus:ring-red-500/50" 
      : "bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200 hover:from-red-100 hover:to-red-200 hover:border-red-300 focus:ring-red-500/50 dark:from-red-900/20 dark:to-red-900/30 dark:text-red-300 dark:border-red-800 dark:hover:from-red-900/30 dark:hover:to-red-900/40",
    pending: active 
      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20 hover:shadow-blue-500/30 focus:ring-blue-500/50" 
      : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 focus:ring-blue-500/50 dark:from-blue-900/20 dark:to-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:from-blue-900/30 dark:hover:to-blue-900/40"
  };

  return (
    <button
      ref={ref}
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant])}
      onClick={onClick}
      {...props}
    >
      {/* Subtle glow effect for active state */}
      {active && (
        <div className="absolute inset-0 rounded-lg opacity-20 blur-sm bg-gradient-to-br from-white via-white/50 to-transparent" />
      )}
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </button>
  );
});

QuickActionButton.displayName = "QuickActionButton";

export function QuickActionButtons({ 
  allapot, 
  onApprove, 
  onReject, 
  onSetPending, 
  size = 'sm',
  className 
}: QuickActionButtonsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <QuickActionButton
        variant="approve"
        active={allapot === 'Elfogadva'}
        onClick={onApprove}
        size={size}
      >
        <Check className={cn("h-4 w-4", size === 'md' && "h-5 w-5", size === 'lg' && "h-6 w-6")} />
      </QuickActionButton>
      
      <QuickActionButton
        variant="reject"
        active={allapot === 'Elutasítva'}
        onClick={onReject}
        size={size}
      >
        <X className={cn("h-4 w-4", size === 'md' && "h-5 w-5", size === 'lg' && "h-6 w-6")} />
      </QuickActionButton>
      
      <QuickActionButton
        variant="pending"
        active={allapot === 'Függőben'}
        onClick={onSetPending}
        size={size}
      >
        <Clock className={cn("h-4 w-4", size === 'md' && "h-5 w-5", size === 'lg' && "h-6 w-6")} />
      </QuickActionButton>
    </div>
  );
}

export { QuickActionButton };