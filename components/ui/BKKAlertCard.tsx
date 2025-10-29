import React from 'react';
import { Card } from '@/components/ui/card';
import BKKAlertCardSeverity from './BKKAlertCardSeverity';
import BKKAlertCardHeader from './BKKAlertCardHeader';
import BKKAlertCardBody from './BKKAlertCardBody';
import { ProcessedBKKAlert } from '@/lib/bkk-types';

interface BKKAlertCardProps {
  alert: ProcessedBKKAlert;
  isSelected?: boolean;
  onClick?: () => void;
  onDetailsClick?: () => void;
}

export const BKKAlertCard: React.FC<BKKAlertCardProps> = ({ 
  alert, 
  isSelected = false, 
  onClick,
  onDetailsClick
}) => {
  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking details
    if (onDetailsClick) {
      onDetailsClick();
    } else if (alert.url) {
      // Use the existing alert URL from the BKK data
      window.open(alert.url, '_blank');
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 overflow-hidden border-0 hover:shadow-lg hover:scale-[1.02] ${
        isSelected 
          ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50 dark:bg-blue-950' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      <div className="flex">
        {/* Left severity indicator */}
        <BKKAlertCardSeverity 
          priority={alert.priority}
          className="flex-shrink-0"
        />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header with route badge and title */}
          <BKKAlertCardHeader 
            alert={alert}
            className="bg-gray-800 text-white"
          />
          
          {/* Body with description and details button */}
          <BKKAlertCardBody 
            alert={alert}
            onDetailsClick={handleDetailsClick}
            className="flex-1"
          />
        </div>
      </div>
    </Card>
  );
};

export default BKKAlertCard;