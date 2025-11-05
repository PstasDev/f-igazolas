'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SystemMessage } from '@/lib/system-message-types';
import { apiClient } from '@/lib/api';

interface SystemMessageContextType {
  messages: SystemMessage[];
  dismissedMessageIds: number[];
  dismissMessage: (id: number) => void;
  refreshMessages: () => Promise<void>;
  isLoading: boolean;
}

const SystemMessageContext = createContext<SystemMessageContextType | undefined>(undefined);

const DISMISSED_MESSAGES_KEY = 'dismissed_system_messages';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function SystemMessageProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [dismissedMessageIds, setDismissedMessageIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dismissed message IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_MESSAGES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDismissedMessageIds(parsed);
      }
    } catch (error) {
      console.error('Failed to load dismissed messages:', error);
    }
  }, []);

  // Fetch active system messages
  const refreshMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeMessages = await apiClient.getActiveSystemMessages();
      setMessages(activeMessages);
    } catch (error) {
      console.error('Failed to fetch system messages:', error);
      // Don't show error to user, just fail silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    refreshMessages();
    
    const interval = setInterval(() => {
      refreshMessages();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [refreshMessages]);

  // Dismiss a message
  const dismissMessage = useCallback((id: number) => {
    setDismissedMessageIds(prev => {
      const updated = [...prev, id];
      try {
        localStorage.setItem(DISMISSED_MESSAGES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save dismissed message:', error);
      }
      return updated;
    });
  }, []);

  const value: SystemMessageContextType = {
    messages,
    dismissedMessageIds,
    dismissMessage,
    refreshMessages,
    isLoading,
  };

  return (
    <SystemMessageContext.Provider value={value}>
      {children}
    </SystemMessageContext.Provider>
  );
}

export function useSystemMessages() {
  const context = useContext(SystemMessageContext);
  if (context === undefined) {
    throw new Error('useSystemMessages must be used within a SystemMessageProvider');
  }
  return context;
}
