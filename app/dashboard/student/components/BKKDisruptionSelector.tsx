'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { RouteBadge } from '@/components/ui/RouteBadge';
import { HungarianLicensePlate } from '@/components/ui/HungarianLicensePlate';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Search,
  CheckCircle,
  CheckCircle2,
  Clock,
  Circle,
  MapPinned
} from 'lucide-react';
import { BKKDataProcessor } from '@/lib/bkk-processor';
import { bkkDataManager, type BKKDataLoadingStage } from '@/lib/bkk-data-manager';
import { apiClient } from '@/lib/api';
import {
  ProcessedBKKAlert, 
  ProcessedBKKAlertWithHistory,
  BKKDisruptionHistoryEntry,
  ProcessedVehiclePosition, 
  getVehicleTypeName,
  getBKKColors,
  calculateDistance
} from '@/lib/bkk-types';



interface BKKDisruptionSelectorProps {
  onSelectDisruption: (disruption: ProcessedBKKAlert | ProcessedVehiclePosition, type: 'alert' | 'vehicle') => void;
  onClose?: () => void;
  selectedDate?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

const BKK_LOADING_STEPS = [
  {
    stage: 'static-data',
    title: 'Járat- és megállóadatok betöltése',
    description: 'A járatok és a megállók adatainak előkészítése az azonosításhoz.',
  },
  {
    stage: 'live-data',
    title: 'Valós idejű adatok lekérése',
    description: 'Forgalmi riasztások, járműpozíciók és késési információk lekérése a BKK-tól.',
  },
  {
    stage: 'historical-data',
    title: 'Korábbi igazolások keresése',
    description: 'Megnézzük, mely mentett BKK-zavarok érintették a kiválasztott napot.',
  },
  {
    stage: 'processing',
    title: 'Adatok feldolgozása',
    description: 'A járművek és a járatazonosítók összerendelése, majd a lista előkészítése.',
  },
] as const;

const MOBILE_FULLSCREEN_DIALOG_CLASSES =
  'max-md:!left-0 max-md:!top-0 max-md:!translate-x-0 max-md:!translate-y-0 max-md:!w-full max-md:!max-w-full max-md:!h-[100dvh] max-md:!max-h-[100dvh] max-md:!rounded-none max-md:!flex max-md:!flex-col';

const getAlertIdentity = (alert: ProcessedBKKAlert): string => {
  const startDate = alert.startTime instanceof Date ? alert.startTime.toISOString().slice(0, 10) : '';
  if (alert.id) return `id:${alert.id}`;
  return `fallback:${alert.title.toLocaleLowerCase('hu-HU')}|${[...alert.affectedRoutes].sort().join(',')}|${startDate}`;
};

const asDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const mergeAlertsWithHistory = (
  liveAlerts: ProcessedBKKAlert[],
  historyEntries: BKKDisruptionHistoryEntry[]
): ProcessedBKKAlertWithHistory[] => {
  const merged = new Map<string, ProcessedBKKAlertWithHistory>();

  historyEntries.forEach(({ alert, otherStudentCount }) => {
    const savedAlert: ProcessedBKKAlert = {
      ...alert,
      title: cleanBKKText(alert.title),
      description: cleanBKKText(alert.description),
      startTime: asDate(alert.startTime),
      endTime: asDate(alert.endTime),
    };
    const key = getAlertIdentity(savedAlert);
    const existing = merged.get(key);

    merged.set(key, {
      ...(existing ?? savedAlert),
      hasRelatedIgazolas: true,
      isHistorical: true,
      otherStudentCount: Math.max(existing?.otherStudentCount ?? 0, otherStudentCount),
    });
  });

  liveAlerts.forEach((alert) => {
    const key = getAlertIdentity(alert);
    const savedAlert = merged.get(key);
    merged.set(key, {
      ...alert,
      hasRelatedIgazolas: savedAlert?.hasRelatedIgazolas ?? false,
      isHistorical: false,
      otherStudentCount: savedAlert?.otherStudentCount ?? 0,
    });
  });

  return [...merged.values()];
};

const isAlertRelevantOnDate = (alert: ProcessedBKKAlert, selectedDate: string): boolean => {
  const [year, month, day] = selectedDate.split('-').map(Number);
  if (!year || !month || !day) return false;

  const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
  const start = alert.startTime;
  const end = alert.endTime;

  if (!start) return true;
  return start <= dayEnd && (!end || end >= dayStart);
};

export function BKKDisruptionSelector({ onSelectDisruption, onClose, selectedDate }: BKKDisruptionSelectorProps) {
  const [alerts, setAlerts] = useState<ProcessedBKKAlertWithHistory[]>([]);
  const [vehicles, setVehicles] = useState<ProcessedVehiclePosition[]>([]);
  const [nearbyVehicles, setNearbyVehicles] = useState<ProcessedVehiclePosition[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingStage, setLoadingStage] = useState<BKKDataLoadingStage | 'historical-data' | 'fallback'>('static-data');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ProcessedBKKAlert | null>(null);
  const [selectedVehicle, setSelectedVehicleState] = useState<ProcessedVehiclePosition | null>(null);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'all' | 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat' | 'kesik'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load live data and date-matching saved disruptions in parallel.
  useEffect(() => {
    let cancelled = false;

    const loadBKKData = async () => {
      setIsLoadingData(true);

      let historyLoaded = !selectedDate;
      const historyPromise: Promise<BKKDisruptionHistoryEntry[]> = selectedDate
        ? apiClient.getBKKDisruptionHistory(selectedDate)
            .then((entries) => {
              historyLoaded = true;
              return entries;
            })
            .catch((error) => {
              historyLoaded = true;
              console.warn('BKKDisruptionSelector: Failed to load saved disruption history:', error);
              return [];
            })
        : Promise.resolve([]);

      const reportProgress = (stage: BKKDataLoadingStage) => {
        if (cancelled) return;
        if ((stage === 'processing' || stage === 'cached') && !historyLoaded) {
          setLoadingStage('historical-data');
          return;
        }
        setLoadingStage(stage === 'cached' ? 'processing' : stage);
      };

      try {
        const [{ alerts: processedAlerts, vehicles: processedVehicles }, savedDisruptions] = await Promise.all([
          bkkDataManager.initializeData(false, reportProgress),
          historyPromise,
        ]);

        const dateRelevantAlerts = selectedDate
          ? processedAlerts.filter(alert => isAlertRelevantOnDate(alert, selectedDate))
          : BKKDataProcessor.getActiveAlerts(processedAlerts);
        const cleanedAlerts = dateRelevantAlerts.map(alert => ({
          ...alert,
          title: cleanBKKText(alert.title),
          description: cleanBKKText(alert.description)
        }));

        if (cancelled) return;
        setAlerts(mergeAlertsWithHistory(cleanedAlerts, savedDisruptions));
        setVehicles(processedVehicles);
        setLoadingStage('processing');
        console.log(`BKKDisruptionSelector: Loaded ${cleanedAlerts.length} alerts and ${processedVehicles.length} vehicles`);
      } catch (error) {
        console.error('BKKDisruptionSelector: Failed to load BKK data:', error);
        if (!cancelled) setLoadingStage('fallback');
        const savedDisruptions = await historyPromise;
        
        // Final fallback: try to load example data directly
        try {
          console.log('BKKDisruptionSelector: Attempting fallback to example data...');
          const alertsResponse = await fetch('/BKK Examples/Alerts.txt');
          const alertsText = await alertsResponse.text();
          const processedAlerts = await BKKDataProcessor.parseAlertsFromText(alertsText);
          const dateRelevantAlerts = selectedDate
            ? processedAlerts.filter(alert => isAlertRelevantOnDate(alert, selectedDate))
            : BKKDataProcessor.getActiveAlerts(processedAlerts);
          
          const cleanedAlerts = dateRelevantAlerts.map(alert => ({
            ...alert,
            title: cleanBKKText(alert.title),
            description: cleanBKKText(alert.description)
          }));
          
          const vehiclesResponse = await fetch('/BKK Examples/VehiclePositions.txt');
          const vehiclesText = await vehiclesResponse.text();
          const processedVehicles = await BKKDataProcessor.parseVehiclePositionsFromText(vehiclesText);

          if (cancelled) return;
          setAlerts(mergeAlertsWithHistory(cleanedAlerts, savedDisruptions));
          setVehicles(processedVehicles);
          
          console.log('BKKDisruptionSelector: Successfully loaded fallback example data');
        } catch (fallbackError) {
          console.error('BKKDisruptionSelector: Failed to load fallback data:', fallbackError);
          if (!cancelled) setAlerts(mergeAlertsWithHistory([], savedDisruptions));
        }
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    };
    
    loadBKKData();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

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
      'hajo': ['hajó', 'hajo', 'boat', 'ship'],
      'vonat': ['vonat', 'train', 'ic', 'intercity', 'gyorsvonat', 'g', 'z', 's']
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

  // Calculate relevance score for sorting search results (higher = more relevant)
  const calculateRelevanceScore = (searchTerm: string, routeId: string, routeName: string): number => {
    if (!searchTerm) return 0;
    
    const search = searchTerm.toLowerCase().trim();
    const route = routeName.toLowerCase();
    
    // Exact match gets highest score
    if (route === search) return 1000;
    
    // Starts with search term gets high score
    if (route.startsWith(search)) return 900;
    
    // Contains search term gets medium score
    if (route.includes(search)) return 800;
    
    // Pattern matching for special cases
    // M2 vs 2: Metro lines should rank higher when searching with M prefix
    if (search.match(/^m\d+$/)) {
      const metroNum = search.replace('m', '');
      if (route.includes(metroNum)) {
        return route.startsWith('m') ? 950 : 700; // M2 > 2
      }
    }
    
    // H6 vs 6: HÉV lines should rank higher when searching with H prefix
    if (search.match(/^h\d+$/)) {
      const hevNum = search.replace('h', '');
      if (route.includes(hevNum)) {
        return route.startsWith('h') ? 950 : 700; // H6 > 6
      }
    }
    
    // Partial match on route number
    const searchNumbers = search.match(/\d+/g) || [];
    const routeNumbers = route.match(/\d+/g) || [];
    
    if (searchNumbers.length > 0 && routeNumbers.length > 0) {
      if (searchNumbers[0] === routeNumbers[0]) {
        return 750; // Same number, different prefix/suffix
      }
    }
    
    return 500; // Default low score
  };

  // Filter alerts by type and search term, sorted by relevance
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
    .map(alert => ({
      alert,
      relevance: searchTerm 
        ? Math.max(...alert.affectedRoutes.map(route => calculateRelevanceScore(searchTerm, route, route)))
        : 0
    }))
    .sort((a, b) => {
      // Alerts already linked to submitted justifications are shown first.
      const existingJustificationSort = Number(Boolean(b.alert.hasRelatedIgazolas)) - Number(Boolean(a.alert.hasRelatedIgazolas));
      if (existingJustificationSort !== 0) return existingJustificationSort;

      // Preserve the existing relevance and BKK priority ordering afterwards.
      if (searchTerm) {
        if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      }
      // Sort by priority (0 = highest)
      return a.alert.priority - b.alert.priority;
    })
    .map(item => item.alert);

  // Filter vehicles by type and search term, sorted by relevance
  const filteredVehicles = nearbyVehicles
    .filter(vehicle => {
      // Filter by delay status
      if (vehicleTypeFilter === 'kesik') {
        const hasDelay = BKKDataProcessor.checkVehicleDelays(vehicle, alerts);
        if (!hasDelay) return false;
      } else if (vehicleTypeFilter !== 'all' && vehicle.vehicleType !== vehicleTypeFilter) {
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
    })
    .map(vehicle => ({
      vehicle,
      relevance: searchTerm ? calculateRelevanceScore(searchTerm, vehicle.routeId, vehicle.routeName) : 0
    }))
    .sort((a, b) => {
      // If searching, sort by relevance
      if (searchTerm) {
        return b.relevance - a.relevance;
      }
      // Otherwise keep original order (by proximity)
      return 0;
    })
    .map(item => item.vehicle);

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
  const visibleLoadingSteps = selectedDate
    ? BKK_LOADING_STEPS
    : BKK_LOADING_STEPS.filter(step => step.stage !== 'historical-data');
  const currentLoadingStepIndex = visibleLoadingSteps.findIndex(step => step.stage === loadingStage);

  if (isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent
          animation="fade"
          className={`${isMobile
            ? 'flex h-[100dvh] w-full max-w-full flex-col justify-center rounded-none'
            : 'max-w-md'} ${MOBILE_FULLSCREEN_DIALOG_CLASSES} max-md:!justify-center`}
        >
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                <BKKLogo size={48} />
              </div>
              <div>
                <DialogTitle>BKK Forgalmi Információk</DialogTitle>
                <DialogDescription>Az adatok betöltése folyamatban van.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2" aria-busy="true" aria-live="polite">
            {loadingStage === 'waiting' ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
                <Spinner className="h-5 w-5 shrink-0" />
                <p className="text-sm">Egy már folyamatban lévő BKK-adatbetöltésre várunk.</p>
              </div>
            ) : loadingStage === 'fallback' ? (
              <div className="flex items-center gap-3 rounded-lg bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm">A BKK-adatok nem érhetők el, mintaadatok betöltésével próbálkozunk.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleLoadingSteps.map((step, index) => {
                  const isComplete = loadingStage === 'cached' || index < currentLoadingStepIndex;
                  const isCurrent = index === currentLoadingStepIndex;

                  return (
                    <div key={step.stage} className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : isCurrent ? (
                          <Spinner className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${isCurrent ? '' : 'text-muted-foreground'}`}>
                          {step.title}
                        </p>
                        {isCurrent && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground" role="status">
              {loadingStage === 'waiting'
                ? 'Amint elkészül, megjelenítjük az adatokat.'
                : loadingStage === 'fallback'
                  ? 'Kérjük, várj egy pillanatot.'
                  : loadingStage === 'cached'
                    ? 'Friss, gyorsítótárazott adatok használata.'
                    : `Betöltési lépés: ${currentLoadingStepIndex + 1} / ${visibleLoadingSteps.length}`}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent animation="fade" className={`overflow-hidden p-0 ${
        isMobile
          ? 'h-full w-full max-w-full m-0 rounded-none flex flex-col'
          : 'max-w-5xl h-[85vh] grid grid-rows-[auto_1fr_auto]'
      } ${MOBILE_FULLSCREEN_DIALOG_CLASSES}`} style={isMobile ? { height: '100dvh', maxHeight: '100dvh' } : {}}>
        {/* Compact Header - Fixed on mobile with safe area padding */}
        <DialogHeader className={`${isMobile ? 'flex-shrink-0' : ''} border-b ${isMobile ? 'p-3 pb-2 pt-safe' : 'p-4'}`} style={isMobile ? { paddingTop: 'max(0.75rem, env(safe-area-inset-top))' } : {}}>
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
        <div className={`overflow-hidden ${isMobile ? 'flex-1 min-h-0' : ''}`}>
          <Tabs defaultValue="alerts" className={`h-full ${isMobile ? 'flex flex-col' : 'grid grid-rows-[auto_auto_1fr]'}`}>
            {/* Compact, Sticky Tabs */}
            <TabsList className={`${isMobile ? 'flex-shrink-0' : ''} grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 rounded-none border-b ${
              isMobile ? 'h-11' : 'h-10'
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
            <div className={`${isMobile ? 'flex-shrink-0' : ''} border-b bg-gray-50 dark:bg-gray-900 ${isMobile ? 'p-3 space-y-2.5' : 'p-4 space-y-3'}`}>
              <div className={isMobile ? 'space-y-2.5' : 'flex gap-3'}>
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={isMobile ? "pl. 3V, M2, H5..." : "Keresés: 3 villamos, M2, H5, 3V, vil 3..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 ${isMobile ? 'h-10' : 'h-10'}`}
                    />
                  </div>
                </div>
                
                <div className={isMobile ? 'w-full' : 'w-48'}>
                  <Select 
                    value={vehicleTypeFilter} 
                    onValueChange={(value: 'all' | 'busz' | 'villamos' | 'metro' | 'hev' | 'ejszakai' | 'troli' | 'hajo' | 'vonat' | 'kesik') => setVehicleTypeFilter(value)}
                  >
                    <SelectTrigger className={isMobile ? 'h-10' : 'h-10'}>
                      <SelectValue placeholder="Típus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <span>Minden jármű</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="kesik" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-red-600">Késik</span>
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
                      <SelectItem value="vonat" className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <VehicleIcon vehicleType="vonat" size={16} /> <span>Vonat</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <TabsContent value="alerts" className={`m-0 p-0 ${isMobile ? 'flex-1 min-h-0 overflow-hidden' : ''}`} style={isMobile ? {} : { gridRow: '3', minHeight: '0' }}>
              <div className={`h-full overflow-y-auto overflow-x-hidden ${isMobile ? '' : ''}`}>
                <div className={`space-y-4 ${isMobile ? 'p-3 pb-20' : 'p-4'}`}>
                  {filteredAlerts.length === 0 ? (
                    <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                      <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center`}>
                        <AlertTriangle className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-600 dark:text-blue-400`} />
                      </div>
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 dark:text-gray-100 mb-2`}>
                        {searchTerm || vehicleTypeFilter !== 'all' 
                          ? 'Nincs találat' 
                          : selectedDate
                            ? 'Nincsenek rögzített zavarok erre a napra'
                            : 'Nincsenek aktív forgalmi zavarok'
                        }
                      </h3>
                      <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-sm px-4' : ''}`}>
                        {searchTerm || vehicleTypeFilter !== 'all' 
                          ? 'Próbálj meg másik keresési feltételt vagy szűrőt'
                          : selectedDate
                            ? 'A kiválasztott napon nem találtunk élő vagy korábban elmentett BKK-forgalmi zavart.'
                            : 'Jelenleg minden BKK jármű a menetrend szerint közlekedik'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <BKKAlertCard
                        key={getAlertIdentity(alert)}
                        alert={alert}
                        isSelected={selectedAlert ? getAlertIdentity(selectedAlert) === getAlertIdentity(alert) : false}
                        hasRelatedIgazolas={alert.hasRelatedIgazolas}
                        isHistorical={alert.isHistorical}
                        otherStudentCount={alert.otherStudentCount}
                        onClick={() => handleSelectAlert(alert)}
                      />
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="vehicles" className={`m-0 p-0 ${isMobile ? 'flex-1 min-h-0 flex flex-col overflow-hidden' : ''}`} style={isMobile ? {} : { gridRow: '3', minHeight: '0', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
              {(!userLocation || locationError) && (
                <div className={`${isMobile ? 'flex-shrink-0' : ''} border-b bg-blue-50 dark:bg-blue-950 ${isMobile ? 'p-3' : 'p-4'}`} style={isMobile ? {} : { gridRow: '1' }}>
                  {!userLocation && (
                    <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                      <div className={`flex items-center gap-3 ${isMobile ? 'flex-col text-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
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
                            className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white ml-4"
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
                  )}
                  
                  {locationError && (
                    <Alert variant="destructive" className={!userLocation ? 'mt-3' : ''}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-600 dark:bg-red-500 flex items-center justify-center">
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
              )}
              
              <div className={`overflow-y-auto overflow-x-hidden ${isMobile ? 'flex-1 min-h-0' : ''}`} style={isMobile ? {} : { gridRow: '2', minHeight: '0' }}>
                <div className={`space-y-3 ${isMobile ? 'p-3 pb-20' : 'p-4'}`}>
                  {!userLocation ? (
                    <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                      <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center`}>
                        <MapPin className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-600 dark:text-blue-400`} />
                      </div>
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 dark:text-gray-100 mb-2`}>
                        Helymeghatározás szükséges
                      </h3>
                      <p className={`text-gray-500 dark:text-gray-400 mb-4 ${isMobile ? 'text-sm px-4' : ''}`}>
                        Engedélyezd a helymeghatározást a közeli BKK járművek megtekintéséhez
                      </p>
                      <Button 
                        onClick={requestLocation} 
                        disabled={isLoadingLocation}
                        className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white"
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
                    <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                      <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center`}>
                        <MapPin className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-600 dark:text-blue-400`} />
                      </div>
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 dark:text-gray-100 mb-2`}>
                        {searchTerm || vehicleTypeFilter !== 'all' 
                          ? 'Nincs találat'
                          : 'Nincsenek közeli járművek'
                        }
                      </h3>
                      <p className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'text-sm px-4' : ''}`}>
                        {searchTerm || vehicleTypeFilter !== 'all' 
                          ? 'Próbálj meg másik keresési feltételt vagy szűrőt'
                          : 'Jelenleg nincsenek BKK járművek a 500m-es körzetben'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredVehicles.map((vehicle) => {
                      const hasDelay = BKKDataProcessor.checkVehicleDelays(vehicle, alerts);
                      const distance = userLocation 
                        ? Math.round(calculateDistance(userLocation.lat, userLocation.lng, vehicle.position.lat, vehicle.position.lng))
                        : 0;
                      
                      return (
                        <Card 
                          key={vehicle.vehicleId} 
                          className={`cursor-pointer transition-all duration-200 border-2 ${
                            selectedVehicle?.vehicleId === vehicle.vehicleId 
                              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
                          }`}
                          onClick={() => handleSelectVehicle(vehicle)}
                        >
                          <CardContent className={isMobile ? 'p-4' : 'p-5'}>
                            {/* Header with Route Badge and Basic Info */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                {/* Route Badge */}
                                <RouteBadge 
                                  routeNumber={vehicle.routeName} 
                                  vehicleType={vehicle.vehicleType}
                                />
                                
                                {/* Route Name & Status */}
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight">
                                    {vehicle.routeName}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {hasDelay ? (
                                      <Badge 
                                        variant="destructive"
                                        className="text-xs font-medium"
                                      >
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        {vehicle.delayMinutes !== undefined && Math.abs(vehicle.delayMinutes) > 0 
                                          ? `${vehicle.delayMinutes > 0 ? '+' : ''}${vehicle.delayMinutes} perc`
                                          : 'Zavar'
                                        }
                                      </Badge>
                                    ) : vehicle.delayMinutes !== undefined ? (
                                      <Badge 
                                        variant="secondary"
                                        className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Pontos
                                      </Badge>
                                    ) : (
                                      <Badge 
                                        variant="secondary"
                                        className="text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Normál
                                      </Badge>
                                    )}
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs font-medium"
                                    >
                                      {getVehicleTypeName(vehicle.vehicleType)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Distance Badge */}
                              <Badge 
                                variant="secondary"
                                className="text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 whitespace-nowrap"
                              >
                                <MapPinned className="w-3 h-3 mr-1" />
                                {distance < 100 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
                              </Badge>
                            </div>
                            
                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                              {/* Current Status */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  <span>{vehicle.status === 'STOPPED_AT' ? '🛑' : vehicle.status === 'IN_TRANSIT_TO' ? '🚀' : '❓'}</span>
                                  <span>Állapot</span>
                                </div>
                                <div className={`font-semibold text-sm ${
                                  vehicle.status === 'STOPPED_AT' 
                                    ? 'text-orange-600 dark:text-orange-400' 
                                    : vehicle.status === 'IN_TRANSIT_TO'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {vehicle.status === 'STOPPED_AT' 
                                    ? 'Megállóban' 
                                    : vehicle.status === 'IN_TRANSIT_TO'
                                    ? 'Úton'
                                    : vehicle.status}
                                </div>
                              </div>
                              
                              {/* License Plate or Label */}
                              {(vehicle.licensePlate || vehicle.label) && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    <span>🚗</span>
                                    <span>{vehicle.licensePlate ? 'Rendszám' : 'Azonosító'}</span>
                                  </div>
                                  {vehicle.licensePlate ? (
                                    <div className="mt-1">
                                      <HungarianLicensePlate licensePlate={vehicle.licensePlate} />
                                    </div>
                                  ) : (
                                    <div className="font-mono font-bold text-sm text-gray-900 dark:text-gray-100">
                                      {vehicle.label}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Speed (if available) */}
                              {vehicle.position.speed !== undefined && vehicle.position.speed > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    <span>⚡</span>
                                    <span>Sebesség</span>
                                  </div>
                                  <div className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                                    {Math.round(vehicle.position.speed * 3.6)} km/h
                                  </div>
                                </div>
                              )}
                              
                              {/* Bearing/Direction (if available) */}
                              {vehicle.position.bearing !== undefined && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    <span>🧭</span>
                                    <span>Irány</span>
                                  </div>
                                  <div className="font-semibold text-sm text-purple-600 dark:text-purple-400">
                                    {Math.round(vehicle.position.bearing)}°
                                    <span className="ml-1 text-xs">
                                      ({
                                        vehicle.position.bearing >= 337.5 || vehicle.position.bearing < 22.5 ? 'É' :
                                        vehicle.position.bearing >= 22.5 && vehicle.position.bearing < 67.5 ? 'ÉK' :
                                        vehicle.position.bearing >= 67.5 && vehicle.position.bearing < 112.5 ? 'K' :
                                        vehicle.position.bearing >= 112.5 && vehicle.position.bearing < 157.5 ? 'DK' :
                                        vehicle.position.bearing >= 157.5 && vehicle.position.bearing < 202.5 ? 'D' :
                                        vehicle.position.bearing >= 202.5 && vehicle.position.bearing < 247.5 ? 'DNy' :
                                        vehicle.position.bearing >= 247.5 && vehicle.position.bearing < 292.5 ? 'Ny' : 'ÉNy'
                                      })
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Last Update Time */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  <Clock className="w-3 h-3" />
                                  <span>Frissítve</span>
                                </div>
                                <div className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                                  {vehicle.timestamp.toLocaleTimeString('hu-HU', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </div>
                              </div>
                              
                              {/* Current Stop (if available and not just an ID) */}
                              {vehicle.currentStop && !/^\d+$/.test(vehicle.currentStop) && (
                                <div className="space-y-1 col-span-2">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    <MapPin className="w-3 h-3" />
                                    <span>Jelenlegi/következő megálló</span>
                                  </div>
                                  <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                    {vehicle.currentStop}
                                  </div>
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
        
        {/* Compact Footer - Fixed on mobile with safe area padding */}
        <div className={`${isMobile ? 'flex-shrink-0' : ''} border-t bg-white dark:bg-gray-900 ${isMobile ? 'p-3 pb-safe' : 'p-4'}`} style={isMobile ? { paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' } : {}}>
          {/* Info message for vehicles without delay data */}
          {selectedVehicle && !selectedVehicle.hasDelay && !selectedVehicle.delayMinutes && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                ℹ️ Ehhez a járathoz nincs rögzített késési információ. Az oktató látni fogja, hogy nem volt regisztrált késés.
              </p>
            </div>
          )}
          
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
                    {selectedVehicle.routeName} - {getVehicleTypeName(selectedVehicle.vehicleType)}
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
