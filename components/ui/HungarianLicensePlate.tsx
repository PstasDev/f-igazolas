import React from 'react';

interface HungarianLicensePlateProps {
  licensePlate: string;
  className?: string;
}

/**
 * Renders a Hungarian license plate using the official HuLI-Regular font.
 * The font includes special glyphs for borders and the EU section.
 * Supports formats: AAA123, AAA-123, AABB123, AA-BB-123, AA BB 123, AA-BB 123, AA BB-123
 */
export const HungarianLicensePlate: React.FC<HungarianLicensePlateProps> = ({ 
  licensePlate, 
  className = '' 
}) => {
  // Normalize the license plate by removing spaces and dashes, keep uppercase
  const normalized = licensePlate.toUpperCase().replace(/[\s-]/g, '');
  
  // Parse the license plate to separate letters and numbers
  let letters = '';
  let numbers = '';
  
  // Extract letters (at the beginning)
  let i = 0;
  while (i < normalized.length && /[A-Z]/.test(normalized[i])) {
    letters += normalized[i];
    i++;
  }
  
  // Extract numbers (remaining characters)
  while (i < normalized.length && /[0-9]/.test(normalized[i])) {
    numbers += normalized[i];
    i++;
  }
  
  // The EU section with H is at the left, followed by the plate text
  const plateContent = `${letters} ${numbers}`;
  
  return (
    <div 
      className={`inline-flex items-center ${className}`}
      style={{
        fontFamily: '"HuLI-Regular", monospace',
        fontSize: '48px',
        lineHeight: '0.69',
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        borderRadius: '4px',
        padding: '8.5px 6px 0px 0px',
        gap: '4px'
      }}
    >
      {/* EU section with H */}
      <span style={{ color: '#003399' }}>%</span>
      
      {/* License plate text */}
      <span style={{ color: '#000000' }}>
        {plateContent}
      </span>
    </div>
  );
};

export default HungarianLicensePlate;
