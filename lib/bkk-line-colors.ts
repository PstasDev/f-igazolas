// BKK Line-specific colors and configurations

export const BKK_LINE_COLORS = {
  // Metro lines
  'M1': '#FFD800', // sarga
  'M2': '#E41F18', // piros
  'M3': '#005CA5', // kek
  'M4': '#4CA22F', // zold
  
  // HÉV lines
  'H5': '#821066', // lila
  'H6': '#824B00', // barna
  'H7': '#EE7203', // narancs
  'H8': '#ED677E', // rozsaszin
  'H9': '#ED677E', // rozsaszin
  
  // Boat lines (Duna)
  'D11': '#E50475', // pink
  'D12': '#9A1915', // bordo
  'D13': '#63140E', // barna
  'D14': '#D0033F', // bibor
  
  // General colors
  'busz': '#009EE3',
  'villamos': '#FFD800',
  'troli': '#E41F24',
  'hajo': '#0096D6', // default boat blue
  'metro': '#005CA5', // default metro blue
  'hev': '#821066', // default HÉV purple
} as const;

export function getMetroLineColor(routeId: string): string {
  const metroMapping: Record<string, keyof typeof BKK_LINE_COLORS> = {
    '5100': 'M1',
    '5200': 'M2',
    '5300': 'M3',
    '5400': 'M4',
    // Also support direct MX format
    'M1': 'M1',
    'M2': 'M2',
    'M3': 'M3',
    'M4': 'M4',
  };
  
  const lineKey = metroMapping[routeId];
  return lineKey ? BKK_LINE_COLORS[lineKey] : BKK_LINE_COLORS.metro;
}

export function getHevLineColor(routeId: string): string {
  const hevMapping: Record<string, keyof typeof BKK_LINE_COLORS> = {
    '5500': 'H5',
    '5600': 'H6',
    '5700': 'H7',
    '5800': 'H8',
    '5900': 'H9',
    // Also support direct HX format
    'H5': 'H5',
    'H6': 'H6',
    'H7': 'H7',
    'H8': 'H8',
    'H9': 'H9',
  };
  
  const lineKey = hevMapping[routeId];
  return lineKey ? BKK_LINE_COLORS[lineKey] : BKK_LINE_COLORS.hev;
}

export function getHajoLineColor(routeId: string): string {
  const hajoMapping: Record<string, keyof typeof BKK_LINE_COLORS> = {
    'D11': 'D11',
    'D12': 'D12',
    'D13': 'D13',
    'D14': 'D14',
  };
  
  const lineKey = hajoMapping[routeId];
  return lineKey ? BKK_LINE_COLORS[lineKey] : BKK_LINE_COLORS.hajo;
}

export function getMetroLineNumber(routeId: string): string {
  // Extract just the number from M1, M2, M3, M4 or route IDs
  if (routeId.startsWith('M') && ['M1', 'M2', 'M3', 'M4'].includes(routeId)) {
    return routeId.substring(1); // Return just the number part
  }
  
  const metroMapping: Record<string, string> = {
    '5100': '1',
    '5200': '2',
    '5300': '3',
    '5400': '4',
  };
  
  return metroMapping[routeId] || '?';
}

export function getHevLineNumber(routeId: string): string {
  // Extract just the number from H5, H6, H7, H8, H9 or route IDs
  if (routeId.startsWith('H') && ['H5', 'H6', 'H7', 'H8', 'H9'].includes(routeId)) {
    return routeId.substring(1); // Return just the number part
  }
  
  const hevMapping: Record<string, string> = {
    '5500': '5',
    '5600': '6',
    '5700': '7',
    '5800': '8',
    '5900': '9',
  };
  
  return hevMapping[routeId] || '?';
}

export function getHajoLineNumber(routeId: string): string {
  // Extract just the number from D11, D12, D13, D14
  if (routeId.startsWith('D') && ['D11', 'D12', 'D13', 'D14'].includes(routeId)) {
    return routeId.substring(1); // Return just the number part (11, 12, 13, 14)
  }
  
  const hajoMapping: Record<string, string> = {
    'D11': '11',
    'D12': '12',
    'D13': '13',
    'D14': '14',
  };
  
  return hajoMapping[routeId] || '?';
}