import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import BKKLogo from '@/components/icons/BKKLogo';
import VehicleIcon from '@/components/ui/VehicleIcon';
import { 
  BKKVerification, 
  BKKDisruptionVerification, 
  BKKVehicleVerification, 
  validateBKKVerification 
} from '@/lib/bkk-verification-schema';
import { getBKKColors, getVehicleTypeName } from '@/lib/bkk-types';
import { formatHungarianRoutes } from '@/lib/hungarian-grammar';
import { 
  BKK_LINE_COLORS, 
  getMetroLineColor, 
  getHevLineColor, 
  getHajoLineColor,
  getMetroLineNumber,
  getHevLineNumber,
  getHajoLineNumber
} from '@/lib/bkk-line-colors';
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

  // Helper function to get vehicle styling config
  const getVehicleConfig = (vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo') => {
    switch (vehicleType) {
      case 'villamos':
        return {
          backgroundColor: BKK_LINE_COLORS.villamos,
          textColor: '#2B2929'
        };
      case 'busz':
        return {
          backgroundColor: BKK_LINE_COLORS.busz,
          textColor: '#FFFFFF'
        };
      case 'troli':
        return {
          backgroundColor: BKK_LINE_COLORS.troli,
          textColor: '#FFFFFF'
        };
      case 'ejszakai':
        return {
          backgroundColor: '#000000',
          textColor: '#FFFFFF'
        };
      default:
        return {
          backgroundColor: '#666666',
          textColor: '#FFFFFF'
        };
    }
  };

  // Group consecutive routes of the same vehicle type
  const renderGroupedRouteBadges = (routes: string[], vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo') => {
    const limitedRoutes = routes.slice(0, 8);
    const groups: { vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo'; routes: string[] }[] = [];
    
    // Group consecutive routes by vehicle type
    limitedRoutes.forEach((route) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.vehicleType === vehicleType) {
        lastGroup.routes.push(route);
      } else {
        groups.push({
          vehicleType: vehicleType,
          routes: [route]
        });
      }
    });
    
    return groups.map((group, groupIndex) => (
      <div key={groupIndex} className="flex items-center gap-1">
        {/* Vehicle icon only at the start of each group */}
        <div className="flex-shrink-0">
          <VehicleIcon vehicleType={group.vehicleType} size={24} />
        </div>
        
        {/* Route rectangles/circles without individual icons */}
        {group.routes.map((route) => {
          // Use special circular badges for metro, hev, hajo
          if (group.vehicleType === 'metro' || group.vehicleType === 'hev' || group.vehicleType === 'hajo') {
            // Get the route number and line color
            let routeNumber = '';
            let lineColor = '';
            
            if (group.vehicleType === 'metro') {
              routeNumber = getMetroLineNumber(route);
              lineColor = getMetroLineColor(route);
            } else if (group.vehicleType === 'hev') {
              routeNumber = getHevLineNumber(route);
              lineColor = getHevLineColor(route);
            } else if (group.vehicleType === 'hajo') {
              routeNumber = getHajoLineNumber(route);
              lineColor = getHajoLineColor(route);
            }
            
            return (
              <div
                key={route}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
                style={{
                  backgroundColor: lineColor,
                  fontSize: `${24 / 1.428}px`, // Back to 24px size
                  lineHeight: '1'
                }}
              >
                {routeNumber}
              </div>
            );
          }
          
          // Use regular rectangles for other vehicle types
          const config = getVehicleConfig(group.vehicleType);
          return (
            <div 
              key={route}
              className="px-4 py-3 font-bold leading-none"
              style={{
                backgroundColor: config.backgroundColor,
                color: config.textColor,
                borderRadius: `${24 * (5/24)}px`, // Scaled up border radius
                fontFamily: 'Open Sans, sans-serif',
                fontWeight: '700',
                width: `${24 * 2}px`,
                height: '24px', // Scaled up height
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${24 / 1.578}px`, // Scaled up font size
                lineHeight: '1'
              }}
            >
              {route}
            </div>
          );
        })}
      </div>
    ));
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
                {renderGroupedRouteBadges(disruption.alert_data.affected_routes, disruption.alert_data.category)}
                {disruption.alert_data.affected_routes.length > 8 && (
                  <span className="text-xs text-purple-200 bg-purple-700 px-2 py-1 rounded">
                    +{disruption.alert_data.affected_routes.length - 8}
                  </span>
                )}
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
                {renderGroupedRouteBadges([vehicle.vehicle_data.route.id], vehicle.vehicle_data.route.type)}
              </div>
              
              {/* Vehicle Title */}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg ${colors.background} flex items-center justify-center`}>
                  <VehicleIcon vehicleType={vehicle.vehicle_data.route.type} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white leading-tight">
                    <span className="text-sm font-normal text-blue-200">
                      {vehicle.vehicle_data.route.id} - {getVehicleTypeName(vehicle.vehicle_data.route.type)}:{' '}
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
                  <div>
                    <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Rendszám
                    </Label>
                    <p className="text-gray-900 dark:text-gray-100 mt-1 font-mono">
                      {vehicle.vehicle_data.vehicle_info.license_plate}
                    </p>
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