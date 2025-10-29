import { 
  ProcessedBKKAlert, 
  ProcessedVehiclePosition,
  getVehicleType,
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

  /**
   * Load GTFS data from CSV files
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
  
  private static determineCategoryFromGTFSRoutes(routeIds: string[]): 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' {
    // Determine category based on GTFS route types
    for (const routeId of routeIds) {
      const gtfsRoute = this.getRouteDetails(routeId);
      if (gtfsRoute) {
        switch (gtfsRoute.route_type) {
          case '0': // Tram, Streetcar, Light rail
          case '900': // Tram
            return 'villamos';
          case '1': // Subway, Metro
            return 'metro';
          case '3': // Bus
          case '700': // Bus
          case '800': // Trolleybus
            // Check if it's a night bus
            if (gtfsRoute.route_short_name.includes('9') && gtfsRoute.route_short_name.length === 3) {
              return 'ejszakai';
            }
            return 'busz';
          case '2': // Rail
          case '100': // Railway
            return 'hev';
          default:
            // If we can't determine from route type, use route name patterns
            if (gtfsRoute.route_short_name.match(/^M[0-9]$/)) {
              return 'metro';
            } else if (gtfsRoute.route_short_name.match(/^9[0-9]{2}$/)) {
              return 'ejszakai';
            } else if (gtfsRoute.route_short_name.match(/^[0-9]+$/)) {
              return 'busz';
            } else if (gtfsRoute.route_short_name.match(/^[0-9]+[A-Z]?$/)) {
              return 'villamos';
            }
        }
      }
    }
    
    // Fallback: if no GTFS data available, use the old method
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
      if (routeMatch) {
        routeId = routeMatch[1];
        const gtfsRoute = this.getRouteDetails(routeId);
        routeName = gtfsRoute ? gtfsRoute.route_short_name : routeId;
      }
      
      // Extract position
      const latMatch = entityText.match(/latitude: ([0-9.-]+)/);
      const lonMatch = entityText.match(/longitude: ([0-9.-]+)/);
      const lat = latMatch ? parseFloat(latMatch[1]) : 0;
      const lng = lonMatch ? parseFloat(lonMatch[1]) : 0;
      
      // Extract timestamp
      const timestampMatch = entityText.match(/timestamp: (\d+)/);
      const timestamp = timestampMatch ? new Date(parseInt(timestampMatch[1]) * 1000) : new Date();
      
      return {
        vehicleId: id,
        routeId,
        routeName,
        position: {
          lat,
          lng
        },
        timestamp,
        vehicleType: getVehicleType(routeName),
        status: 'UNKNOWN'
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
  
  private static determineCategoryFromRoutes(routes: string[]): 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' {
    if (routes.length === 0) return 'busz';
    
    const types = routes.map(route => getVehicleType(route));
    const uniqueTypes = [...new Set(types)];
    
    if (uniqueTypes.length === 1) {
      return uniqueTypes[0];
    }
    
    const typeCounts = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommon = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo';
    
    return mostCommon;
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