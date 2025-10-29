/**
 * BKK Data Manager - Singleton pattern for managing BKK real-time data
 * 
 * This manager ensures that multiple components don't trigger multiple
 * network requests to the large BKK GTFS-RT endpoints.
 */

import { BKKDataProcessor } from './bkk-processor';
import { ProcessedBKKAlert, ProcessedVehiclePosition } from './bkk-types';

export class BKKDataManager {
  private static instance: BKKDataManager | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  
  // Data storage
  private alerts: ProcessedBKKAlert[] = [];
  private vehicles: ProcessedVehiclePosition[] = [];
  private lastUpdateTime = 0;
  
  // Event listeners for data updates
  private listeners: Set<(data: { alerts: ProcessedBKKAlert[]; vehicles: ProcessedVehiclePosition[] }) => void> = new Set();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): BKKDataManager {
    if (!this.instance) {
      this.instance = new BKKDataManager();
    }
    return this.instance;
  }

  /**
   * Initialize or refresh BKK data
   * Multiple calls to this method will not trigger multiple network requests
   */
  async initializeData(forceRefresh = false): Promise<{ alerts: ProcessedBKKAlert[]; vehicles: ProcessedVehiclePosition[] }> {
    // If already initializing, wait for that to complete
    if (this.initializationPromise) {
      console.log('BKKDataManager: Already initializing, waiting...');
      await this.initializationPromise;
      return { alerts: this.alerts, vehicles: this.vehicles };
    }

    // If recently initialized and not forced refresh, return cached data
    if (this.isInitialized && !forceRefresh && (Date.now() - this.lastUpdateTime) < 120000) {
      console.log('BKKDataManager: Returning cached data');
      return { alerts: this.alerts, vehicles: this.vehicles };
    }

    // Start initialization process
    console.log('BKKDataManager: Starting data fetch...');
    this.initializationPromise = this.performDataFetch();

    try {
      await this.initializationPromise;
      return { alerts: this.alerts, vehicles: this.vehicles };
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performDataFetch(): Promise<void> {
    try {
      console.log('BKKDataManager: Fetching real-time data...');
      
      // Fetch both alerts and vehicles in parallel to minimize total loading time
      const [alerts, vehicles] = await Promise.all([
        BKKDataProcessor.fetchRealTimeAlerts(),
        BKKDataProcessor.fetchRealTimeVehiclePositions()
      ]);

      this.alerts = alerts;
      this.vehicles = vehicles;
      this.lastUpdateTime = Date.now();
      this.isInitialized = true;

      console.log(`BKKDataManager: Successfully loaded ${alerts.length} alerts and ${vehicles.length} vehicles`);

      // Notify all listeners
      this.notifyListeners();
    } catch (error) {
      console.error('BKKDataManager: Failed to fetch data:', error);
      
      // If this was the first initialization attempt, ensure we have some data
      if (!this.isInitialized) {
        this.alerts = [];
        this.vehicles = [];
        this.isInitialized = true;
      }
      
      throw error;
    }
  }

  /**
   * Get current data without triggering a refresh
   */
  getCurrentData(): { alerts: ProcessedBKKAlert[]; vehicles: ProcessedVehiclePosition[]; isStale: boolean } {
    const isStale = !this.isInitialized || (Date.now() - this.lastUpdateTime) > 120000;
    return {
      alerts: this.alerts,
      vehicles: this.vehicles,
      isStale
    };
  }

  /**
   * Subscribe to data updates
   */
  subscribe(callback: (data: { alerts: ProcessedBKKAlert[]; vehicles: ProcessedVehiclePosition[] }) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const data = { alerts: this.alerts, vehicles: this.vehicles };
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('BKKDataManager: Error in listener callback:', error);
      }
    });
  }

  /**
   * Force refresh data (useful for debugging or user-triggered refresh)
   */
  async refreshData(): Promise<{ alerts: ProcessedBKKAlert[]; vehicles: ProcessedVehiclePosition[] }> {
    return await this.initializeData(true);
  }

  /**
   * Get cache status for debugging
   */
  getStatus(): {
    isInitialized: boolean;
    lastUpdateTime: number;
    dataAge: number;
    alertsCount: number;
    vehiclesCount: number;
    isLoading: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      lastUpdateTime: this.lastUpdateTime,
      dataAge: this.lastUpdateTime ? Date.now() - this.lastUpdateTime : 0,
      alertsCount: this.alerts.length,
      vehiclesCount: this.vehicles.length,
      isLoading: !!this.initializationPromise
    };
  }

  /**
   * Clear all data and reset state
   */
  reset(): void {
    console.log('BKKDataManager: Resetting all data');
    this.isInitialized = false;
    this.initializationPromise = null;
    this.alerts = [];
    this.vehicles = [];
    this.lastUpdateTime = 0;
    this.listeners.clear();
    
    // Also clear the processor cache
    BKKDataProcessor.clearCaches();
  }
}

// Export singleton instance
export const bkkDataManager = BKKDataManager.getInstance();