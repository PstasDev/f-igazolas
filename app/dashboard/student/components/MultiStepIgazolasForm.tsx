'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Slider } from '@/components/ui/slider';
import { Field, FieldDescription, FieldTitle } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, FileText, Check, HelpCircle, ExternalLink, Folder, Share, Copy, Paperclip } from 'lucide-react';
import BKKLogo from '@/components/icons/BKKLogo';
import MavLogo from '@/components/icons/MavLogo';
import { apiClient } from '@/lib/api';
import { IgazolasTipus, IgazolasCreateRequest, Profile } from '@/lib/types';
import { getIgazolasType } from '../../types';
import { BELL_SCHEDULE, getPeriodSchedule } from '@/lib/periods';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BKKDisruptionSelector } from './BKKDisruptionSelector';
import { ProcessedBKKAlert, ProcessedVehiclePosition, getVehicleTypeEmoji, getVehicleTypeName, getBKKColors } from '@/lib/bkk-types';
import { createDisruptionVerification, createVehicleVerification, BKKVerification } from '@/lib/bkk-verification-schema';

interface FormData {
  date: string;
  endDate: string; // For multi-day absences
  isMultiDay: boolean; // Toggle between single day and multi-day
  periodRange: number[]; // [startPeriod, endPeriod] for consecutive periods
  tipus: number | null;
  megjegyzes_diak: string;
  imgDriveURL: string;
  bkkDisruption?: {
    type: 'alert' | 'vehicle';
    data: ProcessedBKKAlert | ProcessedVehiclePosition;
    description: string;
  };
}

const INITIAL_FORM_DATA: FormData = {
  date: '',
  endDate: '',
  isMultiDay: false,
  periodRange: [0, 2], // Default to first 3 periods (0, 1, 2)
  tipus: null,
  megjegyzes_diak: '',
  imgDriveURL: '',
};

export function MultiStepIgazolasForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [igazolasTipusok, setIgazolasTipusok] = useState<IgazolasTipus[]>([]);
  const [filteredIgazolasTipusok, setFilteredIgazolasTipusok] = useState<IgazolasTipus[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBKKSelector, setShowBKKSelector] = useState(false);
  const [prefilledFromMulasztasok, setPrefilledFromMulasztasok] = useState(false);
  const [coveredMulasztasok, setCoveredMulasztasok] = useState<Array<{id: number, datum: string, ora: number, tantargy: string}>>([]);
  const router = useRouter();

  // Load prefill data from sessionStorage
  useEffect(() => {
    const prefillData = sessionStorage.getItem('prefill_igazolas');
    if (prefillData) {
      try {
        const parsed = JSON.parse(prefillData);
        if (parsed.from_mulasztasok) {
          // Extract date and period range from the prefilled datetime strings
          const startDate = new Date(parsed.eleje);
          const endDate = new Date(parsed.vege);
          const dateStr = startDate.toISOString().split('T')[0];
          
          // Calculate period range from times
          const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
          const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
          const startPeriod = Math.max(0, Math.floor((startMinutes - 8 * 60) / 45));
          const endPeriod = Math.min(8, Math.floor((endMinutes - 8 * 60) / 45));
          
          setFormData({
            ...INITIAL_FORM_DATA,
            date: dateStr,
            periodRange: [startPeriod, endPeriod],
            megjegyzes_diak: parsed.megjegyzes_diak || '',
          });
          
          setPrefilledFromMulasztasok(true);
          
          // Load covered mulasztasok if available
          if (parsed.covered_mulasztasok) {
            setCoveredMulasztasok(parsed.covered_mulasztasok);
          }
          
          toast.success('Űrlap kitöltve a kiválasztott mulasztásokból', { duration: 5000 });
        }
        
        // Clear sessionStorage after loading
        sessionStorage.removeItem('prefill_igazolas');
      } catch (error) {
        console.error('Failed to parse prefill data:', error);
      }
    }
  }, []);

  // Load igazolás types on component mount
  useEffect(() => {
    const loadIgazolasTipusok = async () => {
      try {
        setIsLoading(true);
        
        // Fetch both profile and igazolás types
        const [profile, types] = await Promise.all([
          apiClient.getMyProfile(),
          apiClient.listIgazolasTipus()
        ]);
        
        setMyProfile(profile);
        setIgazolasTipusok(types);
        
        // Filter types based on student's class
        if (profile.osztalyom) {
          // Get the student's class ID
          const myClassId = profile.osztalyom.id;
          
          // Filter out types that are not accepted by the student's class
          const acceptedTypes = types.filter(tipus => {
            // Check if the student's class is in the nem_fogado_osztalyok list
            const isNotAccepted = tipus.nem_fogado_osztalyok?.some(
              osztaly => osztaly.id === myClassId
            );
            return !isNotAccepted; // Only include if NOT in the rejected list
          });
          
          setFilteredIgazolasTipusok(acceptedTypes);
          
          // Show info message if some types are filtered out
          if (acceptedTypes.length < types.length) {
            const filteredCount = types.length - acceptedTypes.length;
            toast.info(
              `${filteredCount} igazolástípus nem érhető el az osztályod számára`,
              { duration: 5000 }
            );
          }
        } else {
          // If no class, show all types
          setFilteredIgazolasTipusok(types);
        }
      } catch (error) {
        console.error('Failed to load igazolás types:', error);
        toast.error('Hiba történt az igazolás típusok betöltésekor');
      } finally {
        setIsLoading(false);
      }
    };

    loadIgazolasTipusok();
  }, []);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Helper function to get consecutive periods from range
  const getConsecutivePeriods = (): number[] => {
    const [start, end] = formData.periodRange;
    const periods = [];
    for (let i = start; i <= end; i++) {
      periods.push(i);
    }
    return periods;
  };

  // Calculate datetime strings for API submission
  const getStartDateTime = (): string => {
    if (formData.isMultiDay) {
      // For multi-day absences, start at the beginning of the day
      return `${formData.date}T${BELL_SCHEDULE[0]?.start || '08:00'}`;
    } else {
      if (formData.periodRange.length === 2) {
        const firstPeriod = formData.periodRange[0];
        const startTime = BELL_SCHEDULE[firstPeriod]?.start || '08:00';
        return `${formData.date}T${startTime}`;
      }
    }
    return '';
  };

  const getEndDateTime = (): string => {
    if (formData.isMultiDay) {
      // For multi-day absences, use the end date and end of last period
      const endDate = formData.endDate || formData.date;
      return `${endDate}T${BELL_SCHEDULE[BELL_SCHEDULE.length - 1]?.end || '16:00'}`;
    } else {
      if (formData.periodRange.length === 2) {
        const lastPeriod = formData.periodRange[1];
        const endTime = BELL_SCHEDULE[lastPeriod]?.end || '16:00';
        return `${formData.date}T${endTime}`;
      }
    }
    return '';
  };

  const handleSubmit = async () => {
    if (!formData.tipus) {
      toast.error('Kérlek válassz igazolás típust');
      return;
    }

    const startDateTime = getStartDateTime();
    const endDateTime = getEndDateTime();

    if (!startDateTime || !endDateTime) {
      toast.error('Kérlek add meg az időpontot');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const selectedTipus = igazolasTipusok.find(t => t.id === formData.tipus);
      const isKozlekedesType = selectedTipus?.nev?.toLowerCase() === 'közlekedés' || 
                               selectedTipus?.nev?.toLowerCase() === 'közlekedési probléma';
      
      // Create BKK verification if this is a transport-related request and BKK data exists
      let bkkVerification: BKKVerification | undefined;
      
      if (isKozlekedesType && formData.bkkDisruption) {
        if (formData.bkkDisruption.type === 'alert') {
          const alert = formData.bkkDisruption.data as ProcessedBKKAlert;
          bkkVerification = createDisruptionVerification(
            alert,
            undefined, // We don't have user location stored in current implementation
            'bkk_real_time_api'
          );
        } else {
          const vehicle = formData.bkkDisruption.data as ProcessedVehiclePosition;
          bkkVerification = createVehicleVerification(
            vehicle,
            undefined, // We don't have user location stored in current implementation  
            vehicle.hasDelay || false,
            [], // We don't have related alerts in current implementation
            'bkk_real_time_api'
          );
        }
      }
      
      const requestData: IgazolasCreateRequest = {
        eleje: startDateTime,
        vege: endDateTime,
        tipus: formData.tipus,
        diak: true,
        korrigalt: false,
      };

      // Only add optional fields if they have meaningful values
      if (formData.megjegyzes_diak && formData.megjegyzes_diak.trim() !== '') {
        requestData.megjegyzes_diak = formData.megjegyzes_diak.trim();
      }

      if (formData.imgDriveURL && formData.imgDriveURL.trim() !== '') {
        requestData.imgDriveURL = formData.imgDriveURL.trim();
      }

      if (bkkVerification) {
        requestData.bkk_verification = bkkVerification;
      }

      console.log('Sending request data:', JSON.stringify(requestData, null, 2));

      await apiClient.createIgazolas(requestData);
      toast.success('Igazolás sikeresen beküldve!');
      
      // Navigate back to the igazolások list
      window.location.hash = 'igazolasok';
      router.refresh();
    } catch (error) {
      console.error('Failed to create igazolás:', error);
      
      // Enhanced error logging to help debug the issue
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check if it's an API error with additional details
        const apiError = error as Error & { detail?: string; status?: number };
        if (apiError.detail) {
          console.error('API error detail:', apiError.detail);
        }
        if (apiError.status) {
          console.error('HTTP status:', apiError.status);
        }
      }
      
      let errorMessage = 'Hiba történt az igazolás beküldésekor';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePeriodRangeChange = (value: number[]) => {
    updateFormData({ periodRange: value });
  };

  // Swipeable period selection
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const handlePeriodMouseDown = (period: number) => {
    setIsDragging(true);
    setDragStart(period);
    updateFormData({ periodRange: [period, period] });
  };

  const handlePeriodMouseEnter = (period: number) => {
    if (isDragging && dragStart !== null) {
      const start = Math.min(dragStart, period);
      const end = Math.max(dragStart, period);
      updateFormData({ periodRange: [start, end] });
    }
  };

  const handlePeriodMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handlePeriodTouchStart = (period: number) => {
    setIsDragging(true);
    setDragStart(period);
    updateFormData({ periodRange: [period, period] });
  };

  const handlePeriodTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStart === null) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const periodAttr = element?.getAttribute('data-period');
    
    if (periodAttr) {
      const period = parseInt(periodAttr);
      const start = Math.min(dragStart, period);
      const end = Math.max(dragStart, period);
      updateFormData({ periodRange: [start, end] });
    }
  };

  const handlePeriodTouchEnd = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    // Add global mouse up listener to handle drag end outside periods
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
  };

  // BKK disruption handlers
  const handleBKKDisruptionSelect = (
    disruption: ProcessedBKKAlert | ProcessedVehiclePosition, 
    type: 'alert' | 'vehicle'
  ) => {
    let description = '';
    
    if (type === 'alert') {
      const alert = disruption as ProcessedBKKAlert;
      description = `BKK forgalmi zavar: ${alert.title}. Érintett járatok: ${alert.affectedRoutes.join(', ')}`;
    } else {
      const vehicle = disruption as ProcessedVehiclePosition;
      description = `BKK jármű: ${vehicle.routeId} - ${vehicle.routeName} (${getVehicleTypeName(vehicle.vehicleType)})`;
    }
    
    updateFormData({
      bkkDisruption: {
        type,
        data: disruption,
        description
      },
      megjegyzes_diak: formData.megjegyzes_diak + (formData.megjegyzes_diak ? '\n\n' : '') + description
    });
    
    setShowBKKSelector(false);
    toast.success('BKK zavar hozzáadva az igazoláshoz');
  };

  const removeBKKDisruption = () => {
    if (!formData.bkkDisruption) return;
    
    // Remove BKK description from the note
    const bkkDescription = formData.bkkDisruption.description;
    let newNote = formData.megjegyzes_diak.replace(bkkDescription, '').trim();
    newNote = newNote.replace(/\n\n\n+/g, '\n\n'); // Clean up extra newlines
    
    updateFormData({
      bkkDisruption: undefined,
      megjegyzes_diak: newNote
    });
    
    toast.success('BKK zavar eltávolítva');
  };

  const selectedTipus = formData.tipus ? igazolasTipusok.find(t => t.id === formData.tipus) : null;
  const selectedTipusInfo = selectedTipus ? getIgazolasType(selectedTipus.nev) : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center items-center">
            <Spinner className="w-8 h-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Új igazolás beküldése</CardTitle>
        <CardDescription>
          Töltsd ki a mezőket az igazolás beküldéséhez
        </CardDescription>
        {prefilledFromMulasztasok && (
          <div className="mt-4 p-4 bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-teal-900 dark:text-teal-100">
                  ✨ Űrlap előre kitöltve mulasztásokból
                </p>
                <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
                  Az időpontok és megjegyzés automatikusan ki lettek töltve a kiválasztott {coveredMulasztasok.length} mulasztás alapján.
                  Ellenőrizd az adatokat és válaszd ki az igazolás típusát.
                </p>
                {coveredMulasztasok.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm text-teal-600 dark:text-teal-400 cursor-pointer hover:underline">
                      Lefedett mulasztások megtekintése ({coveredMulasztasok.length})
                    </summary>
                    <div className="mt-2 space-y-1 pl-4 border-l-2 border-teal-300 dark:border-teal-700">
                      {coveredMulasztasok.map((m) => (
                        <div key={m.id} className="text-xs text-teal-700 dark:text-teal-300">
                          📅 {m.datum} • {m.ora}. óra • {m.tantargy}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Date Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <Label htmlFor="date" className="text-lg font-medium">Dátum</Label>
          </div>
          
          {/* Toggle for single day vs multi-day */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <Label htmlFor="isMultiDay" className="text-sm font-medium cursor-pointer">
              <input
                id="isMultiDay"
                type="checkbox"
                checked={formData.isMultiDay}
                onChange={(e) => {
                  const isMultiDay = e.target.checked;
                  updateFormData({ 
                    isMultiDay,
                    endDate: isMultiDay ? formData.date : '',
                    periodRange: isMultiDay ? [0, BELL_SCHEDULE.length - 1] : formData.periodRange
                  });
                }}
                className="mr-2"
              />
              Több napos hiányzás
            </Label>
            <span className="text-xs text-muted-foreground">
              {formData.isMultiDay ? '(Teljes napok)' : '(Egy nap)'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm">
                {formData.isMultiDay ? 'Kezdő dátum' : 'Dátum'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    updateFormData({ 
                      date: newDate,
                      // If multi-day and end date is before start date, update end date
                      endDate: formData.isMultiDay && formData.endDate && formData.endDate < newDate 
                        ? newDate 
                        : formData.endDate
                    });
                  }}
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    updateFormData({ 
                      date: today,
                      // If multi-day and end date is before today, update end date
                      endDate: formData.isMultiDay && formData.endDate && formData.endDate < today 
                        ? today 
                        : formData.endDate
                    });
                  }}
                  className="px-3 whitespace-nowrap"
                >
                  Ma
                </Button>
              </div>
            </div>
            
            {formData.isMultiDay && (
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm">Befejező dátum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormData({ endDate: e.target.value })}
                  min={formData.date}
                  required={formData.isMultiDay}
                  className="w-full"
                />
              </div>
            )}
          </div>
          
          {formData.isMultiDay && formData.date && formData.endDate && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Több napos hiányzás:</strong> {new Date(formData.date).toLocaleDateString('hu-HU')} - {new Date(formData.endDate).toLocaleDateString('hu-HU')}
                {' '}({Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.date).getTime()) / (1000 * 60 * 60 * 24)) + 1} nap)
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                A hiányzás minden tanórát érint ezeken a napokon.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Period Selection (only for single day) */}
        {!formData.isMultiDay && (
          <>
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <Label className="text-lg font-medium">Tanórák kiválasztása</Label>
              </div>
              
              <TooltipProvider>
                <div 
                  className="flex flex-wrap gap-2 justify-center select-none"
                  onTouchMove={handlePeriodTouchMove}
                  onTouchEnd={handlePeriodTouchEnd}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => {
                    const isInRange = h >= formData.periodRange[0] && h <= formData.periodRange[1];
                    
                    let bgColor = "period-inactive";
                    let glowColor = "";
                    let tooltipText = `Nincs kiválasztva\n${getPeriodSchedule(h)}`;
                    
                    if (isInRange) {
                      bgColor = "period-pending";
                      glowColor = "period-glow-blue";
                      tooltipText = `Kiválasztott óra\n${getPeriodSchedule(h)}`;
                    }
                    
                    return (
                      <Tooltip key={h}>
                        <TooltipTrigger asChild>
                          <span
                            data-period={h}
                            onMouseDown={() => handlePeriodMouseDown(h)}
                            onMouseEnter={() => handlePeriodMouseEnter(h)}
                            onTouchStart={() => handlePeriodTouchStart(h)}
                            className={`inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg cursor-pointer transition-all duration-200 ease-in-out transform ${bgColor} ${isInRange ? glowColor : ''} hover:scale-110 active:scale-95 touch-none`}
                          >
                            {h}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-600 dark:border-slate-400 font-medium text-xs whitespace-pre-line max-w-xs shadow-lg">
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Kiválasztott órák:</strong>{' '}
                  {getConsecutivePeriods().map(i => BELL_SCHEDULE[i]?.name).join(', ')}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Időtartam: {BELL_SCHEDULE[formData.periodRange[0]]?.start} - {BELL_SCHEDULE[formData.periodRange[1]]?.end}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Type Selection */}
        <Separator />
        <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <Label className="text-lg font-medium">Igazolás típusa</Label>
              </div>
              
              {myProfile?.osztalyom && filteredIgazolasTipusok.length < igazolasTipusok.length && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ℹ️ Az osztályfőnököd korlátozta az elérhető igazolástípusokat. 
                    Csak a {filteredIgazolasTipusok.length} engedélyezett típus érhető el az osztályod számára.
                  </p>
                </div>
              )}
              
              <Select
                value={formData.tipus?.toString() || ''}
                onValueChange={(value) => updateFormData({ tipus: parseInt(value) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Válassz igazolás típust..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredIgazolasTipusok.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nincs elérhető igazolástípus
                    </div>
                  ) : (
                    filteredIgazolasTipusok.map((tipus) => {
                      const typeInfo = getIgazolasType(tipus.nev);
                      return (
                        <SelectItem key={tipus.id} value={tipus.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{typeInfo.emoji}</span>
                            <span>{tipus.nev}</span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              
              {selectedTipusInfo && (
                <div className="space-y-3">
                  <div className={`p-4 rounded-md border ${selectedTipusInfo.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{selectedTipusInfo.emoji}</span>
                      <h4 className="font-medium">{selectedTipusInfo.name}</h4>
                    </div>
                    <p className="text-sm mb-3">{selectedTipusInfo.description}</p>
                    
                    {/* BKK Integration for Transport Type */}
                    {(selectedTipus?.nev?.toLowerCase() === 'közlekedés' || 
                      selectedTipus?.nev?.toLowerCase() === 'közlekedési probléma') && (
                      <div className="mt-4 space-y-3"
                        data-debug={`BKK section shown for type: ${selectedTipus?.nev}`}
                      >
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2 inline-flex items-center gap-2">
                                <div className="flex-shrink-0 mt-1">
                                  <BKKLogo size={60} />
                                </div>
                                  Forgalmi Információk (opcionális)
                              </h5>
                              <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                                Amennyiben a BKK rendszerében forgalmi zavar vagy késés <strong>lett regisztrálva</strong>, az alábbi gombra kattintva csatolhatod a hitelesített adatokat az igazolásodhoz.
                              </p>
                              
                              {/* Info about MÁV train support */}
                              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-3">
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 mt-0.5">
                                    <MavLogo size={20} />
                                  </div>
                                  <p className="text-xs text-blue-800 dark:text-blue-200">
                                    <strong>MÁV vonatok:</strong> Egyes vonatok valós idejű helyzete is elérhető a rendszerben, amelyek szintén csatolhatók az igazoláshoz.
                                  </p>
                                </div>
                              </div>
                              
                              {!formData.bkkDisruption ? (
                                <Button
                                  type="button"
                                  onClick={() => setShowBKKSelector(true)}
                                  variant="outline"
                                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950"
                                >
                                  <div className="flex items-center justify-center gap-3">
                                    <Paperclip />
                                    
                                    <span>Csatolás</span>
                                  </div>
                                </Button>
                              ) : (
                                <div className="space-y-3">
                                  {/* Selected BKK Item - Compact Display */}
                                  <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                                    <div className="flex items-start gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        formData.bkkDisruption.type === 'alert' 
                                          ? 'bg-red-500'
                                          : getBKKColors((formData.bkkDisruption.data as ProcessedVehiclePosition).vehicleType).background
                                      }`}>
                                        <span className="text-white text-sm">
                                          {formData.bkkDisruption.type === 'alert' 
                                            ? '⚠️' 
                                            : getVehicleTypeEmoji((formData.bkkDisruption.data as ProcessedVehiclePosition).vehicleType)
                                          }
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-purple-900 dark:text-purple-100 text-sm mb-1">
                                          {formData.bkkDisruption.type === 'alert' 
                                            ? 'Forgalmi Zavar' 
                                            : 'Jármű Információ'
                                          }
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                                          {formData.bkkDisruption.description}
                                        </p>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500 text-xs">
                                          ✅ Hivatalos BKK adat
                                        </Badge>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={removeBKKDisruption}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 w-8 h-8 rounded-lg flex-shrink-0"
                                      >
                                        <span className="sr-only">Eltávolítás</span>
                                        <span className="text-sm">✕</span>
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowBKKSelector(true)}
                                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950 text-sm"
                                  >
                                    🔄 Másik adat kiválasztása
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary">
                        {selectedTipusInfo.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

        {/* Step 4: Optional Fields */}
        <Separator />
        <div className="space-y-4">
              <Label className="text-lg font-medium">Opcionális mezők</Label>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="megjegyzes">Indoklás</Label>
                  <Textarea
                    id="megjegyzes"
                    placeholder="Add meg a részleteket, körülményeket..."
                    value={formData.megjegyzes_diak}
                    onChange={(e) => updateFormData({ megjegyzes_diak: e.target.value })}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="imgDriveURL">Dokumentum URL</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Útmutató
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Folder className="w-5 h-5" />
                            Google Drive mappa megosztás útmutató
                          </DialogTitle>
                          <DialogDescription>
                            Kövesd ezeket a lépéseket a dokumentumok helyes megosztásához
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                              <strong>Fontos:</strong> Ez az útmutató egyszeri beállítást igényel. Miután beállítottad a mappát, minden új dokumentumot csak fel kell töltened, és a linkjét meg kell adnod.
                            </p>
                          </div>
                          
                          {/* Step 1 */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">1</div>
                              <h3 className="text-lg font-semibold">Mappa létrehozása Google Drive-ban</h3>
                            </div>
                            <div className="ml-11 space-y-2">
                              <p className="text-sm text-gray-600 dark:text-gray-300">Nyisd meg a Google Drive-ot és hozz létre egy új mappát &quot;Igazolások&quot; néven.</p>
                              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <Folder className="w-4 h-4 text-blue-500" />
                                <code className="text-sm">Igazolások</code>
                              </div>
                            </div>
                          </div>
                          
                          {/* Step 2 */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">2</div>
                              <h3 className="text-lg font-semibold">Mappa megosztása az osztályfőnökkel</h3>
                            </div>
                            <div className="ml-11 space-y-2">
                              <p className="text-sm text-gray-600 dark:text-gray-300">Jobb klikk a mappára → &quot;Megosztás&quot; → Add hozzá az osztályfőnök email címét</p>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-2">
                                <div className="flex items-center gap-2">
                                  <Share className="w-4 h-4 text-green-500" />
                                  <span className="text-sm font-medium">Jogosultság: &quot;Megtekintő&quot;</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Az osztályfőnök így láthatja a feltöltött dokumentumokat</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Step 3 */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">3</div>
                              <h3 className="text-lg font-semibold">Dokumentum feltöltése</h3>
                            </div>
                            <div className="ml-11 space-y-2">
                              <p className="text-sm text-gray-600 dark:text-gray-300">Töltsd fel a szükséges dokumentumokat a mappába:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-red-600 dark:text-red-400">🏥</span>
                                    <span className="text-sm font-medium">Orvosi igazolás</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">Orvosi papírok, szakorvosi leletek</p>
                                </div>
                                <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-orange-600 dark:text-orange-400">🚇</span>
                                    <span className="text-sm font-medium">Közlekedési igazolás</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">MÁV, BKK késési igazolások</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Step 4 */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">4</div>
                              <h3 className="text-lg font-semibold">Dokumentum link másolása</h3>
                            </div>
                            <div className="ml-11 space-y-2">
                              <p className="text-sm text-gray-600 dark:text-gray-300">Jobb klikk a dokumentumra → &quot;Link másolása&quot;</p>
                              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                  <Copy className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm font-medium">Példa link:</span>
                                </div>
                                <code className="text-xs bg-white dark:bg-gray-800 p-2 rounded border block break-all">
                                  https://drive.google.com/file/d/1abc...xyz/view?usp=sharing
                                </code>
                              </div>
                            </div>
                          </div>
                          
                          {/* Step 5 */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-bold">5</div>
                              <h3 className="text-lg font-semibold">Link beillesztése ide</h3>
                            </div>
                            <div className="ml-11 space-y-2">
                              <p className="text-sm text-gray-600 dark:text-gray-300">Illeszd be a kimásolt linket a &quot;Dokumentum URL&quot; mezőbe</p>
                              <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                                <div className="flex items-center gap-2">
                                  <Check className="w-4 h-4 text-green-500" />
                                  <span className="text-sm">A link automatikusan elérhető lesz az osztályfőnök számára</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                            <div className="flex items-start gap-3">
                              <ExternalLink className="w-5 h-5 text-blue-500 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Hasznos tipp</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  Minden új igazolásnál csak fel kell töltened a dokumentumot a már megosztott mappába, 
                                  majd a dokumentum linkjét be kell illesztened. A mappa megosztást csak egyszer kell beállítani!
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="imgDriveURL"
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={formData.imgDriveURL}
                    onChange={(e) => updateFormData({ imgDriveURL: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Illeszd be a Google Drive dokumentum linkjét a támogató dokumentumhoz.
                  </p>
                </div>
              </div>
            </div>

        {/* Submit section */}
        <Separator />
        <div className="space-y-4">
              <h4 className="font-medium text-lg">Igazolás összefoglalása</h4>
              
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {formData.isMultiDay ? 'Dátum tartomány' : 'Dátum'}
                    </Label>
                    {formData.isMultiDay ? (
                      <p className="text-sm">
                        {new Date(formData.date).toLocaleDateString('hu-HU')} - {new Date(formData.endDate || formData.date).toLocaleDateString('hu-HU')}
                      </p>
                    ) : (
                      <p className="text-sm">{new Date(formData.date).toLocaleDateString('hu-HU')}</p>
                    )}
                  </div>
                  
                  {!formData.isMultiDay && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Időszak</Label>
                      <p className="text-sm">
                        {getConsecutivePeriods().map(i => BELL_SCHEDULE[i]?.name).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {formData.isMultiDay && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Típus</Label>
                      <p className="text-sm">Teljes napok</p>
                    </div>
                  )}
                  
                  {selectedTipus && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Típus</Label>
                      <div className="flex items-center gap-2">
                        <span>{selectedTipusInfo?.emoji}</span>
                        <span className="text-sm">{selectedTipus.nev}</span>
                      </div>
                    </div>
                  )}
                  
                  {formData.megjegyzes_diak && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Indoklás</Label>
                      <p className="text-sm">{formData.megjegyzes_diak}</p>
                    </div>
                  )}
                  
                  {formData.imgDriveURL && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Dokumentum</Label>
                      <a 
                        href={formData.imgDriveURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Támogató dokumentum megtekintése
                      </a>
                    </div>
                  )}
                  
                  {formData.bkkDisruption && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">BKK Igazolás</Label>
                      <div className="flex items-start gap-3 mt-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          formData.bkkDisruption.type === 'alert' 
                            ? 'bg-red-500'
                            : getBKKColors((formData.bkkDisruption.data as ProcessedVehiclePosition).vehicleType).background
                        }`}>
                          <span className="text-white text-sm">
                            {formData.bkkDisruption.type === 'alert' 
                              ? '⚠️' 
                              : getVehicleTypeEmoji((formData.bkkDisruption.data as ProcessedVehiclePosition).vehicleType)
                            }
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {formData.bkkDisruption.description}
                          </p>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500 text-xs">
                            ✅ Hivatalos BKK adat
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Az igazolás beküldése után az osztályfőnököd elbírálja azt. Értesítést nem kapsz az eredményről.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Űrlap visszaállítása
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[160px]"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Beküldés...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Igazolás beküldése
                    </>
                  )}
                </Button>
              </div>
            </div>
      </CardContent>
      
      {/* BKK Disruption Selector Dialog */}
      {showBKKSelector && (
        <BKKDisruptionSelector
          onSelectDisruption={handleBKKDisruptionSelect}
          onClose={() => setShowBKKSelector(false)}
        />
      )}
    </Card>
  );
}