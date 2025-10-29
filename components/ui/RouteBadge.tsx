import React from 'react';
import { BuszIcon } from '../icons/BuszIcon';
import VillamosIcon from '../icons/VillamosIcon';
import { TroliIcon } from '../icons/TroliIcon';
import { VonatIcon } from '../icons/VonatIcon';
import SpecialRouteBadge from './SpecialRouteBadge';
import { BKK_LINE_COLORS } from '@/lib/bkk-line-colors';

interface RouteBadgeProps {
  routeNumber: string;
  vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat';
  className?: string;
}

export const RouteBadge: React.FC<RouteBadgeProps> = ({ routeNumber, vehicleType, className = '' }) => {
  // MÁV trains use special rendering with train icon
  if (vehicleType === 'vonat') {
    const routeUpper = routeNumber.toUpperCase();
    
    // Determine train type and styling
    let trainConfig: {
      hasRectangle: boolean;
      backgroundColor?: string;
      textColor: string;
      hasBorder?: boolean;
      isItalic?: boolean;
    };
    
    if (routeUpper.startsWith('S')) {
      // Sebesvonat - SXX
      trainConfig = {
        hasRectangle: true,
        backgroundColor: '#00A0E3',
        textColor: '#FFFFFF',
        hasBorder: true,
        isItalic: false
      };
    } else if (routeUpper.startsWith('G')) {
      // Gyorsvonat - GXX
      trainConfig = {
        hasRectangle: true,
        backgroundColor: '#B0CB1F',
        textColor: '#FFFFFF',
        hasBorder: true,
        isItalic: false
      };
    } else if (routeUpper.startsWith('Z')) {
      // Zónázó - ZXX
      trainConfig = {
        hasRectangle: true,
        backgroundColor: '#FECC00',
        textColor: '#000000',
        hasBorder: true,
        isItalic: false
      };
    } else if (routeUpper.match(/^(IC|EC|EN|EXPRESSZVONAT)/)) {
      // InterCity, EuroCity, EuroNight, Expresszvonat - italic text only
      trainConfig = {
        hasRectangle: false,
        textColor: '#3056A9',
        isItalic: true
      };
    } else if (routeUpper.match(/^(SEBESVONAT|GYORSVONAT)$/)) {
      // Full text variants - italic, green
      trainConfig = {
        hasRectangle: false,
        textColor: '#008000',
        isItalic: true
      };
    } else {
      // Default train styling
      trainConfig = {
        hasRectangle: false,
        textColor: '#3056A9',
        isItalic: true
      };
    }
    
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        {/* Train icon - 16px to match other badges */}
        <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <VonatIcon size={16} />
        </div>
        
        {/* Route number/name */}
        {trainConfig.hasRectangle ? (
          <div 
            className="px-2 py-1 font-bold leading-none"
            style={{
              backgroundColor: trainConfig.backgroundColor,
              color: trainConfig.textColor,
              border: trainConfig.hasBorder ? '1px solid #000000' : 'none',
              fontFamily: 'Open Sans, sans-serif',
              fontWeight: '700',
              minWidth: '32px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${16 / 1.578}px`,
              lineHeight: '1'
            }}
          >
            {routeNumber}
          </div>
        ) : (
          <span
            style={{
              color: trainConfig.textColor,
              fontFamily: 'Open Sans, sans-serif',
              fontWeight: '700',
              fontStyle: trainConfig.isItalic ? 'italic' : 'normal',
              fontSize: `${16 / 1.578}px`,
              lineHeight: '1'
            }}
          >
            {routeNumber}
          </span>
        )}
      </div>
    );
  }
  
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
          backgroundColor: BKK_LINE_COLORS.villamos,
          textColor: '#2B2929',
          icon: <VillamosIcon size={16} className="flex-shrink-0" />
        };
      case 'busz':
        return {
          backgroundColor: BKK_LINE_COLORS.busz,
          textColor: '#FFFFFF',
          icon: <BuszIcon size={16} color={BKK_LINE_COLORS.busz} />
        };
      case 'troli':
        return {
          backgroundColor: BKK_LINE_COLORS.troli,
          textColor: '#FFFFFF',
          icon: <TroliIcon size={16} color={BKK_LINE_COLORS.troli} />
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