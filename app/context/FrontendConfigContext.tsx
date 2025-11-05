'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
  FrontendConfig,
  DEFAULT_FRONTEND_CONFIG,
  mergeFrontendConfig,
  isFrontendConfig,
} from '@/lib/frontend-config-types';

interface FrontendConfigContextType {
  config: FrontendConfig;
  loading: boolean;
  error: Error | null;
  updateConfig: (updates: Partial<FrontendConfig>) => Promise<void>;
  reloadConfig: () => Promise<void>;
  resetConfig: () => void;
}

const FrontendConfigContext = createContext<FrontendConfigContextType | undefined>(undefined);

export function FrontendConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<FrontendConfig>(DEFAULT_FRONTEND_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load configuration from backend on mount
   */
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = apiClient.getToken();
      if (!token) {
        // User not authenticated, use defaults
        setConfig(DEFAULT_FRONTEND_CONFIG);
        return;
      }

      const backendConfig = await apiClient.getMyFrontendConfig();
      
      // Validate and merge with defaults
      if (isFrontendConfig(backendConfig)) {
        const mergedConfig = mergeFrontendConfig(DEFAULT_FRONTEND_CONFIG, backendConfig);
        setConfig(mergedConfig);
      } else {
        // Backend returned invalid config, use defaults
        console.warn('Invalid frontend config from backend, using defaults');
        setConfig(DEFAULT_FRONTEND_CONFIG);
      }
    } catch (err) {
      console.error('Failed to load frontend config:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // On error, use defaults
      setConfig(DEFAULT_FRONTEND_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update configuration and persist to backend
   */
  const updateConfig = useCallback(async (updates: Partial<FrontendConfig>) => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Optimistically update local state
      const newConfig = mergeFrontendConfig(config, updates);
      setConfig(newConfig);

      // Log what we're sending for debugging
      console.log('Sending frontend config update:', newConfig);

      // Persist to backend (cast to Record for API)
      const updatedConfig = await apiClient.updateMyFrontendConfig(newConfig as Record<string, unknown>);
      
      console.log('Received backend response:', updatedConfig);
      
      // Validate and update with backend response
      if (isFrontendConfig(updatedConfig)) {
        const mergedConfig = mergeFrontendConfig(DEFAULT_FRONTEND_CONFIG, updatedConfig);
        setConfig(mergedConfig);
      }
    } catch (err) {
      console.error('Failed to update frontend config:', err);
      
      // Revert to previous state on error
      await loadConfig();
      
      throw err instanceof Error ? err : new Error('Failed to update configuration');
    }
  }, [config, loadConfig]);

  /**
   * Reload configuration from backend
   */
  const reloadConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  /**
   * Reset configuration to defaults (used on logout)
   */
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_FRONTEND_CONFIG);
    setLoading(false);
    setError(null);
  }, []);

  // Load config on mount and when token changes (login/logout)
  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      loadConfig();
    } else {
      // No token, reset to defaults
      resetConfig();
    }
  }, [loadConfig, resetConfig]);

  return (
    <FrontendConfigContext.Provider
      value={{
        config,
        loading,
        error,
        updateConfig,
        reloadConfig,
        resetConfig,
      }}
    >
      {children}
    </FrontendConfigContext.Provider>
  );
}

export function useFrontendConfig() {
  const context = useContext(FrontendConfigContext);
  if (context === undefined) {
    throw new Error('useFrontendConfig must be used within a FrontendConfigProvider');
  }
  return context;
}
