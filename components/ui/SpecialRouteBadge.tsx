import React from 'react';
import { MetroIcon } from '../icons/MetroIcon';
import { HevIcon } from '../icons/HevIcon';
import { HajoIcon } from '../icons/HajoIcon';
import { getMetroLineColor, getMetroLineNumber, getHevLineColor, getHevLineNumber, getHajoLineColor, getHajoLineNumber } from '../../lib/bkk-line-colors';

interface SpecialRouteBadgeProps {
  routeNumber: string;
  vehicleType: 'metro' | 'hev' | 'hajo';
  className?: string;
  size?: number; // This will be the size of both logo and circle
}

export const SpecialRouteBadge: React.FC<SpecialRouteBadgeProps> = ({ 
  routeNumber, 
  vehicleType, 
  className = '',
  size = 24
}) => {
  const renderIcon = () => {
    switch (vehicleType) {
      case 'metro':
        return (
          <MetroIcon 
            size={size} 
            routeNumber={getMetroLineNumber(routeNumber)}
            lineColor={getMetroLineColor(routeNumber)}
          />
        );
      case 'hev':
        return (
          <HevIcon 
            size={size} 
            routeNumber={getHevLineNumber(routeNumber)}
            lineColor={getHevLineColor(routeNumber)}
          />
        );
      case 'hajo':
        return (
          <HajoIcon 
            size={size} 
            routeNumber={getHajoLineNumber(routeNumber)}
            lineColor={getHajoLineColor(routeNumber)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {renderIcon()}
    </div>
  );
};

export default SpecialRouteBadge;