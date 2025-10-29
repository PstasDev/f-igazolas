import React from 'react';
import { Badge } from '@/components/ui/badge';
import BKKLogo from '@/components/icons/BKKLogo';
import VehicleIcon from '@/components/ui/VehicleIcon';
import { BKKVerification, BKKVehicleVerification, validateBKKVerification } from '@/lib/bkk-verification-schema';
import { getBKKColors } from '@/lib/bkk-types';

interface BKKVerificationBadgeProps {
  bkkVerificationJson?: string | object;
  onClick?: () => void;
  className?: string;
}

export function BKKVerificationBadge({ 
  bkkVerificationJson, 
  onClick, 
  className = "" 
}: BKKVerificationBadgeProps) {
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
  const vehicleType = isDisruption 
    ? 'general' as const
    : (bkkVerification as BKKVehicleVerification).vehicle_data?.route?.type || 'busz';
  
  const badgeText = isDisruption ? 'BKK Forgalmi Zavar' : 'BKK Jármű Info';
  const badgeIcon = isDisruption ? (
    <div className="w-5 h-5 flex items-center justify-center">
      <BKKLogo size={32} />
    </div>
  ) : (
    <VehicleIcon 
      vehicleType={vehicleType === 'general' ? 'busz' : vehicleType} 
      size={16} 
    />
  );

  const colors = getBKKColors(vehicleType);

  return (
    <Badge 
      variant="outline"
      className={`w-fit cursor-pointer transition-colors text-purple-500 bg-purple-50 border border-purple-200 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-100 px-2 py-1 ${className}`}
      onClick={onClick}
    >
      {badgeIcon}
      <span className="ml-0 text-xs font-medium">{badgeText}</span>
    </Badge>
  );
}