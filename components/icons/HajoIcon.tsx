import React from 'react';

interface HajoIconProps {
  className?: string;
  size?: number;
  routeNumber?: string;
  lineColor?: string;
}

export const HajoIcon: React.FC<HajoIconProps> = ({ 
  className = '', 
  size = 24, 
  routeNumber = 'D',
  lineColor = '#0096D6' // Default boat blue
}) => {
  const logoWidth = size;
  const circleWidth = size;
  const gap = size * 0.1; // 0.1x gap instead of 0.25x
  const fontSize = size / 1.428; // height/1.428 for font size
  
  return (
    <div 
      className={`inline-flex items-center ${className}`}
      style={{ gap: `${gap}px` }}
    >
      {/* Hajó Logo */}
      <svg
        width={logoWidth}
        height={logoWidth}
        viewBox="0 0 283.46 283.46"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <path 
            fill="#FFFFFF" 
            d="M269.294,141.73c0,70.451-57.112,127.562-127.562,127.562c-70.451,0-127.561-57.111-127.561-127.562
              c0-70.447,57.11-127.559,127.561-127.559C212.182,14.172,269.294,71.283,269.294,141.73z"
          />
          <path 
            fill="#1E1E1E" 
            d="M141.732,0C63.456,0,0.001,63.455,0.001,141.73c0,78.279,63.455,141.734,141.731,141.734
              c78.277,0,141.733-63.455,141.733-141.734C283.466,63.455,220.01,0,141.732,0z M141.732,259.756
              c-65.08,0-118.027-52.944-118.027-118.025c0-65.08,52.948-118.025,118.027-118.025c65.082,0,118.028,52.945,118.028,118.025
              C259.761,206.812,206.814,259.756,141.732,259.756z"
          />
          <path 
            fill="#13171B" 
            d="M105.917,155.852L105.917,155.852C105.948,155.852,105.932,155.852,105.917,155.852z"
          />
          <path 
            fill="#1E1E1E" 
            d="M140.047,70.864h-57.48v110.915c0,0,10.822-5.818,24.088-5.818c14.298,0,22.908,5.916,40.859,5.916
              c19.401,0,38.988-11.857,39.309-40.146h-21.828c-0.688,9.949-5.84,18.967-17.973,18.967c-17.951,0-26.758-4.846-41.058-4.846
              c-0.031,0-0.016,0,0,0V93.094h34.083c26.123,0,56.9,11.146,56.9,48.637c0,25.078-14.585,50-49.434,50
              c-17.951,0-26.561-5.801-40.859-5.801c-13.266,0-24.088,6.483-24.088,6.483v22.308c0,0,10.822-6.495,24.088-6.495
              c14.298,0,22.908,5.8,40.859,5.8c43.426,0,72.782-29.338,72.782-72.295C220.296,100.604,189.541,70.864,140.047,70.864z"
          />
        </g>
      </svg>
      
      {/* Route Number Circle */}
      <div 
        style={{
          width: circleWidth,
          height: circleWidth,
          borderRadius: '50%',
          backgroundColor: lineColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: `${fontSize}px`,
          fontWeight: 'bold',
          fontFamily: 'Open Sans, sans-serif',
          lineHeight: '1'
        }}
      >
        {routeNumber}
      </div>
    </div>
  );
};

export default HajoIcon;