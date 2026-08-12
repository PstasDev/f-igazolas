'use client';

import React, { useState, useEffect } from 'react';
import { useChangeNotes } from '@/app/context/ChangeNoteContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarkdownContent } from '@/components/MarkdownContent';
import { Sparkles } from 'lucide-react';

export function ChangeNotePopup() {
  const { notes, dismissedIds, dismissNote, isLoading } = useChangeNotes();
  const [index, setIndex] = useState(0);

  const pendingNotes = notes.filter((note) => !dismissedIds.includes(note.id));
  const currentNote = pendingNotes[index];

  // Reset to the first pending note whenever the pending list changes shape
  useEffect(() => {
    if (index >= pendingNotes.length && pendingNotes.length > 0) {
      setIndex(0);
    }
  }, [pendingNotes.length, index]);

  if (isLoading || !currentNote) {
    return null;
  }

  const handleDismiss = () => {
    dismissNote(currentNote.id);
    setIndex(0);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent
        className="w-[95vw] h-[92vh] max-w-4xl sm:max-w-4xl flex flex-col p-0 gap-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {currentNote.title}
          </DialogTitle>
          {pendingNotes.length > 1 && (
            <p className="text-xs text-muted-foreground">
              {index + 1} / {pendingNotes.length} új bejegyzés
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4">
            <MarkdownContent content={currentNote.content} />
          </div>
        </ScrollArea>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0 bg-background">
          <Button onClick={handleDismiss}>
            {pendingNotes.length > 1 ? 'Rendben, következő' : 'Rendben, értem'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
