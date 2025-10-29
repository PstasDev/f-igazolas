// BKK API types for Alerts and Vehicle Positions

export interface BKKAlert {
  id: string;
  header_text: {
    translation: Array<{
      text: string;
      language: string;
    }>;
  };
  description_text: {
    translation: Array<{
      text: string;
      language: string;
    }>;
  };
  informed_entity: Array<{
    route_id?: string;
    stop_id?: string;
  }>;
  active_period: {
    start: number;
    end?: number;
  };
  url: {
    translation: Array<{
      text: string;
      language: string;
    }>;
  };
  cause?: string;
  effect?: string;
  realcity_alert?: {
    startText: {
      translation: Array<{
        text: string;
        language: string;
      }>;
    };
    endText: {
      translation: Array<{
        text: string;
        language: string;
      }>;
    };
    route: Array<{
      route_id: string;
      header_text: {
        translation: Array<{
          text: string;
          language: string;
        }>;
      };
      affected_entity_description: {
        translation: Array<{
          text: string;
          language: string;
        }>;
      };
      cause?: string;
      effect?: string;
      effect_type?: string;
    }>;
    priority: number;
  };
}

export interface BKKVehiclePosition {
  id: string;
  vehicle: {
    trip: {
      trip_id: string;
      start_date: string;
      schedule_relationship: string;
      route_id: string;
    };
    position: {
      latitude: number;
      longitude: number;
      bearing?: number;
      speed?: number;
    };
    current_stop_sequence: number;
    current_status: string;
    timestamp: number;
    stop_id?: string;
    vehicle: {
      id: string;
      label: string;
      license_plate?: string;
      wheelchair_accessible?: string;
      realcity_vehicle?: {
        vehicle_model: string;
        vehicle_type: number;
        door_open: boolean;
        stop_distance: number;
      };
    };
  };
}

export interface ProcessedBKKAlert {
  id: string;
  title: string;
  description: string;
  affectedRoutes: string[];
  startTime?: Date;
  endTime?: Date;
  url?: string;
  category: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat';
  priority: number;
  effect: string;
  cause: string;
}

export interface ProcessedVehiclePosition {
  vehicleId: string;
  routeId: string;
  routeName: string;
  position: {
    lat: number;
    lng: number;
    bearing?: number;
    speed?: number;
  };
  timestamp: Date;
  licensePlate?: string;
  vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat';
  currentStop?: string;
  status: string;
  hasDelay?: boolean;
  delayMinutes?: number; // Delay in minutes from trip updates
  label?: string;
  tripId?: string;
}

// Vehicle type mappings
export const ROUTE_TYPE_MAPPING: Record<string, 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat'> = {
  // Metro lines
  '5100': 'metro', // M1
  '5200': 'metro', // M2  
  '5300': 'metro', // M3
  '5400': 'metro', // M4
  
  // HÉV lines
  '5500': 'hev', // H5
  '5600': 'hev', // H6
  '5700': 'hev', // H7
  '5800': 'hev', // H8
  '5900': 'hev', // H9
  
  // Night lines (9xxx)
  // Will be detected by route_id starting with '9'
};

export function getVehicleType(routeId: string): 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat' {
  // Check explicit mappings first
  if (ROUTE_TYPE_MAPPING[routeId]) {
    return ROUTE_TYPE_MAPPING[routeId];
  }
  
  // Night lines
  if (routeId.startsWith('9')) {
    return 'ejszakai';
  }
  
  // Tram lines (usually 3xxx range and some specific ones)
  if (routeId.startsWith('3') || 
      ['1', '2', '4', '6', '12', '14', '17', '19', '28', '37', '41', '42', '47', '48', '49', '50', '51', '52', '56', '59', '60', '61', '62', '69'].includes(routeId)) {
    return 'villamos';
  }
  
  // Trolleybus lines (typically 70-83 range)
  if (['70', '72', '73', '74', '75', '76', '78', '79', '80', '81', '82', '83'].includes(routeId)) {
    return 'troli';
  }
  
  // Boat lines (Duna routes - D11, D12, D13, D14)
  if (routeId.startsWith('D') || ['D11', 'D12', 'D13', 'D14'].includes(routeId)) {
    return 'hajo';
  }
  
  // Everything else is bus
  return 'busz';
}

export function getVehicleTypeEmoji(type: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat'): string {
  switch (type) {
    case 'busz': return '🚌';
    case 'villamos': return '🚋';
    case 'troli': return '🚎';
    case 'metro': return 'Ⓜ️';
    case 'hev': return '🚆';
    case 'hajo': return '🚢';
    case 'ejszakai': return '🌙';
    case 'vonat': return '🚄';
    default: return '🚐';
  }
}

// BKK hivatalos színek az arculati útmutató alapján
export function getBKKColors(type: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat' | 'general'): {
  background: string;
  text: string;
  border: string;
  hover: string;
} {
  switch (type) {
    case 'busz':
      return {
        background: 'bg-blue-600', // BKK kék
        text: 'text-white',
        border: 'border-blue-600',
        hover: 'hover:bg-blue-700'
      };
    case 'villamos':
      return {
        background: 'bg-yellow-500', // BKK sárga (villamos)
        text: 'text-black',
        border: 'border-yellow-500',
        hover: 'hover:bg-yellow-600'
      };
    case 'troli':
      return {
        background: 'bg-red-600', // BKK piros (trolibusz)
        text: 'text-white',
        border: 'border-red-600',
        hover: 'hover:bg-red-700'
      };
    case 'metro':
      return {
        background: 'bg-gray-800', // Metro általános szín
        text: 'text-white',
        border: 'border-gray-800',
        hover: 'hover:bg-gray-900'
      };
    case 'hev':
      return {
        background: 'bg-green-600', // BKK zöld (H5)
        text: 'text-white',
        border: 'border-green-600',
        hover: 'hover:bg-green-700'
      };
    case 'ejszakai':
      return {
        background: 'bg-purple-600', // Éjszakai járatok
        text: 'text-white',
        border: 'border-purple-600',
        hover: 'hover:bg-purple-700'
      };
    case 'hajo':
      return {
        background: 'bg-cyan-500', // Hajó általános kék
        text: 'text-white',
        border: 'border-cyan-500',
        hover: 'hover:bg-cyan-600'
      };
    case 'vonat':
      return {
        background: 'bg-gray-700', // MÁV trains
        text: 'text-white',
        border: 'border-gray-700',
        hover: 'hover:bg-gray-800'
      };
    case 'general':
    default:
      return {
        background: 'bg-purple-600', // BKK purple for general/disruptions
        text: 'text-white',
        border: 'border-purple-600',
        hover: 'hover:bg-purple-700'
      };
  }
}

// Metro vonalak specifikus színei
export function getMetroLineColor(lineId: string): {
  background: string;
  text: string;
  border: string;
} {
  switch (lineId) {
    case '5100': // M1
      return {
        background: 'bg-yellow-400', // BKK M1 sárga
        text: 'text-black',
        border: 'border-yellow-400'
      };
    case '5200': // M2
      return {
        background: 'bg-red-600', // BKK M2 piros
        text: 'text-white',
        border: 'border-red-600'
      };
    case '5300': // M3
      return {
        background: 'bg-blue-600', // BKK M3 kék
        text: 'text-white',
        border: 'border-blue-600'
      };
    case '5400': // M4
      return {
        background: 'bg-green-600', // BKK M4 zöld
        text: 'text-white',
        border: 'border-green-600'
      };
    default:
      return {
        background: 'bg-gray-800',
        text: 'text-white',
        border: 'border-gray-800'
      };
  }
}

export function getVehicleTypeName(type: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat'): string {
  switch (type) {
    case 'busz': return 'Autóbusz';
    case 'villamos': return 'Villamos';
    case 'troli': return 'Trolibusz';
    case 'metro': return 'Metró';
    case 'hev': return 'HÉV';
    case 'hajo': return 'Hajó';
    case 'ejszakai': return 'Éjszakai járat';
    case 'vonat': return 'Vonat';
    default: return 'Jármű';
  }
}

// Helper function to calculate distance between two coordinates
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Return distance in meters
}