'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import VehicleIcon from '@/components/ui/VehicleIcon';
import BKKAlertCard from '@/components/ui/BKKAlertCard';
import BKKLogo from '@/components/icons/BKKLogo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cleanBKKText } from '@/lib/text-cleanup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Search,
  CheckCircle
} from 'lucide-react';
import { BKKDataProcessor } from '@/lib/bkk-processor';
import { bkkDataManager } from '@/lib/bkk-data-manager';
import { 
  ProcessedBKKAlert, 
  ProcessedVehiclePosition, 
  getVehicleTypeName,
  getBKKColors,
  getMetroLineColor
} from '@/lib/bkk-types';



interface BKKDisruptionSelectorProps {
  onSelectDisruption: (disruption: ProcessedBKKAlert | ProcessedVehiclePosition, type: 'alert' | 'vehicle') => void;
  onClose?: () => void;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function BKKDisruptionSelector({ onSelectDisruption, onClose }: BKKDisruptionSelectorProps) {
  const [alerts, setAlerts] = useState<ProcessedBKKAlert[]>([]);
  const [vehicles, setVehicles] = useState<ProcessedVehiclePosition[]>([]);
  const [nearbyVehicles, setNearbyVehicles] = useState<ProcessedVehiclePosition[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ProcessedBKKAlert | null>(null);
  const [selectedVehicle, setSelectedVehicleState] = useState<ProcessedVehiclePosition | null>(null);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'all' | 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load BKK data using the singleton data manager to prevent multiple network requests
  useEffect(() => {
    const loadBKKData = async () => {
      try {
        setIsLoadingData(true);
        
        // Use the singleton data manager which handles caching and prevents duplicate requests
        const { alerts: processedAlerts, vehicles: processedVehicles } = await bkkDataManager.initializeData();
        
        // Process alerts
        const activeAlerts = BKKDataProcessor.getActiveAlerts(processedAlerts);
        
        // Clean up text encoding issues in all alerts
        const cleanedAlerts = activeAlerts.map(alert => ({
          ...alert,
          title: cleanBKKText(alert.title),
          description: cleanBKKText(alert.description)
        }));
        
        setAlerts(cleanedAlerts);
        setVehicles(processedVehicles);
        
        console.log(`BKKDisruptionSelector: Loaded ${cleanedAlerts.length} alerts and ${processedVehicles.length} vehicles`);
        
      } catch (error) {
        console.error('BKKDisruptionSelector: Failed to load BKK data:', error);
        
        // Final fallback: try to load example data directly
        try {
          console.log('BKKDisruptionSelector: Attempting fallback to example data...');
          const alertsResponse = await fetch('/BKK Examples/Alerts.txt');
          const alertsText = await alertsResponse.text();
          const processedAlerts = await BKKDataProcessor.parseAlertsFromText(alertsText);
          const activeAlerts = BKKDataProcessor.getActiveAlerts(processedAlerts);
          
          const cleanedAlerts = activeAlerts.map(alert => ({
            ...alert,
            title: cleanBKKText(alert.title),
            description: cleanBKKText(alert.description)
          }));
          
          setAlerts(cleanedAlerts);
          
          const vehiclesResponse = await fetch('/BKK Examples/VehiclePositions.txt');
          const vehiclesText = await vehiclesResponse.text();
          const processedVehicles = await BKKDataProcessor.parseVehiclePositionsFromText(vehiclesText);
          setVehicles(processedVehicles);
          
          console.log('BKKDisruptionSelector: Successfully loaded fallback example data');
        } catch (fallbackError) {
          console.error('BKKDisruptionSelector: Failed to load fallback data:', fallbackError);
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadBKKData();
  }, []);

  // Request user location
  const requestLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('A böngésző nem támogatja a helymeghatározást');
      setIsLoadingLocation(false);
      return;
    }
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });
      
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      
      setUserLocation(location);
      
      // Find nearby vehicles
      const nearby = BKKDataProcessor.findNearbyVehicles(vehicles, location, 500); // 500 meters
      setNearbyVehicles(nearby);
      
    } catch (error: unknown) {
      let errorMessage = 'Hiba történt a helymeghatározás során';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const geoError = error as GeolocationPositionError;
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = 'A helymeghatározás engedélyezése szükséges';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = 'A helymeghatározás nem elérhető';
            break;
          case geoError.TIMEOUT:
            errorMessage = 'A helymeghatározás túllépte az időlimitet';
            break;
        }
      }
      
      setLocationError(errorMessage);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Enhanced search function to handle various search patterns
  const matchesSearch = (searchTerm: string, routeId: string, routeName: string, vehicleType: string, licensePlate?: string) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase().trim();
    const route = routeId.toLowerCase();
    const name = routeName.toLowerCase();
    const type = vehicleType.toLowerCase();
    const plate = licensePlate?.toLowerCase() || '';
    
    // Direct matches
    if (route.includes(search) || name.includes(search) || plate.includes(search)) {
      return true;
    }
    
    // Vehicle type mappings for Hungarian
    const typeAliases: { [key: string]: string[] } = {
      'villamos': ['villamos', 'vil', 'v', 'tram'],
      'busz': ['busz', 'bus', 'autóbusz', 'autobus', 'b'],
      'metro': ['metro', 'metró', 'm', 'subway'],
      'hev': ['hev', 'h', 'helyiérdekű', 'helyierdeку'],
      'troli': ['troli', 'trolibusz', 'trolley', 't'],
      'ejszakai': ['ejszakai', 'éjszakai', 'night', 'n'],
      'hajo': ['hajó', 'hajo', 'boat', 'ship']
    };
    
    // Get aliases for current vehicle type
    const currentTypeAliases = typeAliases[type] || [type];
    
    // Split search term to handle patterns like "3 villamos", "villamos 3", etc.
    const searchParts = search.split(/\s+/);
    const searchNumbers = search.match(/\d+/g) || [];
    const searchLetters = search.replace(/\d+/g, '').replace(/\s+/g, '');
    
    // Check if search contains route number
    for (const num of searchNumbers) {
      if (route.includes(num)) {
        // If we have letters/type words, check if they match the vehicle type
        if (searchLetters) {
          const matchesType = currentTypeAliases.some(alias => 
            alias.includes(searchLetters) || searchLetters.includes(alias)
          );
          if (matchesType) return true;
        } else {
          // Just number matches route
          return true;
        }
      }
    }
    
    // Check for pattern matching (e.g., "3V" for "3 villamos")
    if (search.match(/^\d+[a-z]$/)) {
      const num = search.match(/\d+/)?.[0];
      const letter = search.match(/[a-z]+$/)?.[0];
      
      if (num && letter && route.includes(num)) {
        const matchesType = currentTypeAliases.some(alias => 
          alias.startsWith(letter) || letter === alias.charAt(0)
        );
        if (matchesType) return true;
      }
    }
    
    // Check for metro patterns (M1, M2, M3, M4)
    if (search.match(/^m\d+$/)) {
      const metroNum = search.replace('m', '');
      if (type === 'metro' && route.includes(metroNum)) {
        return true;
      }
    }
    
    // Check for HÉV patterns (H5, H6, H7, H8, H9)
    if (search.match(/^h\d+$/)) {
      const hevNum = search.replace('h', '');
      if (type === 'hev' && route.includes(hevNum)) {
        return true;
      }
    }
    
    // Check each part of multi-word search
    if (searchParts.length > 1) {
      let hasRouteMatch = false;
      let hasTypeMatch = false;
      
      for (const part of searchParts) {
        // Check if part matches route
        if (route.includes(part) || name.includes(part)) {
          hasRouteMatch = true;
        }
        
        // Check if part matches vehicle type
        const matchesType = currentTypeAliases.some(alias => 
          alias.includes(part) || part.includes(alias)
        );
        if (matchesType) {
          hasTypeMatch = true;
        }
      }
      
      // Return true if we have both route and type match, or just route match
      return hasRouteMatch && (hasTypeMatch || searchParts.length === 1);
    }
    
    // Check if search term is a vehicle type alias
    const matchesType = currentTypeAliases.some(alias => 
      alias.includes(search) || search.includes(alias)
    );
    
    return matchesType;
  };

  // Filter alerts by type and search term
  const filteredAlerts = alerts
    .filter(alert => {
      if (vehicleTypeFilter !== 'all' && alert.category !== vehicleTypeFilter) {
        return false;
      }
      
      if (searchTerm) {
        // Use enhanced search for affected routes
        const matchesRoutes = alert.affectedRoutes.some(route => 
          matchesSearch(searchTerm, route, route, alert.category)
        );
        
        // Also check title and description for basic text search
        const searchLower = searchTerm.toLowerCase();
        const matchesText = alert.title.toLowerCase().includes(searchLower) || 
                           alert.description.toLowerCase().includes(searchLower);
        
        return matchesRoutes || matchesText;
      }
      
      return true;
    })
    .sort((a, b) => a.priority - b.priority); // Sort by priority (0 = highest)

  // Filter vehicles by type and search term
  const filteredVehicles = nearbyVehicles
    .filter(vehicle => {
      if (vehicleTypeFilter !== 'all' && vehicle.vehicleType !== vehicleTypeFilter) {
        return false;
      }
      
      if (searchTerm) {
        return matchesSearch(
          searchTerm, 
          vehicle.routeId, 
          vehicle.routeName, 
          vehicle.vehicleType, 
          vehicle.licensePlate
        );
      }
      
      return true;
    });

  const handleSelectAlert = (alert: ProcessedBKKAlert) => {
    setSelectedAlert(alert);
  };

  const handleSelectVehicle = (vehicle: ProcessedVehiclePosition) => {
    setSelectedVehicleState(vehicle);
  };

  const handleConfirmSelection = () => {
    if (selectedAlert) {
      onSelectDisruption(selectedAlert, 'alert');
    } else if (selectedVehicle) {
      onSelectDisruption(selectedVehicle, 'vehicle');
    }
    onClose?.();
  };

  const isMobile = useIsMobile();

  if (isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className={`${isMobile ? 'max-w-full h-screen w-full m-0 rounded-none' : 'max-w-4xl'}`}>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Spinner className="w-8 h-8" />
            <p className="text-sm text-muted-foreground">BKK adatok betöltése... <br />Ez eltarthat egy darabig.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`overflow-hidden p-0 ${
        isMobile 
          ? 'max-w-full h-screen w-full m-0 rounded-none flex flex-col' 
          : 'max-w-5xl h-[85vh] grid grid-rows-[auto_1fr_auto]'
      }`}>
        {/* Compact Header */}
        <DialogHeader className={`border-b ${isMobile ? 'p-3 pb-2' : 'p-4'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center p-1.5">
              <BKKLogo size={60} />
            </div>
            <div>
              <DialogTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>
                BKK Forgalmi Információk
              </DialogTitle>
              {!isMobile && (
                <DialogDescription className="text-sm text-muted-foreground">
                  Válassz ki egy forgalmi zavart vagy járművet a késés igazolásához
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        
        {/* Content Area with Better Overflow Handling */}
        <div className={`overflow-hidden ${isMobile ? 'flex-1 flex flex-col' : ''}`}>
          <Tabs defaultValue="alerts" className={`h-full ${isMobile ? 'flex flex-col' : 'grid grid-rows-[auto_auto_1fr]'}`}>
            {/* Compact, Sticky Tabs */}
            <TabsList className={`grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-none border-b ${
              isMobile ? 'sticky top-0 z-10 h-11' : 'h-10'
            }`}>
              <TabsTrigger 
                value="alerts" 
                className={`flex items-center justify-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-gray-900 ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Zavarok</span>
                <span className="ml-1 text-xs opacity-70">({filteredAlerts.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="vehicles" 
                className={`flex items-center justify-center gap-1.5 data-[state=active]:bg-white data-[state=active]:text-gray-900 ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Járművek</span>
                <span className="ml-1 text-xs opacity-70">({filteredVehicles.length})</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Compact Search & Filters */}
            <div className={`border-b bg-gray-50 dark:bg-gray-900 ${isMobile ? 'p-2 space-y-2' : 'p-3 space-y-2'}`}>
              <div className={isMobile ? 'space-y-2' : 'flex gap-3'}>
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={isMobile ? "pl. 3V, M2, H5..." : "Keresés: 3 villamos, M2, H5, 3V, vil 3..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 ${isMobile ? 'h-9' : 'h-8'}`}
                    />
                  </div>
                </div>
                
                <div className={isMobile ? 'w-full' : 'w-40'}>
                  <Select 
                    value={vehicleTypeFilter} 
                    onValueChange={(value: 'all' | 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo') => setVehicleTypeFilter(value)}
                  >
                    <SelectTrigger className={isMobile ? 'h-9' : 'h-8'}>
                      <SelectValue placeholder="Típus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <span>Minden jármű</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="busz" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <VehicleIcon vehicleType="busz" size={16} /> <span>Autóbusz</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="villamos" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <VehicleIcon vehicleType="villamos" size={16} /> <span>Villamos</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="troli" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <VehicleIcon vehicleType="troli" size={16} /> <span>Trolibusz</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="metro" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <VehicleIcon vehicleType="metro" size={16} /> <span>Metró</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="hev" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <VehicleIcon vehicleType="hev" size={16} /> <span>HÉV</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="ejszakai" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <VehicleIcon vehicleType="ejszakai" size={16} /> <span>Éjszakai</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="hajo" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <VehicleIcon vehicleType="hajo" size={16} /> <span>Hajó</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <TabsContent value="alerts" className={`overflow-hidden m-0 p-0 ${isMobile ? 'flex-1' : ''}`} style={isMobile ? {} : { gridRow: '3', minHeight: '0' }}>
              <div className={`h-full overflow-y-auto overflow-x-hidden ${isMobile ? 'flex-1' : ''}`}>
                <div className={`space-y-4 ${isMobile ? 'p-3' : 'p-4'}`}>
                  {filteredAlerts.length === 0 ? (
                    <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                      <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center`}>
                        <AlertTriangle className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-600 dark:text-blue-400`} />
                      </div>
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 dark:text-gray-100 mb-2`}>
                        {searchTerm || vehicleTypeFilter !== 'all' 
                          ? 'Nincs találat' 
                          : 'Nincsenek aktív forgalmi zavarok'
                        }
                      </h3>
                      <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-sm px-4' : ''}`}>
                        {searchTerm || vehicleTypeFilter !== 'all' 
                          ? 'Próbálj meg másik keresési feltételt vagy szűrőt'
                          : 'Jelenleg minden BKK jármű a menetrend szerint közlekedik'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <BKKAlertCard
                        key={alert.id}
                        alert={alert}
                        isSelected={selectedAlert?.id === alert.id}
                        onClick={() => handleSelectAlert(alert)}
                      />
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="vehicles" className={`overflow-hidden m-0 p-0 ${isMobile ? 'flex-1 flex flex-col' : ''}`} style={isMobile ? {} : { gridRow: '3', minHeight: '0', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
              <div className={`border-b bg-blue-50 dark:bg-blue-950 ${isMobile ? 'p-3' : 'p-4'}`} style={isMobile ? {} : { gridRow: '1' }}>
                {!userLocation ? (
                  <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                    <div className={`flex items-center gap-3 ${isMobile ? 'flex-col text-center' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <Navigation className="h-4 w-4 text-white" />
                      </div>
                      <AlertDescription className={`${isMobile ? 'w-full' : 'flex items-center justify-between flex-1'}`}>
                        <div className={isMobile ? 'mb-3' : ''}>
                          <p className={`font-medium text-blue-900 dark:text-blue-100 mb-1 ${isMobile ? 'text-sm' : ''}`}>
                            Helymeghatározás szükséges
                          </p>
                          <p className={`text-blue-700 dark:text-blue-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            A közeli BKK járművek megtekintéséhez engedélyezd a helymeghatározást
                          </p>
                        </div>
                        <Button 
                          onClick={requestLocation} 
                          disabled={isLoadingLocation}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white ml-4"
                        >
                          {isLoadingLocation ? (
                            <>
                              <Spinner className="w-4 h-4 mr-2" />
                              Kérés...
                            </>
                          ) : (
                            <>
                              <Navigation className="w-4 h-4 mr-2" />
                              Engedélyezés
                            </>
                          )}
                        </Button>
                      </AlertDescription>
                    </div>
                  </Alert>
                ) : (
                  <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <AlertDescription>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          ✅ Helymeghatározás aktív
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {nearbyVehicles.length} BKK jármű található 500m-es körzetben.
                          {userLocation.accuracy && (
                            <span className="ml-2 text-xs opacity-75">
                              (pontosság: ~{Math.round(userLocation.accuracy)}m)
                            </span>
                          )}
                        </p>
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
                
                {locationError && (
                  <Alert variant="destructive" className="mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <AlertDescription>
                        <p className="font-medium text-red-900 dark:text-red-100 mb-1">
                          Helymeghatározási hiba
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">{locationError}</p>
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </div>
              
              <div className="overflow-y-auto overflow-x-hidden" style={{ gridRow: '2', minHeight: '0' }}>
                <div className="space-y-4 p-4">
                  {!userLocation ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <MapPin className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Helymeghatározás szükséges
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Engedélyezd a helymeghatározást a közeli BKK járművek megtekintéséhez
                      </p>
                      <Button 
                        onClick={requestLocation} 
                        disabled={isLoadingLocation}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoadingLocation ? (
                          <>
                            <Spinner className="w-4 h-4 mr-2" />
                            Helymeghatározás...
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4 mr-2" />
                            Helymeghatározás engedélyezése
                          </>
                        )}
                      </Button>
                    </div>
                  ) : filteredVehicles.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <MapPin className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {searchTerm || vehicleTypeFilter !== 'all' 
                          ? 'Nincs találat'
                          : 'Nincsenek közeli járművek'
                        }
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || vehicleTypeFilter !== 'all' 
                          ? 'Próbálj meg másik keresési feltételt vagy szűrőt'
                          : 'Jelenleg nincsenek BKK járművek a 500m-es körzetben'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredVehicles.map((vehicle) => {
                      const hasDelay = BKKDataProcessor.checkVehicleDelays(vehicle, alerts);
                      const vehicleColors = getBKKColors(vehicle.vehicleType);
                      const isMetro = vehicle.vehicleType === 'metro';
                      const metroColors = isMetro ? getMetroLineColor(vehicle.routeId) : null;
                      
                      return (
                        <Card 
                          key={vehicle.vehicleId} 
                          className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-lg hover:scale-[1.02] ${
                            selectedVehicle?.vehicleId === vehicle.vehicleId 
                              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                          onClick={() => handleSelectVehicle(vehicle)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full ${
                                  metroColors ? metroColors.background : vehicleColors.background
                                } flex items-center justify-center relative`}>
                                  <VehicleIcon vehicleType={vehicle.vehicleType} size={20} />
                                  {hasDelay && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs">!</span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <CardTitle className="text-base text-gray-900 dark:text-gray-100 leading-tight">
                                    <span className={`inline-block px-2 py-1 rounded font-mono font-bold text-sm ${
                                      metroColors 
                                        ? `${metroColors.background} ${metroColors.text}`
                                        : `${vehicleColors.background} ${vehicleColors.text}`
                                    }`}>
                                      {vehicle.routeId}
                                    </span>
                                    <span className="ml-2 text-sm font-normal">{vehicle.routeName}</span>
                                  </CardTitle>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant={hasDelay ? 'destructive' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {hasDelay ? '⚠️ Zavar érintett' : '✅ Normál'}
                                    </Badge>
                                    <Badge variant="outline" className={`text-xs ${vehicleColors.background} ${vehicleColors.text} border-0`}>
                                      {getVehicleTypeName(vehicle.vehicleType)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {vehicle.licensePlate && (
                                <div className="flex flex-col">
                                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Rendszám</span>
                                  <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                    {vehicle.licensePlate}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex flex-col">
                                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Státusz</span>
                                <span className={`font-medium ${
                                  vehicle.status === 'STOPPED_AT' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {vehicle.status === 'STOPPED_AT' ? '🛑 Megállóban' : '🚀 Úton'}
                                </span>
                              </div>
                              
                              <div className="flex flex-col">
                                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Frissítés</span>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  {vehicle.timestamp.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              
                              {vehicle.currentStop && (
                                <div className="flex flex-col">
                                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Megálló</span>
                                  <span className="text-gray-700 dark:text-gray-300 text-xs">
                                    {vehicle.currentStop}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Compact Footer */}
        <div className={`border-t bg-white dark:bg-gray-900 ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className={`${isMobile ? 'space-y-2' : 'flex items-center justify-between'}`}>
            <div className={`${isMobile ? 'text-center' : 'flex items-center gap-2'}`}>
              {selectedAlert && (
                <div className={`flex items-center gap-2 text-sm ${isMobile ? 'justify-center' : ''}`}>
                  <div className={`w-4 h-4 rounded-full ${getBKKColors(selectedAlert.category).background} flex items-center justify-center`}>
                    <VehicleIcon vehicleType={selectedAlert.category} size={10} />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {isMobile ? selectedAlert.title.slice(0, 30) + '...' : `Zavar: ${selectedAlert.title}`}
                  </span>
                </div>
              )}
              {selectedVehicle && (
                <div className={`flex items-center gap-2 text-sm ${isMobile ? 'justify-center' : ''}`}>
                  <div className={`w-4 h-4 rounded-full ${getBKKColors(selectedVehicle.vehicleType).background} flex items-center justify-center`}>
                    <VehicleIcon vehicleType={selectedVehicle.vehicleType} size={10} />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedVehicle.routeId} - {selectedVehicle.routeName}
                  </span>
                </div>
              )}
              {!selectedAlert && !selectedVehicle && (
                <span className={`text-gray-500 dark:text-gray-400 text-sm ${isMobile ? 'block' : ''}`}>
                  Válassz ki egy elemet az igazoláshoz
                </span>
              )}
            </div>
            
            <div className={`${isMobile ? 'flex gap-2' : 'flex gap-2'}`}>
              {!isMobile && (
                <Button variant="outline" onClick={onClose} className="h-8 px-3 text-sm">
                  Mégse
                </Button>
              )}
              <Button 
                disabled={!selectedAlert && !selectedVehicle}
                onClick={handleConfirmSelection}
                className={`bg-gray-900 hover:bg-gray-800 text-white ${
                  isMobile ? 'flex-1 h-10' : 'h-8 px-4 text-sm'
                }`}
              >
                {isMobile ? '✓ Kiválasztás' : '✓ Kiválasztás'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}