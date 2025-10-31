/**
 * Hungarian grammar utilities for route numbers
 */

/**
 * Get the correct Hungarian suffix for a route number
 */
export function getHungarianRouteSuffix(routeNumber: string): string {
  // Remove any non-numeric characters for suffix determination
  const numericPart = routeNumber.replace(/[^0-9]/g, '');
  if (!numericPart) return '-es'; // fallback
  
  const lastDigit = parseInt(numericPart.slice(-1));
  
  switch (lastDigit) {
    case 1:
      return '-es';
    case 2:
      return '-es';
    case 3:
      return '-as';
    case 4:
      return '-es';
    case 5:
      return '-ös';
    case 6:
      return '-os';
    case 7:
      return '-es';
    case 8:
      return '-as';
    case 9:
      return '-es';
    case 0:
      return '-ás';
    default:
      return '-es';
  }
}

/**
 * Get the correct Hungarian article (a/az) for a route number
 */
export function getHungarianRouteArticle(routeNumber: string): string {
  // Remove any non-numeric characters for article determination
  const numericPart = routeNumber.replace(/[^0-9]/g, '');
  if (!numericPart) return 'a'; // fallback
  
  const jarat = parseInt(numericPart);
  const firstDigit = parseInt(numericPart.charAt(0));
  
  // az for numbers starting with 1 or 5
  if ((firstDigit === 1 && jarat < 10) || firstDigit === 5) {
    return 'az';
  }
  
  return 'a';
}

/**
 * Get the correct Hungarian article for Metro/HÉV/Hajó routes
 */
export function getSpecialRouteArticle(vehicleType: string): string {
  switch (vehicleType) {
    case 'metro':
      return 'az'; // Az M1, Az M2, Az M3, Az M4
    case 'hev':
      return 'a';  // A H5, A H6, A H7, A H8, A H9
    case 'hajo':
      return 'a';  // A D11, A D12, A D13, A D14
    default:
      return 'a';
  }
}

/**
 * Format a single route number with proper Hungarian grammar
 */
export function formatHungarianRoute(routeNumber: string, vehicleType: string): string {
  const article = getHungarianRouteArticle(routeNumber);
  const suffix = getHungarianRouteSuffix(routeNumber);
  const vehicleTypeName = getVehicleTypeName(vehicleType);
  
  return `${article} ${routeNumber}${suffix} ${vehicleTypeName}`;
}

/**
 * Format multiple route numbers with proper Hungarian grammar and conjunctions
 */
export function formatHungarianRoutes(routeNumbers: string[], vehicleType: string): string {
  if (routeNumbers.length === 0) return '';
  if (routeNumbers.length === 1) {
    const formatted = formatHungarianRoute(routeNumbers[0], vehicleType);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  
  const vehicleTypeName = getVehicleTypeName(vehicleType);
  const formattedRoutes = routeNumbers.map(route => {
    const article = getHungarianRouteArticle(route);
    const suffix = getHungarianRouteSuffix(route);
    return `${article} ${route}${suffix}`;
  });
  
  if (formattedRoutes.length === 2) {
    const result = `${formattedRoutes[0]} és ${formattedRoutes[1]} ${vehicleTypeName}`;
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  // For 3+ routes: "A 34-es, a 106-os, a 901-es és a 918-as autóbusz"
  const lastRoute = formattedRoutes.pop();
  const result = `${formattedRoutes.join(', ')} és ${lastRoute} ${vehicleTypeName}`;
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Get the Hungarian vehicle type name
 */
function getVehicleTypeName(vehicleType: string): string {
  switch (vehicleType) {
    case 'villamos':
      return 'villamos';
    case 'busz':
      return 'autóbusz';
    case 'troli':
      return 'trolibusz';
    case 'metro':
      return 'metró';
    case 'hev':
      return 'HÉV';
    case 'hajo':
      return 'hajó';
    case 'ejszakai':
      return 'éjszakai autóbusz';
    default:
      return 'jármű';
  }
}