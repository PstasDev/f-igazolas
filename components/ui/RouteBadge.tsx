import React from 'react';
import { BuszIcon } from '../icons/BuszIcon';
import VillamosIcon from '../icons/VillamosIcon';
import { TroliIcon } from '../icons/TroliIcon';
import SpecialRouteBadge from './SpecialRouteBadge';

interface RouteBadgeProps {
  routeNumber: string;
  vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo';
  className?: string;
}

export const RouteBadge: React.FC<RouteBadgeProps> = ({ routeNumber, vehicleType, className = '' }) => {
  // Use special badge for metro, hev, and hajo
  if (vehicleType === 'metro' || vehicleType === 'hev' || vehicleType === 'hajo') {
    return (
      <SpecialRouteBadge 
        routeNumber={routeNumber}
        vehicleType={vehicleType}
        className={className}
        size={16} // Standard size for route badges
      />
    );
  }

  const getVehicleConfig = (type: 'busz' | 'villamos' | 'ejszakai' | 'troli') => {
    switch (type) {
      case 'villamos':
        return {
          backgroundColor: '#FFD900',
          textColor: '#2B2929',
          icon: <VillamosIcon size={16} className="flex-shrink-0" />
        };
      case 'busz':
        return {
          backgroundColor: '#009EE3',
          textColor: '#FFFFFF',
          icon: <BuszIcon size={16} color="#009EE3" />
        };
      case 'troli':
        return {
          backgroundColor: '#E31F24',
          textColor: '#FFFFFF',
          icon: <TroliIcon size={16} color="#E31F24" />
        };
      case 'ejszakai':
        return {
          backgroundColor: '#000000',
          textColor: '#FFFFFF',
          icon: <BuszIcon size={16} color="#000000" />
        };
      default:
        return {
          backgroundColor: '#666666',
          textColor: '#FFFFFF',
          icon: <span style={{ fontSize: '16px', lineHeight: '16px' }}>🚐</span>
        };
    }
  };

  const config = getVehicleConfig(vehicleType as 'busz' | 'villamos' | 'ejszakai' | 'troli');

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {/* Vehicle icon - same height as rectangle (16px) */}
      <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {config.icon}
      </div>
      
      {/* Route number badge - 2x width (32px), height 16px */}
      <div 
        className="px-2 py-1 font-bold leading-none"
        style={{
          backgroundColor: config.backgroundColor,
          color: config.textColor,
          borderRadius: `${16 * (5/24)}px`, // Maintain 5px/24px ratio
          fontFamily: 'Open Sans, sans-serif',
          fontWeight: '700',
          minWidth: '32px',
          width: '32px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${16 / 1.578}px`, // Rectangle height / 1.578
          lineHeight: '1'
        }}
      >
        {routeNumber}
      </div>
    </div>
  );
};

export default RouteBadge;