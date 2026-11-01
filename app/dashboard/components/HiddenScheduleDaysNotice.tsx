'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function HiddenScheduleDaysNotice() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mt-6">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setIsOpen(true)}
          className="rounded-sm text-xs text-red-500/70 underline decoration-red-400/30 underline-offset-4 transition-colors hover:text-red-600 hover:decoration-red-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:text-red-400/70 dark:hover:text-red-300"
        >
          Szünnapokra vonatkozó igazolások elrejtve
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Szünnapokra vonatkozó igazolások</DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">
                A szünnapokat a tanév rendje határozza meg. A könnyebb áttekinthetőség érdekében a rendszer nem jeleníti meg a munkaszüneti napokra eső igazolásokat.
              </span>
              <span className="block">
                Az osztályfőnökök a Naptár menüben a saját osztályuk számára a tanév rendjétől eltérő munkarendet is beállíthatnak.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Értem</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
