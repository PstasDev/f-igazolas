'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import VehicleIcon from '@/components/ui/VehicleIcon';
import BKKAlertCard from '@/components/ui/BKKAlertCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cleanBKKText } from '@/lib/text-cleanup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Search,
  CheckCircle,
  X,
  ChevronLeft
} from 'lucide-react';
import { BKKDataProcessor } from '@/lib/bkk-processor';
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

  // Load BKK data from example files
  useEffect(() => {
    const loadBKKData = async () => {
      try {
        setIsLoadingData(true);
        
        // Load alerts from example file
        const alertsResponse = await fetch('/BKK Examples/Alerts.txt');
        const alertsText = await alertsResponse.text();
        const processedAlerts = await BKKDataProcessor.parseAlertsFromText(alertsText);
        const activeAlerts = BKKDataProcessor.getActiveAlerts(processedAlerts);
        
        // Clean up text encoding issues in all alerts
        const cleanedAlerts = activeAlerts.map(alert => ({
          ...alert,
          title: cleanBKKText(alert.title),
          description: cleanBKKText(alert.description)
        }));
        
        setAlerts(cleanedAlerts);
        
        // Load vehicle positions from example file
        const vehiclesResponse = await fetch('/BKK Examples/VehiclePositions.txt');
        const vehiclesText = await vehiclesResponse.text();
        const processedVehicles = await BKKDataProcessor.parseVehiclePositionsFromText(vehiclesText);
        setVehicles(processedVehicles);
        
      } catch (error) {
        console.error('Failed to load BKK data:', error);
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
      const nearby = BKKDataProcessor.findNearbyVehicles(vehicles, location, 5000);
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

  // Filter alerts by type and search term
  const filteredAlerts = alerts
    .filter(alert => {
      if (vehicleTypeFilter !== 'all' && alert.category !== vehicleTypeFilter) {
        return false;
      }
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          alert.title.toLowerCase().includes(searchLower) ||
          alert.description.toLowerCase().includes(searchLower) ||
          alert.affectedRoutes.some(route => route.toLowerCase().includes(searchLower))
        );
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
        const searchLower = searchTerm.toLowerCase();
        return (
          vehicle.routeId.toLowerCase().includes(searchLower) ||
          vehicle.routeName.toLowerCase().includes(searchLower) ||
          (vehicle.licensePlate && vehicle.licensePlate.toLowerCase().includes(searchLower))
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
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="w-8 h-8" />
            <p className="text-sm text-muted-foreground">BKK adatok betöltése...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`overflow-hidden p-0 bg-white dark:bg-gray-900 ${
        isMobile 
          ? 'max-w-full h-screen w-full m-0 rounded-none' 
          : 'max-w-6xl h-[90vh]'
      }`} style={isMobile ? {} : { display: 'grid', gridTemplateRows: 'auto 1fr auto', height: 'calc(90vh)', maxHeight: 'calc(90vh)' }}>
        <DialogHeader className={`border-b border-blue-200 dark:border-blue-800 ${isMobile ? 'p-4 relative' : 'p-6 pb-4'}`} style={isMobile ? {} : { gridRow: '1' }}>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4 w-8 h-8 rounded-full p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <DialogTitle className={`flex items-center gap-3 ${isMobile ? 'text-lg pr-12' : 'text-xl'} font-bold`}>
            <div className={`${isMobile ? 'w-10 h-10' : 'w-10 h-10'} rounded-full bg-blue-600 flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">Ⓜ️</span>
            </div>
            <span className="text-blue-900 dark:text-blue-100">BKK Forgalmi Információk</span>
          </DialogTitle>
          <DialogDescription className={`text-blue-700 dark:text-blue-300 mt-2 ${isMobile ? 'text-sm' : ''}`}>
            {isMobile 
              ? 'Válassz ki egy forgalmi zavart vagy járművet' 
              : 'Válassz ki egy forgalmi zavart vagy járművet a késés igazolásához. A kiválasztott információ automatikusan hozzáadódik az igazoláshoz.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gray-50 dark:bg-gray-800 overflow-hidden" style={isMobile ? { flex: '1', display: 'flex', flexDirection: 'column' } : { gridRow: '2', minHeight: '0' }}>
          <Tabs defaultValue="alerts" className={`h-full ${isMobile ? 'flex flex-col' : ''}`} style={isMobile ? {} : { display: 'grid', gridTemplateRows: 'auto auto 1fr' }}>
            <TabsList className={`grid w-full grid-cols-2 bg-blue-100 dark:bg-blue-900 border-b-2 border-blue-200 dark:border-blue-700 mx-0 rounded-none ${isMobile ? 'h-14' : 'h-auto p-1'}`} style={isMobile ? {} : { gridRow: '1' }}>
              <TabsTrigger 
                value="alerts" 
                className={`flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-700 dark:text-blue-200 font-medium ${isMobile ? 'text-sm px-2' : ''}`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className={isMobile ? 'hidden sm:inline' : ''}>Forgalmi Zavarok</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>({filteredAlerts.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="vehicles" 
                className={`flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-700 dark:text-blue-200 font-medium ${isMobile ? 'text-sm px-2' : ''}`}
              >
                <MapPin className="w-4 h-4" />
                <span className={isMobile ? 'hidden sm:inline' : ''}>Közeli Járművek</span>
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>({filteredVehicles.length})</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Filters and Search */}
            <div className={`border-b space-y-4 ${isMobile ? 'p-3 space-y-3' : 'p-4'}`} style={isMobile ? {} : { gridRow: '2' }}>
              <div className={`${isMobile ? 'space-y-3' : 'flex flex-col sm:flex-row gap-4'}`}>
                <div className="flex-1">
                  <Label htmlFor="search" className="sr-only">Keresés</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder={isMobile ? "Keresés járat, útvonal..." : "Keresés járat száma, útvonal szerint..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 ${isMobile ? 'h-12 text-base' : ''}`}
                    />
                  </div>
                </div>
                
                <div className={`${isMobile ? 'w-full' : 'w-full sm:w-48'}`}>
                  <Label htmlFor="vehicle-filter" className="sr-only">Jármű típus</Label>
                  <Select 
                    value={vehicleTypeFilter} 
                    onValueChange={(value: 'all' | 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo') => setVehicleTypeFilter(value)}
                  >
                    <SelectTrigger className={`border-blue-300 focus:border-blue-500 ${isMobile ? 'h-12 text-base' : ''}`}>
                      <SelectValue placeholder="Jármű típus" />
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
        
        <div className={`border-t border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 ${isMobile ? 'p-4 space-y-4' : 'p-4'}`} style={isMobile ? {} : { gridRow: '3' }}>
          <div className={`${isMobile ? 'space-y-4' : 'flex justify-between items-center'}`}>
            <div className={`${isMobile ? 'w-full' : 'flex items-center gap-2'}`}>
              {selectedAlert && (
                <div className={`flex items-center gap-2 text-sm ${isMobile ? 'w-full p-3 bg-white dark:bg-gray-800 rounded-lg' : ''}`}>
                  <div className={`w-6 h-6 rounded-full ${getBKKColors(selectedAlert.category).background} flex items-center justify-center`}>
                    <VehicleIcon vehicleType={selectedAlert.category} size={14} />
                  </div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    {isMobile ? `${selectedAlert.title}` : `Forgalmi zavar kiválasztva: ${selectedAlert.title}`}
                  </span>
                </div>
              )}
              {selectedVehicle && (
                <div className={`flex items-center gap-2 text-sm ${isMobile ? 'w-full p-3 bg-white dark:bg-gray-800 rounded-lg' : ''}`}>
                  <div className={`w-6 h-6 rounded-full ${getBKKColors(selectedVehicle.vehicleType).background} flex items-center justify-center`}>
                    <VehicleIcon vehicleType={selectedVehicle.vehicleType} size={14} />
                  </div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    {isMobile ? `${selectedVehicle.routeId} - ${selectedVehicle.routeName}` : `Jármű kiválasztva: ${selectedVehicle.routeId} - ${selectedVehicle.routeName}`}
                  </span>
                </div>
              )}
              {!selectedAlert && !selectedVehicle && (
                <span className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-center block py-2' : 'text-sm'}`}>
                  Válassz ki egy elemet az igazoláshoz
                </span>
              )}
            </div>
            
            <div className={`${isMobile ? 'w-full' : 'flex gap-3'}`}>
              {!isMobile && (
                <Button variant="outline" onClick={onClose} className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900">
                  Mégse
                </Button>
              )}
              <Button 
                disabled={!selectedAlert && !selectedVehicle}
                onClick={handleConfirmSelection}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-medium ${isMobile ? 'w-full h-14 text-lg' : 'min-w-[120px]'}`}
              >
                {isMobile ? '✓ Kiválasztás és Bezárás' : '✓ Kiválasztás'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}