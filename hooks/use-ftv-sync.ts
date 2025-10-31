import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { Igazolas, FTVSyncMetadata } from '@/lib/types';
import { toast } from 'sonner';

interface UseFTVSyncOptions {
  fetchFunction: (mode: 'cached' | 'live') => Promise<Igazolas[]>;
  autoSync?: boolean;
}

interface UseFTVSyncReturn {
  data: Igazolas[];
  isLoading: boolean;
  isSyncing: boolean;
  metadata: FTVSyncMetadata | null;
  error: Error | null;
  refresh: () => Promise<void>;
  syncNow: () => Promise<void>;
}

/**
 * Custom hook for managing FTV sync with caching mechanism
 * 
 * This hook implements a two-phase loading strategy:
 * 1. Fast initial load with cached data
 * 2. Background sync with live data
 * 
 * @param options - Configuration options
 * @returns Hook state and methods
 */
export function useFTVSync({
  fetchFunction,
  autoSync = true,
}: UseFTVSyncOptions): UseFTVSyncReturn {
  const [data, setData] = useState<Igazolas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [metadata, setMetadata] = useState<FTVSyncMetadata | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Track if initial load has been done to prevent re-runs
  const hasInitialized = useRef(false);
  const fetchFunctionRef = useRef(fetchFunction);
  
  // Update ref when fetchFunction changes
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  // Fetch metadata about last sync
  const fetchMetadata = useCallback(async () => {
    try {
      const response = await apiClient.getFTVSyncMetadata();
      setMetadata(response.metadata);
      return response.metadata;
    } catch (err) {
      console.error('Failed to fetch sync metadata:', err);
      return null;
    }
  }, []);

  // Sync with live data in the background
  const syncLiveData = useCallback(async () => {
    if (isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }
    
    try {
      setIsSyncing(true);
      const liveData = await fetchFunctionRef.current('live');
      
      // Compare with existing data
      setData(prevData => {
        const hasChanges = JSON.stringify(prevData) !== JSON.stringify(liveData);
        
        if (hasChanges) {
          toast.success('✓ Adatok frissítve a legfrissebb információkkal');
        } else {
          toast.success('✓ Az adatok naprakészek');
        }
        
        return liveData;
      });
      
      // Update metadata after sync
      await fetchMetadata();
      
      return liveData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sync live data');
      console.error('Failed to sync live data:', error);
      toast.error('Hiba történt a szinkronizálás során');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, fetchMetadata]);

  // Manual refresh - reload everything
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const cachedData = await fetchFunctionRef.current('cached');
      setData(cachedData);
      setIsLoading(false);
      
      if (autoSync) {
        await syncLiveData();
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setIsLoading(false);
    }
  }, [autoSync, syncLiveData]);

  // Manual sync - trigger live data sync
  const syncNow = useCallback(async () => {
    await syncLiveData();
  }, [syncLiveData]);

  // Initial load effect - only runs ONCE
  useEffect(() => {
    if (hasInitialized.current) {
      return; // Already initialized, don't run again
    }
    
    hasInitialized.current = true;
    
    const initialize = async () => {
      try {
        // Step 1: Load cached data for fast initial render
        setIsLoading(true);
        setError(null);
        const cachedData = await fetchFunctionRef.current('cached');
        setData(cachedData);
        setIsLoading(false);
        
        // Step 2: Get metadata to inform user about sync status
        await fetchMetadata();
        
        // Step 3: Auto-sync with live data in background if enabled
        if (autoSync) {
          // Small delay to ensure UI updates with cached data first
          setTimeout(() => {
            syncLiveData();
          }, 100);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load data');
        setError(error);
        console.error('Failed to initialize FTV sync:', error);
        setIsLoading(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  return {
    data,
    isLoading,
    isSyncing,
    metadata,
    error,
    refresh,
    syncNow,
  };
}
