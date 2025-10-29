import React from 'react';
import { ProcessedBKKAlert } from '@/lib/bkk-types';

interface BKKAlertCardBodyProps {
  alert: ProcessedBKKAlert;
  onDetailsClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const BKKAlertCardBody: React.FC<BKKAlertCardBodyProps> = ({ 
  alert, 
  onDetailsClick,
  className = '' 
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 p-4 ${className}`}>
      {/* Alert Description */}
      <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
        {alert.description}
      </p>
      
      {/* Részletek button */}
      <div className="flex justify-start">
        <button 
          onClick={(e) => onDetailsClick?.(e)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium flex items-center gap-1 transition-colors"
        >
          Részletek
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default BKKAlertCardBody;