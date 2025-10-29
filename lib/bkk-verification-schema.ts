/**
 * BKK Verification Schema
 * 
 * This schema defines the structure for storing BKK verification data
 * that will be sent to the backend and stored in the database.
 * 
 * It supports two types of verification:
 * 1. Disruption-based: Student selects from real-time BKK disruption/alert list
 * 2. Vehicle-based: Student selects a nearby vehicle, system checks for trip modifications
 */

import { ProcessedBKKAlert, ProcessedVehiclePosition } from './bkk-types';

// Base interface for all BKK verifications
export interface BKKVerificationBase {
  /** Type of verification performed */
  type: 'disruption' | 'vehicle_modification';
  
  /** Timestamp when the verification was captured (ISO string) */
  timestamp: string;
  
  /** User's location at the time of verification (if available) */
  user_location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  
  /** Description text that was displayed to the student */
  description: string;
  
  /** Official BKK verification URL (if applicable) */
  bkk_url?: string;
  
  /** Additional metadata for debugging/audit purposes */
  metadata: {
    /** Which data source was used (alerts.txt, real-time API, etc.) */
    data_source: string;
    /** Version or timestamp of the data source */
    data_version?: string;
    /** Any additional context */
    context?: Record<string, unknown>;
  };
}

// Disruption-based verification (from BKK alerts)
export interface BKKDisruptionVerification extends BKKVerificationBase {
  type: 'disruption';
  
  /** Complete alert data as it was displayed to the user */
  alert_data: {
    /** Unique alert ID from BKK */
    id: string;
    
    /** Alert title/header as displayed */
    title: string;
    
    /** Full alert description as displayed */
    description: string;
    
    /** Affected routes */
    affected_routes: string[];
    
    /** Alert severity/priority */
    priority: number;
    
    /** Alert category (busz, villamos, metro, etc.) */
    category: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo';
    
    /** Alert effect type */
    effect: string;
    
    /** Alert cause */
    cause: string;
    
    /** Alert active period */
    active_period: {
      start: string; // ISO datetime
      end?: string;  // ISO datetime
    };
    
    /** Original BKK URL for this alert */
    url?: string;
  };
}

// Vehicle modification verification (based on trip updates)
export interface BKKVehicleVerification extends BKKVerificationBase {
  type: 'vehicle_modification';
  
  /** Complete vehicle data as it was displayed to the user */
  vehicle_data: {
    /** Unique vehicle ID */
    vehicle_id: string;
    
    /** Route information */
    route: {
      /** Route ID (e.g., "1", "M3", "5") */
      id: string;
      /** Route display name */
      name: string;
      /** Vehicle type */
      type: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo';
    };
    
    /** Vehicle position at time of verification */
    position: {
      latitude: number;
      longitude: number;
      bearing?: number;
      speed?: number;
    };
    
    /** Vehicle details */
    vehicle_info: {
      /** License plate (if available) */
      license_plate?: string;
      /** Vehicle label/number */
      label: string;
      /** Current status */
      status: string;
      /** Current stop (if at a stop) */
      current_stop?: string;
    };
    
    /** Trip modification details */
    trip_modifications: {
      /** Whether any delays were detected */
      has_delays: boolean;
      
      /** Planned vs actual schedule comparison */
      schedule_comparison?: {
        /** Planned arrival/departure times */
        planned_times: Record<string, string>;
        /** Actual times (if available) */
        actual_times: Record<string, string>;
        /** Calculated delays in seconds */
        delays: Record<string, number>;
      };
      
      /** Related alerts affecting this vehicle */
      related_alerts: string[]; // Alert IDs
    };
    
    /** Distance from user to vehicle (meters) */
    distance_from_user?: number;
    
    /** Data timestamp from BKK feed */
    data_timestamp: string; // ISO datetime
  };
  
  /** GTFS route validation results */
  gtfs_validation?: {
    /** Whether route was found in GTFS data */
    route_found: boolean;
    /** GTFS route details if found */
    gtfs_route?: {
      route_id: string;
      route_short_name: string;
      route_long_name: string;
      route_type: number;
    };
  };
}

// Union type for all verification types
export type BKKVerification = BKKDisruptionVerification | BKKVehicleVerification;

// Helper functions for creating verification objects

/**
 * Creates a disruption-based verification object from a ProcessedBKKAlert
 */
export function createDisruptionVerification(
  alert: ProcessedBKKAlert,
  userLocation?: { latitude: number; longitude: number; accuracy?: number },
  dataSource: string = 'bkk_real_time_api'
): BKKDisruptionVerification {
  return {
    type: 'disruption',
    timestamp: new Date().toISOString(),
    user_location: userLocation,
    description: `Forgalmi zavar: ${alert.title} - ${alert.description}`,
    bkk_url: alert.url,
    metadata: {
      data_source: dataSource,
      data_version: new Date().toISOString(),
      context: {
        alert_priority: alert.priority,
        affected_routes_count: alert.affectedRoutes.length
      }
    },
    alert_data: {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      affected_routes: alert.affectedRoutes,
      priority: alert.priority,
      category: alert.category,
      effect: alert.effect,
      cause: alert.cause,
      active_period: {
        start: alert.startTime?.toISOString() || new Date().toISOString(),
        end: alert.endTime?.toISOString()
      },
      url: alert.url
    }
  };
}

/**
 * Creates a vehicle-based verification object from a ProcessedVehiclePosition
 */
export function createVehicleVerification(
  vehicle: ProcessedVehiclePosition,
  userLocation?: { latitude: number; longitude: number; accuracy?: number },
  hasDelays: boolean = false,
  relatedAlerts: string[] = [],
  dataSource: string = 'bkk_real_time_api'
): BKKVehicleVerification {
  return {
    type: 'vehicle_modification',
    timestamp: new Date().toISOString(),
    user_location: userLocation,
    description: `Jármű menetrend módosítás: ${vehicle.routeId} - ${vehicle.routeName}${hasDelays ? ' (késések észlelve)' : ''}`,
    metadata: {
      data_source: dataSource,
      data_version: vehicle.timestamp.toISOString(),
      context: {
        has_delays: hasDelays,
        related_alerts_count: relatedAlerts.length
      }
    },
    vehicle_data: {
      vehicle_id: vehicle.vehicleId,
      route: {
        id: vehicle.routeId,
        name: vehicle.routeName,
        type: vehicle.vehicleType
      },
      position: {
        latitude: vehicle.position.lat,
        longitude: vehicle.position.lng
      },
      vehicle_info: {
        license_plate: vehicle.licensePlate,
        label: vehicle.vehicleId,
        status: vehicle.status,
        current_stop: vehicle.currentStop
      },
      trip_modifications: {
        has_delays: hasDelays,
        related_alerts: relatedAlerts
      },
      distance_from_user: userLocation ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        vehicle.position.lat,
        vehicle.position.lng
      ) : undefined,
      data_timestamp: vehicle.timestamp.toISOString()
    }
  };
}

/**
 * Helper function to calculate distance between two coordinates
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Return distance in meters
}

/**
 * Validates a BKK verification object
 */
export function validateBKKVerification(verification: unknown): verification is BKKVerification {
  if (!verification || typeof verification !== 'object') {
    return false;
  }

  const obj = verification as Record<string, unknown>;

  // Check common required fields
  if (!obj.type || !obj.timestamp || !obj.description || !obj.metadata) {
    return false;
  }

  // Type-specific validation
  if (obj.type === 'disruption') {
    const alertData = obj.alert_data as Record<string, unknown> | undefined;
    return !!(alertData?.id && alertData?.title);
  }

  if (obj.type === 'vehicle_modification') {
    const vehicleData = obj.vehicle_data as Record<string, unknown> | undefined;
    const route = vehicleData?.route as Record<string, unknown> | undefined;
    return !!(vehicleData?.vehicle_id && route?.id);
  }

  return false;
}

// Example verification objects for documentation

export const EXAMPLE_DISRUPTION_VERIFICATION: BKKDisruptionVerification = {
  type: 'disruption',
  timestamp: '2025-10-29T14:30:00.000Z',
  user_location: {
    latitude: 47.4979,
    longitude: 19.0402,
    accuracy: 10
  },
  description: 'Forgalmi zavar: M3 metró késés - Műszaki hiba miatt 10-15 perces késések várhatók',
  bkk_url: 'https://bkk.hu/apps/alert/12345',
  metadata: {
    data_source: 'bkk_real_time_api',
    data_version: '2025-10-29T14:25:00.000Z',
    context: {
      alert_priority: 1,
      affected_routes_count: 1
    }
  },
  alert_data: {
    id: 'bkk_alert_12345',
    title: 'M3 metró késés',
    description: 'Műszaki hiba miatt 10-15 perces késések várhatók',
    affected_routes: ['M3'],
    priority: 1,
    category: 'metro',
    effect: 'SIGNIFICANT_DELAYS',
    cause: 'TECHNICAL_PROBLEM',
    active_period: {
      start: '2025-10-29T14:15:00.000Z',
      end: '2025-10-29T16:30:00.000Z'
    },
    url: 'https://bkk.hu/apps/alert/12345'
  }
};

export const EXAMPLE_VEHICLE_VERIFICATION: BKKVehicleVerification = {
  type: 'vehicle_modification',
  timestamp: '2025-10-29T14:30:00.000Z',
  user_location: {
    latitude: 47.4979,
    longitude: 19.0402,
    accuracy: 15
  },
  description: 'Jármű menetrend módosítás: 1 - Vörösvári út - Mexikói út (késések észlelve)',
  metadata: {
    data_source: 'bkk_real_time_api',
    data_version: '2025-10-29T14:28:00.000Z',
    context: {
      has_delays: true,
      related_alerts_count: 1
    }
  },
  vehicle_data: {
    vehicle_id: 'BKK_1234',
    route: {
      id: '1',
      name: 'Vörösvári út - Mexikói út',
      type: 'villamos'
    },
    position: {
      latitude: 47.5021,
      longitude: 19.0378,
      bearing: 45,
      speed: 25
    },
    vehicle_info: {
      license_plate: 'BKK-1234',
      label: '1234',
      status: 'IN_TRANSIT_TO',
      current_stop: 'Batthyány tér'
    },
    trip_modifications: {
      has_delays: true,
      schedule_comparison: {
        planned_times: {
          'batthyany_ter': '14:25:00',
          'szell_kalman_ter': '14:32:00'
        },
        actual_times: {
          'batthyany_ter': '14:37:00',
          'szell_kalman_ter': '14:45:00'
        },
        delays: {
          'batthyany_ter': 720, // 12 minutes in seconds
          'szell_kalman_ter': 780 // 13 minutes in seconds
        }
      },
      related_alerts: ['bkk_alert_12345']
    },
    distance_from_user: 450,
    data_timestamp: '2025-10-29T14:28:00.000Z'
  },
  gtfs_validation: {
    route_found: true,
    gtfs_route: {
      route_id: '3001',
      route_short_name: '1',
      route_long_name: 'Vörösvári út - Mexikói út',
      route_type: 0 // Tram
    }
  }
};