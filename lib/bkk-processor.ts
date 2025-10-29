import { 
  ProcessedBKKAlert, 
  ProcessedVehiclePosition,
  calculateDistance
} from './bkk-types';

// GTFS Data interfaces
interface GTFSRoute {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
  route_color: string;
}

interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_code?: string;
}

export class BKKDataProcessor {
  private static gtfsRoutes: Map<string, GTFSRoute> = new Map();
  private static gtfsStops: Map<string, GTFSStop> = new Map();
  private static gtfsLoaded = false;

  // Cache for real-time data with timestamps
  private static alertsCache: {
    data: ProcessedBKKAlert[] | null;
    timestamp: number;
    loading: Promise<ProcessedBKKAlert[]> | null;
  } = { data: null, timestamp: 0, loading: null };

  private static vehiclesCache: {
    data: ProcessedVehiclePosition[] | null;
    timestamp: number;
    loading: Promise<ProcessedVehiclePosition[]> | null;
  } = { data: null, timestamp: 0, loading: null };

  private static tripUpdatesCache: {
    data: string | null;
    timestamp: number;
    loading: Promise<string> | null;
  } = { data: null, timestamp: 0, loading: null };

  // Cache duration: 2 minutes (120000ms) - BKK data updates every ~30 seconds but we don't need it that fresh
  private static readonly CACHE_DURATION = 120000;

  /**
   * Load GTFS data from CSV files (static data, rarely changes)
   */
  static async loadGTFSData(): Promise<void> {
    if (this.gtfsLoaded) return;

    try {
      // Load routes
      const routesResponse = await fetch('/BKK Examples/GTFS/routes.txt');
      const routesText = await routesResponse.text();
      this.parseGTFSRoutes(routesText);

      // Load stops
      const stopsResponse = await fetch('/BKK Examples/GTFS/stops.txt');
      const stopsText = await stopsResponse.text();
      this.parseGTFSStops(stopsText);

      this.gtfsLoaded = true;
      console.log(`Loaded ${this.gtfsRoutes.size} routes and ${this.gtfsStops.size} stops from GTFS data`);
    } catch (error) {
      console.error('Failed to load GTFS data:', error);
    }
  }

  /**
   * Check if cached data is still valid
   */
  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  /**
   * Fetch real-time BKK Alerts with caching and singleton pattern
   */
  static async fetchRealTimeAlerts(): Promise<ProcessedBKKAlert[]> {
    // Return cached data if still valid
    if (this.alertsCache.data && this.isCacheValid(this.alertsCache.timestamp)) {
      console.log('Returning cached alerts data');
      return this.alertsCache.data;
    }

    // If already loading, wait for that request
    if (this.alertsCache.loading) {
      console.log('Waiting for ongoing alerts request...');
      return await this.alertsCache.loading;
    }

    // Start new request
    console.log('Fetching fresh alerts data from backend...');
    this.alertsCache.loading = this.performAlertsRequest();

    try {
      const result = await this.alertsCache.loading;
      this.alertsCache.data = result;
      this.alertsCache.timestamp = Date.now();
      return result;
    } finally {
      this.alertsCache.loading = null;
    }
  }

  private static async performAlertsRequest(): Promise<ProcessedBKKAlert[]> {
    try {
      // Ensure GTFS data is loaded
      await this.loadGTFSData();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Fetch from backend API (Django)
      const backendUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000/api/bkk/Alerts'
        : 'https://ikapi.szlg.info/api/bkk/Alerts';
      
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const alertsText = await response.text();
      console.log(`Received alerts data from backend: ${(alertsText.length / 1024).toFixed(1)}KB`);
      return await this.parseAlertsFromText(alertsText);
    } catch (error) {
      console.error('Failed to fetch real-time alerts from backend:', error);
      
      // Fallback to example data
      console.log('Falling back to example alerts data...');
      return await this.fetchExampleAlerts();
    }
  }

  /**
   * Fetch real-time BKK Vehicle Positions with caching and singleton pattern
   */
  static async fetchRealTimeVehiclePositions(): Promise<ProcessedVehiclePosition[]> {
    // Return cached data if still valid
    if (this.vehiclesCache.data && this.isCacheValid(this.vehiclesCache.timestamp)) {
      console.log('Returning cached vehicle positions data');
      return this.vehiclesCache.data;
    }

    // If already loading, wait for that request
    if (this.vehiclesCache.loading) {
      console.log('Waiting for ongoing vehicle positions request...');
      return await this.vehiclesCache.loading;
    }

    // Start new request
    console.log('Fetching fresh vehicle positions data from backend...');
    this.vehiclesCache.loading = this.performVehiclePositionsRequest();

    try {
      const result = await this.vehiclesCache.loading;
      this.vehiclesCache.data = result;
      this.vehiclesCache.timestamp = Date.now();
      return result;
    } finally {
      this.vehiclesCache.loading = null;
    }
  }

  private static async performVehiclePositionsRequest(): Promise<ProcessedVehiclePosition[]> {
    try {
      // Ensure GTFS data is loaded
      await this.loadGTFSData();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Fetch from backend API (Django)
      const backendUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000/api/bkk/VehiclePositions'
        : 'https://ikapi.szlg.info/api/bkk/VehiclePositions';
      
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const positionsText = await response.text();
      console.log(`Received vehicle positions data from backend: ${(positionsText.length / 1024).toFixed(1)}KB`);
      
      // Parse vehicle positions
      const vehicles = await this.parseVehiclePositionsFromText(positionsText);
      
      // Fetch trip updates to enrich with delay information
      try {
        const tripUpdatesText = await this.fetchRealTimeTripUpdates();
        if (tripUpdatesText) {
          const delayMap = this.parseTripUpdatesForDelays(tripUpdatesText);
          console.log(`Parsed ${delayMap.size} trip delays from updates`);
          
          // Enrich vehicles with delay information
          vehicles.forEach(vehicle => {
            if (vehicle.tripId && delayMap.has(vehicle.tripId)) {
              const delaySeconds = delayMap.get(vehicle.tripId)!;
              vehicle.delayMinutes = Math.round(delaySeconds / 60);
              vehicle.hasDelay = Math.abs(vehicle.delayMinutes) > 2; // Consider it delayed if >2 minutes
            }
          });
        }
      } catch (error) {
        console.warn('Failed to enrich with trip updates, continuing without delay data:', error);
      }
      
      return vehicles;
    } catch (error) {
      console.error('Failed to fetch real-time vehicle positions from backend:', error);
      
      // Fallback to example data
      console.log('Falling back to example vehicle positions data...');
      return await this.fetchExampleVehiclePositions();
    }
  }

  /**
   * Fetch real-time BKK Trip Updates with caching and singleton pattern
   */
  static async fetchRealTimeTripUpdates(): Promise<string> {
    // Return cached data if still valid
    if (this.tripUpdatesCache.data && this.isCacheValid(this.tripUpdatesCache.timestamp)) {
      console.log('Returning cached trip updates data');
      return this.tripUpdatesCache.data;
    }

    // If already loading, wait for that request
    if (this.tripUpdatesCache.loading) {
      console.log('Waiting for ongoing trip updates request...');
      return await this.tripUpdatesCache.loading;
    }

    // Start new request
    console.log('Fetching fresh trip updates data from backend...');
    this.tripUpdatesCache.loading = this.performTripUpdatesRequest();

    try {
      const result = await this.tripUpdatesCache.loading;
      this.tripUpdatesCache.data = result;
      this.tripUpdatesCache.timestamp = Date.now();
      return result;
    } finally {
      this.tripUpdatesCache.loading = null;
    }
  }

  private static async performTripUpdatesRequest(): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Fetch from backend API (Django)
      const backendUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000/api/bkk/TripUpdates'
        : 'https://ikapi.szlg.info/api/bkk/TripUpdates';
      
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tripUpdatesText = await response.text();
      console.log(`Received trip updates data from backend: ${(tripUpdatesText.length / 1024).toFixed(1)}KB`);
      return tripUpdatesText;
    } catch (error) {
      console.error('Failed to fetch real-time trip updates from backend:', error);
      return '';
    }
  }

  /**
   * Clear all caches (useful for forcing refresh)
   */
  static clearCaches(): void {
    console.log('Clearing all BKK data caches');
    this.alertsCache = { data: null, timestamp: 0, loading: null };
    this.vehiclesCache = { data: null, timestamp: 0, loading: null };
    this.tripUpdatesCache = { data: null, timestamp: 0, loading: null };
  }

  /**
   * Get cache status for debugging
   */
  static getCacheStatus(): {
    alerts: { cached: boolean; age: number };
    vehicles: { cached: boolean; age: number };
    tripUpdates: { cached: boolean; age: number };
  } {
    const now = Date.now();
    return {
      alerts: {
        cached: !!this.alertsCache.data && this.isCacheValid(this.alertsCache.timestamp),
        age: this.alertsCache.timestamp ? now - this.alertsCache.timestamp : 0
      },
      vehicles: {
        cached: !!this.vehiclesCache.data && this.isCacheValid(this.vehiclesCache.timestamp),
        age: this.vehiclesCache.timestamp ? now - this.vehiclesCache.timestamp : 0
      },
      tripUpdates: {
        cached: !!this.tripUpdatesCache.data && this.isCacheValid(this.tripUpdatesCache.timestamp),
        age: this.tripUpdatesCache.timestamp ? now - this.tripUpdatesCache.timestamp : 0
      }
    };
  }

  /**
   * Fallback method to fetch example alerts
   */
  static async fetchExampleAlerts(): Promise<ProcessedBKKAlert[]> {
    try {
      const alertsResponse = await fetch('/BKK Examples/Alerts.txt');
      const alertsText = await alertsResponse.text();
      return await this.parseAlertsFromText(alertsText);
    } catch (error) {
      console.error('Failed to fetch example alerts:', error);
      return [];
    }
  }

  /**
   * Fallback method to fetch example vehicle positions
   */
  static async fetchExampleVehiclePositions(): Promise<ProcessedVehiclePosition[]> {
    try {
      const vehiclesResponse = await fetch('/BKK Examples/VehiclePositions.txt');
      const vehiclesText = await vehiclesResponse.text();
      return await this.parseVehiclePositionsFromText(vehiclesText);
    } catch (error) {
      console.error('Failed to fetch example vehicle positions:', error);
      return [];
    }
  }

  private static parseGTFSRoutes(csvText: string): void {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length >= headers.length) {
        const route: GTFSRoute = {
          route_id: values[headers.indexOf('route_id')],
          route_short_name: values[headers.indexOf('route_short_name')],
          route_long_name: values[headers.indexOf('route_long_name')],
          route_type: values[headers.indexOf('route_type')],
          route_color: values[headers.indexOf('route_color')] || '009EE3'
        };
        this.gtfsRoutes.set(route.route_id, route);
      }
    }
  }

  private static parseGTFSStops(csvText: string): void {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length >= headers.length) {
        const stop: GTFSStop = {
          stop_id: values[headers.indexOf('stop_id')],
          stop_name: values[headers.indexOf('stop_name')],
          stop_lat: parseFloat(values[headers.indexOf('stop_lat')]),
          stop_lon: parseFloat(values[headers.indexOf('stop_lon')]),
          stop_code: values[headers.indexOf('stop_code')] || undefined
        };
        this.gtfsStops.set(stop.stop_id, stop);
      }
    }
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Get route details from GTFS data
   */
  static getRouteDetails(routeId: string): GTFSRoute | null {
    return this.gtfsRoutes.get(routeId) || null;
  }

  /**
   * Get stop details from GTFS data
   */
  static getStopDetails(stopId: string): GTFSStop | null {
    return this.gtfsStops.get(stopId) || null;
  }

  /**
   * Parse BKK Alerts from the example text format with GTFS data enrichment
   */
  static async parseAlertsFromText(alertsText: string): Promise<ProcessedBKKAlert[]> {
    // Ensure GTFS data is loaded
    await this.loadGTFSData();
    
    const alerts: ProcessedBKKAlert[] = [];
    
    try {
      // Use regex to find complete entity blocks instead of splitting
      const entityPattern = /entity \{[\s\S]*?\n\}/g;
      const entityMatches = [...alertsText.matchAll(entityPattern)];
      
      for (const match of entityMatches) {
        try {
          const entityText = match[0];
          const alert = this.parseAlertEntity(entityText);
          if (alert) {
            alerts.push(alert);
          }
        } catch (error) {
          console.warn('Failed to parse alert entity:', error);
        }
      }
    } catch (error) {
      console.error('Failed to parse alerts text:', error);
    }
    
    return alerts;
  }
  
  private static parseAlertEntity(entityText: string): ProcessedBKKAlert | null {
    try {
      // Extract ID
      const idMatch = entityText.match(/id: "([^"]+)"/);
      if (!idMatch) return null;
      
      const id = idMatch[1];
      
      // Extract Hungarian header text
      let title = 'Ismeretlen zavar';
      const headerSectionMatch = entityText.match(/header_text \{([\s\S]*?)\n    \}/);
      if (headerSectionMatch) {
        const headerSection = headerSectionMatch[1];
        const allTranslations = [...headerSection.matchAll(/translation \{([\s\S]*?)\n      \}/g)];
        const huTranslation = allTranslations.find(translation => {
          return translation[1].includes('language: "hu"');
        });
        
        if (huTranslation) {
          const textMatch = huTranslation[1].match(/text: "([^"]+)"/);
          if (textMatch) {
            title = this.decodeHtml(textMatch[1]);
          }
        }
      }
      
      // Extract Hungarian description text
      let description = '';
      const descSectionMatch = entityText.match(/description_text \{([\s\S]*?)\n    \}/);
      if (descSectionMatch) {
        const descSection = descSectionMatch[1];
        const allTranslations = [...descSection.matchAll(/translation \{([\s\S]*?)\n      \}/g)];
        const huTranslation = allTranslations.find(translation => {
          return translation[1].includes('language: "hu"');
        });
        
        if (huTranslation) {
          const textMatch = huTranslation[1].match(/text: "([^"]+)"/);
          if (textMatch) {
            description = this.decodeHtml(textMatch[1]);
          }
        }
      }

      // Extract affected routes and enrich with GTFS data
      const routeMatches = entityText.match(/route_id: "([^"]+)"/g) || [];
      const rawRoutes = routeMatches.map(match => match.match(/"([^"]+)"/)![1]);
      const uniqueRawRoutes = [...new Set(rawRoutes)];
      
      // Enrich routes with GTFS data - convert BKK internal IDs to display names
      const affectedRoutes = uniqueRawRoutes
        .map(routeId => {
          const gtfsRoute = this.getRouteDetails(routeId);
          return gtfsRoute ? gtfsRoute.route_short_name : routeId;
        })
        .filter(route => route); // Remove empty routes
      
      // Extract other fields
      const startMatch = entityText.match(/start: (\d+)/);
      const endMatch = entityText.match(/end: (\d+)/);
      const startTime = startMatch ? new Date(parseInt(startMatch[1]) * 1000) : undefined;
      const endTime = endMatch ? new Date(parseInt(endMatch[1]) * 1000) : undefined;
      
      const urlSectionMatch = entityText.match(/url \{([\s\S]*?)\n    \}/);
      let url: string | undefined;
      if (urlSectionMatch) {
        const urlSection = urlSectionMatch[1];
        const allTranslations = [...urlSection.matchAll(/translation \{([\s\S]*?)\n      \}/g)];
        const huTranslation = allTranslations.find(translation => {
          return translation[1].includes('language: "hu"');
        });
        
        if (huTranslation) {
          const textMatch = huTranslation[1].match(/text: "([^"]+)"/);
          if (textMatch) {
            url = textMatch[1];
          }
        }
      }
      
      const causeMatch = entityText.match(/cause: (\w+)/);
      const effectMatch = entityText.match(/effect: (\w+)/);
      const cause = causeMatch ? causeMatch[1] : '';
      const effect = effectMatch ? effectMatch[1] : '';
      
      const priorityMatch = entityText.match(/priority: (\d+)/);
      const priority = priorityMatch ? parseInt(priorityMatch[1]) : 2;
      
      // Determine category based on GTFS route types
      const category = this.determineCategoryFromGTFSRoutes(uniqueRawRoutes);
      
      return {
        id,
        title,
        description,
        affectedRoutes,
        startTime,
        endTime,
        url,
        category,
        priority,
        effect,
        cause
      };
    } catch (error) {
      console.warn('Failed to parse alert entity:', error);
      return null;
    }
  }
  
  private static determineCategoryFromGTFSRoutes(routeIds: string[]): 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat' {
    // Determine category based on GTFS route types
    for (const routeId of routeIds) {
      const gtfsRoute = this.getRouteDetails(routeId);
      if (gtfsRoute) {
        // First check route_short_name patterns for special cases
        const shortName = gtfsRoute.route_short_name;
        
        // MÁV trains: GXX, ZXX, SXX, IC patterns (not BKK)
        if (shortName.match(/^(G|Z|S)\d+$/) || shortName.match(/^IC\d*$/i)) {
          return 'vonat';
        }
        
        // HÉV lines: route_type 109 or short name starts with H
        if (gtfsRoute.route_type === '109' || shortName.startsWith('H')) {
          return 'hev';
        }
        
        // Boat lines: route_type 4 or short name starts with D
        if (gtfsRoute.route_type === '4' || shortName.startsWith('D')) {
          return 'hajo';
        }
        
        // Metro lines: route_type 1 or short name is M1-M4
        if (gtfsRoute.route_type === '1' || shortName.match(/^M[1-4]$/)) {
          return 'metro';
        }
        
        // Night lines: route_short_name starts with 9 and is 3 digits
        if (shortName.match(/^9[0-9]{2}$/)) {
          return 'ejszakai';
        }
        
        // Tram: route_type 0
        if (gtfsRoute.route_type === '0') {
          return 'villamos';
        }
        
        // Trolleybus: route_type 11
        if (gtfsRoute.route_type === '11') {
          return 'troli';
        }
        
        // Bus: route_type 3
        if (gtfsRoute.route_type === '3') {
          return 'busz';
        }
        
        // Fallback patterns based on short name
        if (shortName.match(/^[0-9]{1,2}[A-Z]?$/)) {
          return 'villamos';
        }
        if (shortName.match(/^7[0-9]$/) || shortName.match(/^8[0-3]$/)) {
          return 'troli';
        }
      }
    }
    
    // Final fallback: use pattern matching on route short names
    return this.determineCategoryFromRoutes(routeIds.map(id => {
      const route = this.getRouteDetails(id);
      return route ? route.route_short_name : id;
    }));
  }
  
  /**
   * Parse Vehicle Positions from the example text format with GTFS enrichment
   */
  static async parseVehiclePositionsFromText(positionsText: string): Promise<ProcessedVehiclePosition[]> {
    // Ensure GTFS data is loaded
    await this.loadGTFSData();
    
    const vehicles: ProcessedVehiclePosition[] = [];
    
    try {
      // Use regex to find complete entity blocks
      const entityPattern = /entity \{[\s\S]*?\n\}/g;
      const entityMatches = [...positionsText.matchAll(entityPattern)];
      
      for (const match of entityMatches) {
        try {
          const entityText = match[0];
          const vehicle = this.parseVehicleEntity(entityText);
          if (vehicle) {
            vehicles.push(vehicle);
          }
        } catch (error) {
          console.warn('Failed to parse vehicle entity:', error);
        }
      }
    } catch (error) {
      console.error('Failed to parse vehicle positions text:', error);
    }
    
    return vehicles;
  }
  
  private static parseVehicleEntity(entityText: string): ProcessedVehiclePosition | null {
    try {
      // Extract vehicle ID
      const idMatch = entityText.match(/id: "([^"]+)"/);
      if (!idMatch) return null;
      
      const id = idMatch[1];
      
      // Extract route ID and enrich with GTFS data
      const routeMatch = entityText.match(/route_id: "([^"]+)"/);
      let routeId = '';
      let routeName = '';
      let vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat' = 'busz';
      
      if (routeMatch) {
        routeId = routeMatch[1];
        const gtfsRoute = this.getRouteDetails(routeId);
        routeName = gtfsRoute ? gtfsRoute.route_short_name : routeId;
        
        // Determine vehicle type from GTFS route data (same logic as alerts)
        vehicleType = this.determineCategoryFromGTFSRoutes([routeId]);
      }
      
      // Extract position
      const latMatch = entityText.match(/latitude: ([0-9.-]+)/);
      const lonMatch = entityText.match(/longitude: ([0-9.-]+)/);
      const lat = latMatch ? parseFloat(latMatch[1]) : 0;
      const lng = lonMatch ? parseFloat(lonMatch[1]) : 0;
      
      // Extract additional position data
      const bearingMatch = entityText.match(/bearing: ([0-9.-]+)/);
      const bearing = bearingMatch ? parseFloat(bearingMatch[1]) : undefined;
      
      const speedMatch = entityText.match(/speed: ([0-9.-]+)/);
      const speed = speedMatch ? parseFloat(speedMatch[1]) : undefined;
      
      // Extract timestamp
      const timestampMatch = entityText.match(/timestamp: (\d+)/);
      const timestamp = timestampMatch ? new Date(parseInt(timestampMatch[1]) * 1000) : new Date();
      
      // Extract current status
      const statusMatch = entityText.match(/current_status: ([A-Z_]+)/);
      const status = statusMatch ? statusMatch[1] : 'UNKNOWN';
      
      // Extract stop information and get stop name from GTFS
      const stopIdMatch = entityText.match(/stop_id: "([^"]+)"/);
      const stopId = stopIdMatch ? stopIdMatch[1] : undefined;
      const stopName = stopId ? this.getStopDetails(stopId)?.stop_name : undefined;
      
      // Extract license plate if available
      const licensePlateMatch = entityText.match(/license_plate: "([^"]+)"/);
      const licensePlate = licensePlateMatch ? licensePlateMatch[1] : undefined;
      
      // Extract vehicle label
      const labelMatch = entityText.match(/label: "([^"]+)"/);
      const label = labelMatch ? labelMatch[1] : undefined;
      
      // Extract trip ID for reference
      const tripIdMatch = entityText.match(/trip_id: "([^"]+)"/);
      const tripId = tripIdMatch ? tripIdMatch[1] : undefined;
      
      return {
        vehicleId: id,
        routeId,
        routeName,
        position: {
          lat,
          lng,
          bearing,
          speed
        },
        timestamp,
        vehicleType,
        status,
        currentStop: stopName || stopId,
        licensePlate,
        label,
        tripId
      };
    } catch (error) {
      console.warn('Failed to parse vehicle entity:', error);
      return null;
    }
  }
  
  static findNearbyVehicles(vehicles: ProcessedVehiclePosition[], userLocation: { lat: number; lng: number }, radiusMeters: number = 500): ProcessedVehiclePosition[] {
    return vehicles.filter(vehicle => {
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        vehicle.position.lat, vehicle.position.lng
      );
      return distance <= radiusMeters;
    });
  }
  
  static checkVehicleDelays(vehicle: ProcessedVehiclePosition, alerts: ProcessedBKKAlert[]): boolean {
    return alerts.some(alert => 
      alert.affectedRoutes.includes(vehicle.routeName) ||
      alert.affectedRoutes.includes(vehicle.routeId)
    );
  }
  
  static getActiveAlerts(alerts: ProcessedBKKAlert[]): ProcessedBKKAlert[] {
    if (!Array.isArray(alerts)) {
      console.warn('getActiveAlerts: alerts is not an array:', alerts);
      return [];
    }
    
    const now = new Date();
    return alerts.filter(alert => {
      if (!alert.startTime) return true;
      if (alert.startTime > now) return false;
      if (alert.endTime && alert.endTime < now) return false;
      return true;
    });
  }
  
  private static determineCategoryFromRoutes(routes: string[]): 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat' {
    if (routes.length === 0) return 'busz';
    
    // Simple pattern-based detection for route short names
    for (const route of routes) {
      // MÁV trains: GXX, ZXX, SXX, IC patterns
      if (route.match(/^(G|Z|S)\d+$/) || route.match(/^IC\d*$/i)) return 'vonat';
      // HÉV lines start with H
      if (route.startsWith('H')) return 'hev';
      // Metro lines are M1-M4
      if (route.match(/^M[1-4]$/)) return 'metro';
      // Boat lines start with D
      if (route.startsWith('D')) return 'hajo';
      // Night lines start with 9
      if (route.startsWith('9') && route.length === 3) return 'ejszakai';
      // Tram lines are single/double digit numbers
      if (route.match(/^[0-9]{1,2}[A-Z]?$/)) return 'villamos';
      // Trolleybus lines are 70-83
      if (route.match(/^7[0-9]$/) || route.match(/^8[0-3]$/)) return 'troli';
    }
    
    // Default to bus
    return 'busz';
  }
  
  /**
   * Parse trip updates to extract delay information
   * Returns a Map of tripId -> delay in seconds
   */
  private static parseTripUpdatesForDelays(tripUpdatesText: string): Map<string, number> {
    const delayMap = new Map<string, number>();
    
    try {
      // Use regex to find complete entity blocks
      const entityPattern = /entity \{[\s\S]*?\n\}/g;
      const entityMatches = [...tripUpdatesText.matchAll(entityPattern)];
      
      for (const match of entityMatches) {
        try {
          const entityText = match[0];
          
          // Extract trip ID
          const tripIdMatch = entityText.match(/trip_id: "([^"]+)"/);
          if (!tripIdMatch) continue;
          const tripId = tripIdMatch[1];
          
          // Find all stop_time_update blocks
          const stopTimeUpdatePattern = /stop_time_update \{[\s\S]*?\n    \}/g;
          const stopTimeUpdates = [...entityText.matchAll(stopTimeUpdatePattern)];
          
          let totalDelay = 0;
          let delayCount = 0;
          
          for (const stopMatch of stopTimeUpdates) {
            const stopText = stopMatch[0];
            
            // Extract actual arrival time
            const arrivalTimeMatch = stopText.match(/arrival \{[^}]*time: (\d+)/);
            // Extract scheduled arrival time (inside [realcity.stop_time_update])
            const scheduledArrivalMatch = stopText.match(/scheduled_arrival \{[^}]*time: (\d+)/);
            
            if (arrivalTimeMatch && scheduledArrivalMatch) {
              const actualTime = parseInt(arrivalTimeMatch[1]);
              const scheduledTime = parseInt(scheduledArrivalMatch[1]);
              const delay = actualTime - scheduledTime; // Positive = late, negative = early
              
              totalDelay += delay;
              delayCount++;
            }
          }
          
          // Use average delay across all stops for this trip
          if (delayCount > 0) {
            const avgDelay = Math.round(totalDelay / delayCount);
            delayMap.set(tripId, avgDelay);
          }
        } catch {
          // Skip problematic entries
        }
      }
      
      console.log(`Parsed delays for ${delayMap.size} trips`);
    } catch (error) {
      console.error('Failed to parse trip updates:', error);
    }
    
    return delayMap;
  }
  
  private static decodeHtml(text: string): string {
    return text
      .replace(/\\303\\241/g, 'á')
      .replace(/\\303\\251/g, 'é')
      .replace(/\\303\\255/g, 'í')
      .replace(/\\303\\263/g, 'ó')
      .replace(/\\303\\266/g, 'ö')
      .replace(/\\305\\221/g, 'ő')
      .replace(/\\303\\272/g, 'ú')
      .replace(/\\303\\274/g, 'ü')
      .replace(/\\305\\261/g, 'ű')
      .replace(/\\302\\240/g, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}