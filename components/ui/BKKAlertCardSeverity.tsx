import React from 'react';

interface BKKAlertCardSeverityProps {
  priority: number;
  className?: string;
}

export const BKKAlertCardSeverity: React.FC<BKKAlertCardSeverityProps> = ({ 
  priority, 
  className = '' 
}) => {
  // Determine severity styling based on priority
  const getSeverityConfig = (priority: number) => {
    if (priority === 0) {
      // High severity - Red with X icon (like route 128)
      return {
        icon: (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        leftBorderColor: 'border-l-red-500'
      };
    } else if (priority === 1) {
      // Medium severity - Yellow with warning icon (like route 2B)
      return {
        icon: (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
        bgColor: 'bg-yellow-500',
        textColor: 'text-white',
        leftBorderColor: 'border-l-yellow-500'
      };
    } else {
      // Low severity - Blue with info icon (like route 1)
      return {
        icon: (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        bgColor: 'bg-blue-500',
        textColor: 'text-white',
        leftBorderColor: 'border-l-blue-500'
      };
    }
  };

  const severityConfig = getSeverityConfig(priority);

  return (
    <div className={`w-16 flex flex-col ${severityConfig.bgColor} ${className}`}>
      {/* Colored strip extends full height */}
      <div className="flex-1 flex items-center justify-center min-h-[120px]">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md">
          {severityConfig.icon}
        </div>
      </div>
    </div>
  );
};

export default BKKAlertCardSeverity;