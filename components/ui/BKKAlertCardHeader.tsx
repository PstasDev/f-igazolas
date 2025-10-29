import React from 'react';
import VehicleIcon from './VehicleIcon';
import SpecialRouteBadge from './SpecialRouteBadge';
import { ProcessedBKKAlert } from '@/lib/bkk-types';
import { formatHungarianRoutes } from '@/lib/hungarian-grammar';

interface BKKAlertCardHeaderProps {
  alert: ProcessedBKKAlert;
  className?: string;
}

export const BKKAlertCardHeader: React.FC<BKKAlertCardHeaderProps> = ({ 
  alert, 
  className = '' 
}) => {
  // Group consecutive routes of the same vehicle type
  const renderGroupedRouteBadges = () => {
    const routes = alert.affectedRoutes.slice(0, 5);
    const groups: { vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo'; routes: string[] }[] = [];
    
    // Group consecutive routes by vehicle type
    routes.forEach((route) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.vehicleType === alert.category) {
        lastGroup.routes.push(route);
      } else {
        groups.push({
          vehicleType: alert.category,
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
            return (
              <SpecialRouteBadge
                key={route}
                routeNumber={route}
                vehicleType={group.vehicleType}
                size={24}
                className=""
              />
            );
          }
          
          // Use regular rectangles for other vehicle types
          const config = getVehicleConfig(group.vehicleType);
          return (
            <div 
              key={route}
              className="px-3 py-2 font-bold leading-none"
              style={{
                backgroundColor: config.backgroundColor,
                color: config.textColor,
                borderRadius: `${24 * (5/24)}px`, // Larger border radius
                fontFamily: 'Open Sans, sans-serif',
                fontWeight: '700',
                minWidth: '48px', // Larger minimum width
                width: 'auto',
                height: '24px', // Larger height
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${24 / 1.578}px`, // Larger font size
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

  // Helper function to get vehicle styling config
  const getVehicleConfig = (vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo') => {
    switch (vehicleType) {
      case 'villamos':
        return {
          backgroundColor: '#FFD900',
          textColor: '#2B2929'
        };
      case 'busz':
        return {
          backgroundColor: '#009EE3',
          textColor: '#FFFFFF'
        };
      case 'troli':
        return {
          backgroundColor: '#E31F24',
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

  return (
    <div className={`p-4 ${className}`}>
      {/* Route Badges - grouped by vehicle type */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        {renderGroupedRouteBadges()}
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