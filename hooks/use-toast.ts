// Thin wrapper around sonner that exposes a `useToast` hook matching the
// shadcn/ui API expected by the passkey setup drawer snippet.

import { toast as sonnerToast } from 'sonner';

type ToastVariant = 'default' | 'destructive';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

function toast({ title, description, variant }: ToastOptions) {
  if (variant === 'destructive') {
    sonnerToast.error(title, { description });
  } else {
    sonnerToast.success(title, { description });
  }
}

export function useToast() {
  return { toast };
}
