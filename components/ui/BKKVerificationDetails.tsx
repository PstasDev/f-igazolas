import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import BKKLogo from '@/components/icons/BKKLogo';
import VehicleIcon from '@/components/ui/VehicleIcon';
import RouteBadge from '@/components/ui/RouteBadge';
import { 
  BKKVerification, 
  BKKDisruptionVerification, 
  BKKVehicleVerification, 
  validateBKKVerification 
} from '@/lib/bkk-verification-schema';
import { getBKKColors, getVehicleTypeName } from '@/lib/bkk-types';
import { ExternalLink, AlertTriangle, Clock, MapPin } from 'lucide-react';

interface BKKVerificationDetailsProps {
  bkkVerificationJson?: string | object;
  className?: string;
}

export function BKKVerificationDetails({ bkkVerificationJson, className = "" }: BKKVerificationDetailsProps) {
  if (!bkkVerificationJson) {
    return null;
  }

  let bkkVerification: BKKVerification;
  try {
    let parsed: unknown;
    
    if (typeof bkkVerificationJson === 'string') {
      parsed = JSON.parse(bkkVerificationJson);
    } else {
      parsed = bkkVerificationJson;
    }
    
    if (!validateBKKVerification(parsed)) {
      console.warn('Invalid BKK verification data:', parsed);
      return null;
    }
    bkkVerification = parsed;
  } catch (error) {
    console.error('Failed to parse BKK verification:', error);
    return null;
  }

  const isDisruption = bkkVerification.type === 'disruption';
  const timestamp = new Date(bkkVerification.timestamp);

  // Teacher information notice
  const TeacherInfoNotice = () => (
    <Alert className="border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-blue-900 dark:text-blue-400 text-sm">
        Osztályfőnöki tájékoztató - BKK Verifikáció
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-400 text-xs space-y-2">
        <p>
          ✅ <strong>Rendszer validálta:</strong> Ez az adat a BKK hivatalos API-jából származik, 
          és az igazolás beküldésekor valós időben lett ellenőrizve.
        </p>
        <p>
          ⚠️ <strong>Időérzékeny adatok:</strong> A BKK linkek és zavarinformációk ideiglenesek, 
          előfordulhat, hogy később már nem elérhetők, de az igazolás beküldésekor ezek hiteles adatok voltak.
        </p>
        <p>
          🎯 <strong>Csak valós zavarok:</strong> A diák csak olyan forgalmi problémákhoz tudott igazolást kapcsolni, 
          amelyek ténylegesen regisztrálva voltak a BKK rendszerében.
        </p>
      </AlertDescription>
    </Alert>
  );

  if (isDisruption) {
    const disruption = bkkVerification as BKKDisruptionVerification;
    const colors = getBKKColors(disruption.alert_data.category);
    
    return (
      <div className={`space-y-4 ${className}`}>
        <TeacherInfoNotice />
        
        {/* BKK Disruption Card */}
        <div className="border-2 border-purple-200 dark:border-purple-700 rounded-lg overflow-hidden bg-purple-50 dark:bg-purple-900/20">
          <div className="flex">
            {/* Left purple indicator */}
            <div className="w-2 bg-purple-500 flex-shrink-0"></div>
            
            {/* Main content */}
            <div className="flex-1 p-4">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center p-1.5">
                  <BKKLogo size={40} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">BKK Forgalmi Zavar</h3>
                    <Badge variant="outline" className={`${colors.background} ${colors.text} border-0 text-xs`}>
                      {getVehicleTypeName(disruption.alert_data.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                    <Clock className="w-4 h-4" />
                    <span>{timestamp.toLocaleString('hu-HU')}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wide block mb-2">
                    Zavar címe
                  </Label>
                  <p className="font-medium text-purple-900 dark:text-purple-100">{disruption.alert_data.title}</p>
                </div>
                
                <div>
                  <Label className="text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wide block mb-2">
                    Részletes leírás
                  </Label>
                  <p className="text-sm leading-relaxed text-purple-800 dark:text-purple-200">{disruption.alert_data.description}</p>
                </div>
                
                <div>
                  <Label className="text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wide block mb-2">
                    Érintett járatok
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {disruption.alert_data.affected_routes.map((route, index) => (
                      <RouteBadge 
                        key={index}
                        routeNumber={route}
                        vehicleType={disruption.alert_data.category}
                        className="scale-125"
                      />
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <Label className="text-purple-900 dark:text-purple-300 font-semibold block mb-1">Prioritás</Label>
                    <p className="text-purple-800 dark:text-purple-400">{disruption.alert_data.priority}</p>
                  </div>
                  <div>
                    <Label className="text-purple-900 dark:text-purple-300 font-semibold block mb-1">Hatás</Label>
                    <p className="text-purple-800 dark:text-purple-400">{disruption.alert_data.effect}</p>
                  </div>
                  <div>
                    <Label className="text-purple-900 dark:text-purple-300 font-semibold block mb-1">Ok</Label>
                    <p className="text-purple-800 dark:text-purple-400">{disruption.alert_data.cause}</p>
                  </div>
                  <div>
                    <Label className="text-purple-900 dark:text-purple-300 font-semibold block mb-1">Kategória</Label>
                    <p className="text-purple-800 dark:text-purple-400">{getVehicleTypeName(disruption.alert_data.category)}</p>
                  </div>
                </div>
                
                {disruption.alert_data.url && (
                  <div>
                    <Label className="text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wide block mb-2">
                      Hivatalos BKK link
                    </Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-auto py-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-400 text-purple-800 dark:text-purple-300"
                      onClick={() => window.open(disruption.alert_data.url!, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      BKK Információ megnyitása
                    </Button>
                    <p className="text-xs italic text-purple-700 dark:text-purple-400 mt-2">
                      ⚠️ Figyelem: A BKK rendszeresen törli a régi zavarjelentéseket, ezért előfordulhat, 
                      hogy ez a link már nem elérhető. Az igazolás beküldésekor ez az információ valós volt.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    const vehicle = bkkVerification as BKKVehicleVerification;
    const colors = getBKKColors(vehicle.vehicle_data.route.type);
    
    return (
      <div className={`space-y-4 ${className}`}>
        <TeacherInfoNotice />
        <Alert className={`border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20`}>
          <AlertTitle className="text-blue-900 dark:text-blue-400 text-lg inline-flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-lg ${colors.background} flex items-center justify-center`}>
              <VehicleIcon vehicleType={vehicle.vehicle_data.route.type} size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>BKK Jármű Információ</span>
                <Badge variant="outline" className={`${colors.background} ${colors.text} border-0 text-xs font-mono`}>
                  {vehicle.vehicle_data.route.id}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm font-normal">
                <Clock className="w-3 h-3" />
                <span className="text-blue-700 dark:text-blue-300">
                  {timestamp.toLocaleString('hu-HU')}
                </span>
              </div>
            </div>
          </AlertTitle>
          
          <AlertDescription className="text-blue-800 dark:text-blue-400 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                Járat információ
              </Label>
              <div className="space-y-1">
                <p className="font-medium">{vehicle.vehicle_data.route.name}</p>
                <p className="text-sm">{getVehicleTypeName(vehicle.vehicle_data.route.type)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <Label className="text-blue-900 dark:text-blue-300 font-semibold">Jármű ID</Label>
                <p className="text-blue-800 dark:text-blue-400 font-mono">{vehicle.vehicle_data.vehicle_id}</p>
              </div>
              <div>
                <Label className="text-blue-900 dark:text-blue-300 font-semibold">Státusz</Label>
                <p className="text-blue-800 dark:text-blue-400">{vehicle.vehicle_data.vehicle_info.status}</p>
              </div>
              {vehicle.vehicle_data.vehicle_info.license_plate && (
                <div>
                  <Label className="text-blue-900 dark:text-blue-300 font-semibold">Rendszám</Label>
                  <p className="text-blue-800 dark:text-blue-400 font-mono">{vehicle.vehicle_data.vehicle_info.license_plate}</p>
                </div>
              )}
              {vehicle.vehicle_data.vehicle_info.current_stop && (
                <div>
                  <Label className="text-blue-900 dark:text-blue-300 font-semibold">Jelenlegi megálló</Label>
                  <p className="text-blue-800 dark:text-blue-400">{vehicle.vehicle_data.vehicle_info.current_stop}</p>
                </div>
              )}
            </div>
            
            {vehicle.vehicle_data.trip_modifications.has_delays && (
              <div className="p-3 rounded-md bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <Label className="text-red-900 dark:text-red-300 font-semibold">Késések észlelve</Label>
                </div>
                <p className="text-sm text-red-800 dark:text-red-400">
                  A rendszer menetrend módosításokat vagy késéseket észlelt ennél a járműnél az igazolás időpontjában.
                </p>
              </div>
            )}
            
            {vehicle.vehicle_data.position && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Pozíció
                </Label>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <Label className="text-blue-900 dark:text-blue-300 font-semibold">Szélesség</Label>
                    <p className="text-blue-800 dark:text-blue-400 font-mono">{vehicle.vehicle_data.position.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <Label className="text-blue-900 dark:text-blue-300 font-semibold">Hosszúság</Label>
                    <p className="text-blue-800 dark:text-blue-400 font-mono">{vehicle.vehicle_data.position.longitude.toFixed(6)}</p>
                  </div>
                </div>
                {vehicle.vehicle_data.distance_from_user && (
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Távolság a beküldőtől: ~{Math.round(vehicle.vehicle_data.distance_from_user)}m
                  </p>
                )}
              </div>
            )}
            
            <p className="text-xs italic text-blue-700 dark:text-blue-400">
              ⚠️ Figyelem: A BKK járműadatok valós időben változnak. Az itt látható információk 
              az igazolás beküldésének időpontjában voltak érvényesek.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}