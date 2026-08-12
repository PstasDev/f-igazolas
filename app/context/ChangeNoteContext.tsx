'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChangeNote } from '@/lib/change-note-types';
import { apiClient } from '@/lib/api';
import { useFrontendConfig } from './FrontendConfigContext';
import { useRole } from './RoleContext';

interface ChangeNoteContextType {
  notes: ChangeNote[];
  dismissedIds: number[];
  dismissNote: (id: number) => void;
  refreshNotes: () => Promise<void>;
  isLoading: boolean;
}

const ChangeNoteContext = createContext<ChangeNoteContextType | undefined>(undefined);

export function ChangeNoteProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useRole();
  const { config, updateConfig } = useFrontendConfig();
  const [notes, setNotes] = useState<ChangeNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dismissedIds = config.changeNotes?.dismissedIds ?? [];

  const refreshNotes = useCallback(async () => {
    if (!isAuthenticated) {
      setNotes([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const activeNotes = await apiClient.getActiveChangeNotes();
      setNotes(activeNotes);
    } catch (error) {
      console.error('Failed to fetch change notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  const dismissNote = useCallback((id: number) => {
    if (dismissedIds.includes(id)) return;
    void updateConfig({
      changeNotes: {
        dismissedIds: [...dismissedIds, id],
      },
    });
  }, [dismissedIds, updateConfig]);

  const value: ChangeNoteContextType = {
    notes,
    dismissedIds,
    dismissNote,
    refreshNotes,
    isLoading,
  };

  return (
    <ChangeNoteContext.Provider value={value}>
      {children}
    </ChangeNoteContext.Provider>
  );
}

export function useChangeNotes() {
  const context = useContext(ChangeNoteContext);
  if (context === undefined) {
    throw new Error('useChangeNotes must be used within a ChangeNoteProvider');
  }
  return context;
}
