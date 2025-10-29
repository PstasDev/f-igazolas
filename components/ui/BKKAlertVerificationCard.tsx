import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import BKKLogo from '@/components/icons/BKKLogo';
import VehicleIcon from '@/components/ui/VehicleIcon';
import { RouteBadge } from '@/components/ui/RouteBadge';
import { HungarianLicensePlate } from '@/components/ui/HungarianLicensePlate';
import { BKKDataProcessor } from '@/lib/bkk-processor';
import { 
  BKKVerification, 
  BKKDisruptionVerification, 
  BKKVehicleVerification, 
  validateBKKVerification 
} from '@/lib/bkk-verification-schema';
import { getBKKColors, getVehicleTypeName } from '@/lib/bkk-types';
import { formatHungarianRoutes } from '@/lib/hungarian-grammar';
import { ExternalLink, Clock } from 'lucide-react';

interface BKKAlertVerificationCardProps {
  bkkVerificationJson?: string | object;
  className?: string;
}

export const BKKAlertVerificationCard: React.FC<BKKAlertVerificationCardProps> = ({ 
  bkkVerificationJson, 
  className = "" 
}) => {
  if (!bkkVerificationJson) {
    return null;
  }

  let bkkVerification: BKKVerification;
  try {
    let parsed: unknown;
    
    if (typeof bkkVerificationJson === 'string') {
      parsed = JSON.parse(bkkVerificationJson);
    } else {
      parsed = bkkVerificationJson;
    }
    
    if (!validateBKKVerification(parsed)) {
      console.warn('Invalid BKK verification data:', parsed);
      return null;
    }
    bkkVerification = parsed;
  } catch (error) {
    console.error('Failed to parse BKK verification:', error);
    return null;
  }

  const isDisruption = bkkVerification.type === 'disruption';
  const timestamp = new Date(bkkVerification.timestamp);

  // Helper function to get route short name from route ID (for GTFS route IDs)
  const getRouteShortName = (routeId: string): string => {
    const gtfsRoute = BKKDataProcessor.getRouteDetails(routeId);
    return gtfsRoute ? gtfsRoute.route_short_name : routeId;
  };

  // Render route badges using the RouteBadge component
  // For disruptions: converts GTFS route IDs to short names
  // For vehicles: uses the route numbers directly (already converted)
  const renderRouteBadges = (routes: string[], vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat', convertRouteIds: boolean = true) => {
    const limitedRoutes = routes.slice(0, 8);
    
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {limitedRoutes.map((routeId) => {
          const routeNumber = convertRouteIds ? getRouteShortName(routeId) : routeId;
          return (
            <RouteBadge 
              key={routeId} 
              routeNumber={routeNumber} 
              vehicleType={vehicleType} 
            />
          );
        })}
        {routes.length > 8 && (
          <span className="text-xs text-purple-200 bg-purple-700 px-2 py-1 rounded">
            +{routes.length - 8}
          </span>
        )}
      </div>
    );
  };

  if (isDisruption) {
    const disruption = bkkVerification as BKKDisruptionVerification;
    
    return (
      <Card className={`overflow-hidden border-0 ${className}`}>
        <div className="flex">
          {/* Left severity indicator - Purple theme */}
          <div className="w-2 bg-gradient-to-b from-purple-400 to-purple-600"></div>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Header - Purple theme */}
            <div className="bg-purple-800 text-white p-4">
              {/* Route Badges */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {renderRouteBadges(disruption.alert_data.affected_routes, disruption.alert_data.category)}
              </div>
              
              {/* Alert Title */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center p-1">
                  <BKKLogo size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white leading-tight">
                    <span className="text-sm font-normal text-purple-200">
                      {formatHungarianRoutes(disruption.alert_data.affected_routes, disruption.alert_data.category)}:{' '}
                    </span>
                    {disruption.alert_data.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-purple-200">
                    <Clock className="w-3 h-3" />
                    <span>{timestamp.toLocaleString('hu-HU')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Body - White background */}
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              {/* Description */}
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Részletes leírás
                </Label>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 leading-relaxed">
                  {disruption.alert_data.description}
                </p>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 font-semibold">Prioritás</Label>
                  <p className="text-gray-800 dark:text-gray-200">{disruption.alert_data.priority}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 font-semibold">Hatás</Label>
                  <p className="text-gray-800 dark:text-gray-200">{disruption.alert_data.effect}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 font-semibold">Ok</Label>
                  <p className="text-gray-800 dark:text-gray-200">{disruption.alert_data.cause}</p>
                </div>
                <div>
                  <Label className="text-gray-600 dark:text-gray-400 font-semibold">Kategória</Label>
                  <p className="text-gray-800 dark:text-gray-200">{getVehicleTypeName(disruption.alert_data.category)}</p>
                </div>
              </div>
              
              {/* Official BKK Link */}
              {disruption.alert_data.url && (
                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-purple-700 border-purple-300 hover:bg-purple-50 dark:text-purple-300 dark:border-purple-600 dark:hover:bg-purple-950"
                    onClick={() => window.open(disruption.alert_data.url!, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Hivatalos BKK információ
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                    ⚠️ Figyelem: A BKK rendszeresen törli a régi zavarjelentéseket, ezért előfordulhat, 
                    hogy ez a link már nem elérhető. Az igazolás beküldésekor ez az információ valós volt.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  } else {
    // Vehicle verification
    const vehicle = bkkVerification as BKKVehicleVerification;
    const colors = getBKKColors(vehicle.vehicle_data.route.type);
    
    // Handle both old and new format:
    // Old format: route.id contains GTFS ID (like "3040"), route.name contains short name (like "4")
    // New format: route.id contains short name (like "4"), route.name also contains short name
    // If route.id and route.name differ significantly, use route.name (it's the display name)
    const routeShortName = vehicle.vehicle_data.route.name || vehicle.vehicle_data.route.id;
    
    return (
      <Card className={`overflow-hidden border-0 ${className}`}>
        <div className="flex">
          {/* Left severity indicator - Purple theme */}
          <div className="w-2 bg-gradient-to-b from-blue-400 to-blue-600"></div>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Header - Blue theme for vehicles */}
            <div className="bg-blue-800 text-white p-4">
              {/* Route Badge */}
              <div className="flex items-center gap-3 mb-3">
                {renderRouteBadges([routeShortName], vehicle.vehicle_data.route.type, false)}
              </div>
              
              {/* Vehicle Title */}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${colors.background} flex items-center justify-center`}>
                  <VehicleIcon vehicleType={vehicle.vehicle_data.route.type} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white leading-tight">
                    <span className="text-sm font-normal text-blue-200">
                      {routeShortName} - {getVehicleTypeName(vehicle.vehicle_data.route.type)}:{' '}
                    </span>
                    {vehicle.vehicle_data.route.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-blue-200">
                    <Clock className="w-3 h-3" />
                    <span>{timestamp.toLocaleString('hu-HU')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Body - White background */}
            <div className="bg-white dark:bg-gray-800 p-4 space-y-4">
              {/* Delay Information */}
              {vehicle.vehicle_data.trip_modifications.has_delays && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
                  <Label className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                    Késési információ
                  </Label>
                  <div className="mt-2 space-y-1">
                    {vehicle.vehicle_data.trip_modifications.schedule_comparison ? (
                      // Show detailed delay information if available
                      Object.entries(vehicle.vehicle_data.trip_modifications.schedule_comparison.delays).map(([stop, delaySeconds]) => {
                        const delayMinutes = Math.round(delaySeconds / 60);
                        return (
                          <div key={stop} className="text-sm text-gray-900 dark:text-gray-100">
                            <span className="font-medium">
                              {delayMinutes > 0 ? `+${delayMinutes}` : delayMinutes} perc
                            </span>
                            {Object.keys(vehicle.vehicle_data.trip_modifications.schedule_comparison!.delays).length > 1 && (
                              <span className="text-gray-600 dark:text-gray-400 ml-1">
                                ({stop})
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : vehicle.vehicle_data.trip_modifications.delay_minutes !== undefined ? (
                      // Show simple delay information
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">
                          {vehicle.vehicle_data.trip_modifications.delay_minutes > 0 
                            ? `+${vehicle.vehicle_data.trip_modifications.delay_minutes}` 
                            : vehicle.vehicle_data.trip_modifications.delay_minutes} perc
                        </span>
                      </div>
                    ) : (
                      // Fallback if no delay details available
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">Késés észlelve</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Vehicle Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Jármű típus
                  </Label>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">
                    {getVehicleTypeName(vehicle.vehicle_data.route.type)}
                  </p>
                </div>
                
                {vehicle.vehicle_data.vehicle_info.license_plate && (
                  <div className="col-span-2">
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Rendszám
                    </Label>
                    <div className="mt-2">
                      <HungarianLicensePlate licensePlate={vehicle.vehicle_data.vehicle_info.license_plate} />
                    </div>
                  </div>
                )}
                
                {vehicle.vehicle_data.vehicle_info.current_stop && (
                  <div className="col-span-2">
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Aktuális megálló
                    </Label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      {vehicle.vehicle_data.vehicle_info.current_stop}
                    </p>
                  </div>
                )}
                
                {vehicle.vehicle_data.distance_from_user && (
                  <div>
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Távolság
                    </Label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                      ~{Math.round(vehicle.vehicle_data.distance_from_user)}m
                    </p>
                  </div>
                )}
              </div>
              
              {/* Warning */}
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  ⚠️ Figyelem: A BKK járműadatok valós időben változnak. Az itt látható információk 
                  az igazolás beküldésének időpontjában voltak érvényesek.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }
};

export default BKKAlertVerificationCard;