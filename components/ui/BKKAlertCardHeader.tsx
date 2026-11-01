import React from 'react';
import VehicleIcon from './VehicleIcon';
import { ProcessedBKKAlert } from '@/lib/bkk-types';
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

interface BKKAlertCardHeaderProps {
  alert: ProcessedBKKAlert;
  className?: string;
}

type AlertVehicleType = ProcessedBKKAlert['category'];

const getVehicleConfig = (vehicleType: AlertVehicleType) => {
  switch (vehicleType) {
    case 'villamos':
      return { backgroundColor: BKK_LINE_COLORS.villamos, textColor: '#2B2929' };
    case 'busz':
      return { backgroundColor: BKK_LINE_COLORS.busz, textColor: '#FFFFFF' };
    case 'troli':
      return { backgroundColor: BKK_LINE_COLORS.troli, textColor: '#FFFFFF' };
    case 'ejszakai':
      return { backgroundColor: '#000000', textColor: '#FFFFFF' };
    case 'vonat':
      return { backgroundColor: '#666666', textColor: '#FFFFFF' };
    default:
      return { backgroundColor: '#666666', textColor: '#FFFFFF' };
  }
};

export const renderGroupedRouteBadges = (
  affectedRoutes: string[],
  vehicleType: AlertVehicleType,
  maxRoutes = 5
): React.ReactNode => {
  const routes = affectedRoutes.slice(0, maxRoutes);
  const groups: { vehicleType: AlertVehicleType; routes: string[] }[] = [];

  routes.forEach((route) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.vehicleType === vehicleType) {
      lastGroup.routes.push(route);
    } else {
      groups.push({ vehicleType, routes: [route] });
    }
  });

  return groups.map((group, groupIndex) => (
    <div key={groupIndex} className="flex items-center gap-1">
      <div className="flex-shrink-0">
        <VehicleIcon vehicleType={group.vehicleType} size={24} />
      </div>

      {group.routes.map((route) => {
        if (group.vehicleType === 'metro' || group.vehicleType === 'hev' || group.vehicleType === 'hajo') {
          let routeNumber = '';
          let lineColor = '';

          if (group.vehicleType === 'metro') {
            routeNumber = getMetroLineNumber(route);
            lineColor = getMetroLineColor(route);
          } else if (group.vehicleType === 'hev') {
            routeNumber = getHevLineNumber(route);
            lineColor = getHevLineColor(route);
          } else {
            routeNumber = getHajoLineNumber(route);
            lineColor = getHajoLineColor(route);
          }

          return (
            <div
              key={route}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{
                backgroundColor: lineColor,
                fontSize: `${24 / 1.428}px`,
                lineHeight: '1',
              }}
            >
              {routeNumber}
            </div>
          );
        }

        const config = getVehicleConfig(group.vehicleType);
        return (
          <div
            key={route}
            className="px-3 py-2 font-bold leading-none"
            style={{
              backgroundColor: config.backgroundColor,
              color: config.textColor,
              borderRadius: `${24 * (5 / 24)}px`,
              fontFamily: 'Open Sans, sans-serif',
              fontWeight: '700',
              minWidth: '48px',
              width: 'auto',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${24 / 1.578}px`,
              lineHeight: '1',
            }}
          >
            {route}
          </div>
        );
      })}
    </div>
  ));
};

export const BKKAlertCardHeader: React.FC<BKKAlertCardHeaderProps> = ({ 
  alert, 
  className = '' 
}) => {
  return (
    <div className={`p-4 ${className}`}>
      {/* Route Badges - grouped by vehicle type */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {renderGroupedRouteBadges(alert.affectedRoutes, alert.category)}
        {alert.affectedRoutes.length > 5 && (
          <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded">
            +{alert.affectedRoutes.length - 5}
          </span>
        )}
      </div>
      
      {/* Alert Title */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white leading-tight">
          <span className="text-sm font-normal text-gray-300">
            {formatHungarianRoutes(alert.affectedRoutes, alert.category)}:{' '}
          </span>
          {alert.title}
        </h3>
        
        {/* Date/Time info */}
        {alert.startTime && (
          <p className="text-xs text-gray-300 mt-1">
            {alert.startTime.toLocaleDateString('hu-HU', { 
              month: 'long', 
              day: 'numeric' 
            })}, {' '}
            {alert.startTime.toLocaleDateString('hu-HU', { 
              weekday: 'long' 
            })}{' '}
            {alert.startTime.toLocaleTimeString('hu-HU', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}-től
          </p>
        )}
      </div>
    </div>
  );
};

export default BKKAlertCardHeader;
