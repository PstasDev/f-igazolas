import React from 'react';
import { BuszIcon } from '../icons/BuszIcon';
import VillamosIcon from '../icons/VillamosIcon';
import { TroliIcon } from '../icons/TroliIcon';
import { MetroLogo } from '../icons/MetroLogo';
import { HevLogo } from '../icons/HevLogo';
import { HajoLogo } from '../icons/HajoLogo';
import { VonatIcon } from '../icons/VonatIcon';

interface VehicleIconProps {
  vehicleType: 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat';
  size?: number;
  className?: string;
}

export const VehicleIcon: React.FC<VehicleIconProps> = ({ 
  vehicleType, 
  size = 20, 
  className = ''
}) => {
  const getIcon = () => {
    switch (vehicleType) {
      case 'villamos':
        return <VillamosIcon size={size} className="inline-block" />;
      case 'busz':
        return <BuszIcon size={size} color="#009EE3" />;
      case 'troli':
        return <TroliIcon size={size} color="#E31F24" />;
      case 'metro':
        return <MetroLogo size={size} />;
      case 'hev':
        return <HevLogo size={size} />;
      case 'hajo':
        return <HajoLogo size={size} />;
      case 'ejszakai':
        return <BuszIcon size={size} color="#000000" />;
      case 'vonat':
        return <VonatIcon size={size} />;
      default:
        return <span style={{ fontSize: size }}>🚐</span>;
    }
  };

  return (
    <div className={className} style={{ 
      width: size, 
      height: size, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      {getIcon()}
    </div>
  );
};

export default VehicleIcon;