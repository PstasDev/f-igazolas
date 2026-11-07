'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Clock, FileText, Check, Upload, Image, X as XIcon, Paperclip } from 'lucide-react';
import BKKLogo from '@/components/icons/BKKLogo';
import MavLogo from '@/components/icons/MavLogo';
import { apiClient } from '@/lib/api';
import { IgazolasTipus, IgazolasCreateRequest, Profile } from '@/lib/types';
import { getIgazolasType } from '../../types';
import { BELL_SCHEDULE, getPeriodSchedule, buildReszletesIdopontok, groupConsecutivePeriods } from '@/lib/periods';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useFrontendConfig } from '@/app/context/FrontendConfigContext';
import { BKKDisruptionSelector } from './BKKDisruptionSelector';
import { ProcessedBKKAlert, ProcessedVehiclePosition, getVehicleTypeEmoji, getVehicleTypeName, getBKKColors } from '@/lib/bkk-types';
import { createDisruptionVerification, createVehicleVerification, BKKVerification } from '@/lib/bkk-verification-schema';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { TOUR_IDS, newIgazolasTourSteps } from '@/lib/onboarding-tours';

interface FormData {
  date: string;
  endDate: string; // For multi-day absences
  isMultiDay: boolean; // Toggle between single day and multi-day
  /**
   * Sorted, unique list of selected period indices for single-day absences.
   * When individual period selection is disabled this is always a contiguous
   * run (equivalent to the old [start..end] range). When enabled, gaps are
   * allowed and are transmitted as `reszletes_idopontok`.
   */
  selectedPeriods: number[];
  tipus: number | null;
  megjegyzes_diak: string;
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
  selectedPeriods: [0, 1, 2], // Default to first 3 periods
  tipus: null,
  megjegyzes_diak: '',
};

const getLocalDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const IMAGE_MAX_SIZE_MB = 10;
const IMAGE_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function MultiStepIgazolasForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const { config } = useFrontendConfig();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [igazolasTipusok, setIgazolasTipusok] = useState<IgazolasTipus[]>([]);
  const [filteredIgazolasTipusok, setFilteredIgazolasTipusok] = useState<IgazolasTipus[]>([]);
  const [mostUsedTipusok, setMostUsedTipusok] = useState<IgazolasTipus[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBKKSelector, setShowBKKSelector] = useState(false);
  const [pendingQuickBkkPrefill, setPendingQuickBkkPrefill] = useState(false);
  const [prefilledFromMulasztasok, setPrefilledFromMulasztasok] = useState(false);
  const [coveredMulasztasok, setCoveredMulasztasok] = useState<Array<{id: number, datum: string, ora: number, tantargy: string}>>([]);
  const [editMode, setEditMode] = useState(false);
  const [editIgazolasId, setEditIgazolasId] = useState<string | null>(null);
  const [pendingEditTypeName, setPendingEditTypeName] = useState<string | null>(null);
  const router = useRouter();

  // Load prefill data from sessionStorage
  useEffect(() => {
    // Process edit mode first priority
    const editDataJson = sessionStorage.getItem('edit_igazolas');
    if (editDataJson) {
      try {
        const parsed = JSON.parse(editDataJson);
        setEditMode(true);
        setEditIgazolasId(parsed.id);
        
        const dateStr = parsed.startDate.split('T')[0];
        const endDateStr = parsed.endDate.split('T')[0];
        const isMultiDay = dateStr !== endDateStr;
        
        setFormData(prev => ({
          ...prev,
          date: dateStr,
          endDate: endDateStr,
          isMultiDay,
          selectedPeriods: parsed.hours || [],
          megjegyzes_diak: parsed.reason && parsed.reason !== 'Nincs megjegyzés' ? parsed.reason : '',
        }));
        
        if (parsed.type) {
          setPendingEditTypeName(parsed.type);
        }
        
        toast.info('Szerkesztő mód bekapcsolva', { duration: 3000 });
        sessionStorage.removeItem('edit_igazolas');
        return; // Skip normal prefill logic
      } catch (err) {
        console.error('Failed to parse edit_igazolas data:', err);
      }
    }

    const prefillData = sessionStorage.getItem('prefill_igazolas');
    if (prefillData) {
      try {
        const parsed = JSON.parse(prefillData);
        if (parsed.from_bkk_quick) {
          const date = typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
            ? parsed.date
            : getLocalDateString();

          setFormData({
            ...INITIAL_FORM_DATA,
            date,
            endDate: date,
            selectedPeriods: [0, 1],
          });
          setPendingQuickBkkPrefill(true);
        } else if (parsed.from_mulasztasok) {
          // Extract date and period range from the prefilled datetime strings
          const startDate = new Date(parsed.eleje);
          const endDate = new Date(parsed.vege);
          const dateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          // Check if this is a multi-day absence
          const isMultiDay = parsed.is_multi_day || (dateStr !== endDateStr);
          
          if (isMultiDay) {
            // For multi-day absences, set date range and use full days
            setFormData({
              ...INITIAL_FORM_DATA,
              date: dateStr,
              endDate: endDateStr,
              isMultiDay: true,
              selectedPeriods: Array.from({ length: BELL_SCHEDULE.length }, (_, i) => i),
              megjegyzes_diak: parsed.megjegyzes_diak || '',
            });
          } else {
            // For single day absences, calculate period range from times using actual bell schedule
            const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
            const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
            
            // Find which period the start time falls into
            let startPeriod = 0;
            for (let i = 0; i < BELL_SCHEDULE.length; i++) {
              const [startHour, startMin] = BELL_SCHEDULE[i].start.split(':').map(Number);
              const periodStartMinutes = startHour * 60 + startMin;
              if (startMinutes >= periodStartMinutes) {
                startPeriod = i;
              }
            }
            
            // Find which period the end time falls into
            let endPeriod = 0;
            for (let i = 0; i < BELL_SCHEDULE.length; i++) {
              const [endHour, endMin] = BELL_SCHEDULE[i].end.split(':').map(Number);
              const periodEndMinutes = endHour * 60 + endMin;
              if (endMinutes <= periodEndMinutes) {
                endPeriod = i;
                break;
              }
              endPeriod = i; // Keep updating to last period if we don't break
            }
            
            const periods: number[] = [];
            for (let p = startPeriod; p <= endPeriod; p++) periods.push(p);

            setFormData({
              ...INITIAL_FORM_DATA,
              date: dateStr,
              selectedPeriods: periods,
              megjegyzes_diak: parsed.megjegyzes_diak || '',
            });
          }
          
          setPrefilledFromMulasztasok(true);
          
          // Load covered mulasztasok if available
          if (parsed.covered_mulasztasok) {
            setCoveredMulasztasok(parsed.covered_mulasztasok);
          }
          
          const multiDayText = isMultiDay ? ' (több napos)' : '';
          toast.success(`Űrlap kitöltve a kiválasztott mulasztásokból${multiDayText}`, { duration: 5000 });
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
        
        // Fetch profile, igazolás types, and most used types
        const [profile, types, mostUsed] = await Promise.all([
          apiClient.getMyProfile(),
          apiClient.listIgazolasTipus(),
          apiClient.getMostUsedIgazolasTipus().catch(() => []) // Fail gracefully if no history
        ]);
        
        setMyProfile(profile);
        setIgazolasTipusok(types);
        setMostUsedTipusok(mostUsed);
        
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
          
        } else {
          // If no class, show all types
          setFilteredIgazolasTipusok(types);
        }
        
        // If we are in edit mode and waiting for the type ID to be resolved
        if (pendingEditTypeName) {
          const match = types.find(t => t.nev === pendingEditTypeName);
          if (match) {
            setFormData(prev => ({ ...prev, tipus: match.id }));
            
            const isKozlekedesType = match.nev.toLowerCase() === 'közlekedés' || 
                                     match.nev.toLowerCase() === 'közlekedési probléma';
            if (isKozlekedesType) {
              // We won't automatically show the BKK selector in edit mode
              // because the verification might be already stored (but you can't edit bkk data atm)
              // This condition is just in case you want to trigger any BKK-related behavior
            }
          }
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

  useEffect(() => {
    if (isLoading || !pendingQuickBkkPrefill) return;

    const koezlekedesType = filteredIgazolasTipusok.find((type) => {
      const normalizedName = type.nev.trim().toLocaleLowerCase('hu-HU');
      return normalizedName === 'közlekedés' || normalizedName === 'közlekedési probléma';
    });

    if (!koezlekedesType) {
      toast.error('A Közlekedés igazolástípus nem érhető el ehhez az osztályhoz.');
      setPendingQuickBkkPrefill(false);
      return;
    }

    setFormData((previous) => ({ ...previous, tipus: koezlekedesType.id }));
    setPendingQuickBkkPrefill(false);
    setShowBKKSelector(true);
  }, [filteredIgazolasTipusok, isLoading, pendingQuickBkkPrefill]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Helper function to get the currently selected periods (sorted, unique)
  const getSelectedPeriods = (): number[] => {
    return [...new Set(formData.selectedPeriods)].sort((a, b) => a - b);
  };

  const getSelectedPeriodRanges = (): string[] => {
    return groupConsecutivePeriods(getSelectedPeriods()).flatMap((run) => {
      const firstPeriod = BELL_SCHEDULE[run[0]];
      const lastPeriod = BELL_SCHEDULE[run[run.length - 1]];
      return firstPeriod && lastPeriod ? [`${firstPeriod.start}–${lastPeriod.end}`] : [];
    });
  };

  const updateAbsenceDuration = (isMultiDay: boolean) => {
    if (formData.isMultiDay === isMultiDay) return;

    updateFormData({
      isMultiDay,
      endDate: isMultiDay ? formData.date : '',
      selectedPeriods: isMultiDay
        ? Array.from({ length: BELL_SCHEDULE.length }, (_, i) => i)
        : formData.selectedPeriods,
    });
  };

  // Calculate datetime strings for API submission
  const getStartDateTime = (): string => {
    if (formData.isMultiDay) {
      // For multi-day absences, start at the beginning of the day
      return `${formData.date}T${BELL_SCHEDULE[0]?.start || '08:00'}`;
    } else {
      const periods = getSelectedPeriods();
      if (periods.length > 0) {
        const firstPeriod = periods[0];
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
      const periods = getSelectedPeriods();
      if (periods.length > 0) {
        const lastPeriod = periods[periods.length - 1];
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

    if (!formData.isMultiDay && getSelectedPeriods().length === 0) {
      toast.error('Kérlek válassz ki legalább egy tanórát');
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

      // For single-day absences, if the selected periods contain a gap
      // (e.g. 1 + 3 with period 2 skipped), send the individual sub-intervals
      // so the backend records the "period gap" instead of a solid range.
      if (!formData.isMultiDay) {
        const reszletes = buildReszletesIdopontok(
          formData.date,
          getSelectedPeriods()
        );
        if (reszletes) {
          requestData.reszletes_idopontok = reszletes;
        }
      }

      // Only add optional fields if they have meaningful values
      if (formData.megjegyzes_diak && formData.megjegyzes_diak.trim() !== '') {
        requestData.megjegyzes_diak = formData.megjegyzes_diak.trim();
      }

      if (bkkVerification) {
        requestData.bkk_verification = bkkVerification;
      }

      console.log('Sending request data:', JSON.stringify(requestData, null, 2));

      let createdIgazolas;
      if (editMode && editIgazolasId) {
        createdIgazolas = await apiClient.editIgazolas(parseInt(editIgazolasId, 10), requestData);
        toast.success('Igazolás sikeresen módosítva!');
      } else {
        createdIgazolas = await apiClient.createIgazolas(requestData);
      }

      // Upload image if one was selected
      if (imageFile) {
        try {
          await apiClient.uploadIgazolasImage(createdIgazolas.id, imageFile);
          if (!editMode) toast.success('Igazolás sikeresen beküldve!');
        } catch (uploadError) {
          // Igazolás was created/edited but image upload failed — inform the user
          console.error('Image upload failed:', uploadError);
          const uploadMsg = uploadError instanceof Error ? uploadError.message : 'Ismeretlen hiba';
          toast.warning(`Igazolás beküldve, de a kép feltöltése sikertelen: ${uploadMsg}`);
        }
      } else {
        toast.success('Igazolás sikeresen beküldve!');
      }
      
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

  // Period selection: tap to toggle individual periods, swipe/drag to select
  // a contiguous range. Both work simultaneously and support gaps.
  //
  // All drag state is stored in refs (not useState) so that the global
  // mouseup/touchend listener always reads the latest values, avoiding the
  // stale-closure bug where a quickly released tap was not registered.
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);

  const rangeBetween = (a: number, b: number): number[] => {
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    const out: number[] = [];
    for (let i = lo; i <= hi; i++) out.push(i);
    return out;
  };

  const togglePeriod = useCallback((period: number) => {
    setFormData((fd) => {
      const selectedPeriods = [...new Set(fd.selectedPeriods)];
      const nextPeriods = selectedPeriods.includes(period)
        ? selectedPeriods.filter((selectedPeriod) => selectedPeriod !== period)
        : [...selectedPeriods, period];
      return { ...fd, selectedPeriods: nextPeriods.sort((a, b) => a - b) };
    });
  }, []);

  // Keep this callback stable for the global pointer listeners. Drag state is
  // stored in refs, and period toggling uses a functional state update.
  const finalizePeriodSelection = useCallback(() => {
    if (!isDraggingRef.current) return;
    if (!dragMovedRef.current && dragStartRef.current !== null) {
      // Short tap: toggle this single period in the saved selection.
      togglePeriod(dragStartRef.current);
    }
    // If the user dragged, the contiguous range is already committed via
    // extendPeriodSelection — nothing more to do.
    isDraggingRef.current = false;
    dragStartRef.current = null;
    dragMovedRef.current = false;
  }, [togglePeriod]);

  const beginPeriodSelection = (period: number) => {
    isDraggingRef.current = true;
    dragStartRef.current = period;
    dragMovedRef.current = false;
    // Do NOT mutate selectedPeriods here — wait to see if this becomes a drag
    // or a tap.
  };

  const extendPeriodSelection = (period: number) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    if (period !== dragStartRef.current) {
      dragMovedRef.current = true;
      setFormData((fd) => ({ ...fd, selectedPeriods: rangeBetween(dragStartRef.current!, period) }));
    }
  };

  // Pointer Events unify mouse/touch/pen. Using onMouseDown+onTouchStart
  // together previously caused a bug on mobile: browsers dispatch
  // compatibility mouse events after a touch interaction, which re-armed
  // and immediately re-finalized the drag, instantly undoing the tap.
  const handlePeriodPointerDown = (period: number) => beginPeriodSelection(period);

  const handlePeriodPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || dragStartRef.current === null) return;
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const periodAttr = element?.getAttribute('data-period');
    if (periodAttr) {
      extendPeriodSelection(parseInt(periodAttr));
    }
  };

  useEffect(() => {
    // Register once; finalizePeriodSelection stays stable through its callback dependencies.
    document.addEventListener('pointerup', finalizePeriodSelection);
    document.addEventListener('pointercancel', finalizePeriodSelection);
    return () => {
      document.removeEventListener('pointerup', finalizePeriodSelection);
      document.removeEventListener('pointercancel', finalizePeriodSelection);
    };
  }, [finalizePeriodSelection]);

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
      <div className="w-full max-w-3xl mx-auto py-8">
        <div className="flex justify-center items-center">
          <Spinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto min-w-0 overflow-hidden">
      <div className="flex flex-col gap-4 mb-6 pb-5 border-b" data-tour="new-igazolas-header">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            {editMode ? 'Igazolás szerkesztése' : 'Új igazolás beküldése'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {editMode ? 'Módosítsd a korábban beküldött igazolás adatait' : 'Töltsd ki a mezőket az igazolás beküldéséhez'}
          </p>
        </div>
        {prefilledFromMulasztasok && (
          <div className="rounded-md border-l-2 border-amber-500 bg-muted/30 px-4 py-3">
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Űrlap előre kitöltve mulasztásokból</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Az időpontok és megjegyzés automatikusan ki lettek töltve a kiválasztott {coveredMulasztasok.length} mulasztás alapján.
                  Ellenőrizd az adatokat és válaszd ki az igazolás típusát.
                </p>
                {coveredMulasztasok.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:underline">
                      Lefedett mulasztások megtekintése ({coveredMulasztasok.length})
                    </summary>
                    <div className="mt-2 space-y-1 border-l pl-4">
                      {coveredMulasztasok.map((m) => (
                        <div key={m.id} className="text-xs text-muted-foreground">
                          {m.datum} · {m.ora}. óra · {m.tantargy}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div className="space-y-4" data-tour="new-igazolas-date">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight">Hiányzás időpontja</h2>
          </div>

          <div className="space-y-2">
            <p id="absence-duration-label" className="text-sm font-medium">Hiányzás időtartama</p>
            <div
              role="group"
              aria-labelledby="absence-duration-label"
              className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-lg border bg-muted/30 p-1"
            >
              <Button
                type="button"
                variant="ghost"
                aria-pressed={!formData.isMultiDay}
                onClick={() => updateAbsenceDuration(false)}
                className={`w-full ${!formData.isMultiDay ? 'border border-border bg-background text-foreground shadow-sm hover:bg-background' : 'text-muted-foreground'}`}
              >
                Egy nap
              </Button>
              <Button
                type="button"
                variant="ghost"
                aria-pressed={formData.isMultiDay}
                onClick={() => updateAbsenceDuration(true)}
                className={`w-full ${formData.isMultiDay ? 'border border-border bg-background text-foreground shadow-sm hover:bg-background' : 'text-muted-foreground'}`}
              >
                Több nap
              </Button>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Több egymást követő nap esetén válaszd a „Több nap” lehetőséget. Ilyenkor a teljes időszak minden tanórája benne van az igazolásban.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {new Date(formData.date).toLocaleDateString('hu-HU')} – {new Date(formData.endDate).toLocaleDateString('hu-HU')}
              </span>
              {' '}· {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.date).getTime()) / (1000 * 60 * 60 * 24)) + 1} nap
            </p>
          )}
        </div>

        {/* Period selection is only needed for a single-day absence. */}
        {!formData.isMultiDay && (
          <div className="space-y-4 border-t pt-6" data-tour="new-igazolas-periods">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold tracking-tight">Tanórák kiválasztása</h2>
            </div>

            <TooltipProvider>
              <div
                className="flex flex-wrap justify-start gap-2 select-none touch-none sm:justify-center"
                onPointerMove={handlePeriodPointerMove}
                onPointerUp={finalizePeriodSelection}
                onPointerCancel={finalizePeriodSelection}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => {
                  const isSelected = formData.selectedPeriods.includes(h);
                  const stateColor = isSelected
                    ? 'period-pending period-glow-blue'
                    : 'period-inactive';
                  const tooltipText = `${isSelected ? 'Kiválasztott óra' : 'Nincs kiválasztva'}\n${getPeriodSchedule(h)}`;

                  return (
                    <Tooltip key={h}>
                      <TooltipTrigger asChild>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          aria-label={getPeriodSchedule(h)}
                          data-period={h}
                          onPointerDown={() => handlePeriodPointerDown(h)}
                          onKeyDown={(event) => {
                            if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault();
                              togglePeriod(h);
                            }
                          }}
                          className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-sm font-bold transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-none ${stateColor}`}
                        >
                          {h}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs whitespace-pre-line border-slate-600 bg-slate-800 text-xs font-medium text-white shadow-lg dark:border-slate-400 dark:bg-slate-200 dark:text-slate-800">
                        {tooltipText}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            <p className="text-center text-sm text-muted-foreground">
              Koppints az órákra a kijelöléshez, vagy húzd végig az ujjad/kurzorod az összefüggő órákon. Különálló órákat is kiválaszthatsz.
            </p>

            <div className="space-y-1 text-center text-sm">
              {getSelectedPeriods().length > 0 ? (
                <>
                  <p>
                    <span className="font-medium text-foreground">Kiválasztott órák:</span>{' '}
                    {getSelectedPeriods().map((i) => BELL_SCHEDULE[i]?.name).filter(Boolean).join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getSelectedPeriodRanges().length > 1 ? 'Időpontok' : 'Időpont'}: {getSelectedPeriodRanges().join(', ')}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Még nincs kiválasztott óra.</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4 border-t pt-6" data-tour="new-igazolas-type">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight">Igazolás típusa</h2>
          </div>

          {myProfile?.osztalyom && filteredIgazolasTipusok.length < igazolasTipusok.length && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Az osztályfőnököd korlátozta az elérhető típusokat. Az osztályod számára {filteredIgazolasTipusok.length} típus érhető el.
              </span>
            </p>
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

              {/* Quick selector for most used types */}
              {!formData.tipus && mostUsedTipusok.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {mostUsedTipusok.map((tipus) => {
                    const typeInfo = getIgazolasType(tipus.nev);
                    return (
                      <Button
                        key={tipus.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateFormData({ tipus: tipus.id })}
                         className="flex items-center gap-1.5 text-xs hover:border-foreground/30 hover:bg-muted"
                      >
                        <span>{typeInfo.emoji}</span>
                        <span>{tipus.nev}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
              
              {selectedTipusInfo && (
                <div className="space-y-3">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="mb-4 flex items-start gap-3">
                      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xl ${selectedTipusInfo.bgClass}`}>
                        {selectedTipusInfo.emoji}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold">{selectedTipusInfo.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{selectedTipusInfo.description}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{selectedTipusInfo.category}</p>
                      </div>
                    </div>
                    
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
                    
                  </div>
                </div>
              )}
            </div>

        <div className="space-y-4 border-t pt-6">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Opcionális részletek</h2>
                <p className="mt-1 text-sm text-muted-foreground">Indoklást vagy képet is csatolhatsz, ha szükséges.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2" data-tour="new-igazolas-description">
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
                  <Label htmlFor="imageFile">
                    Kép feltöltése
                    <span className="text-muted-foreground text-sm ml-2">(opcionális)</span>
                  </Label>
                  <div className="space-y-2" data-tour="new-igazolas-image">
                    {imageFile ? (
                      <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                        <Image className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{imageFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setImageFile(null)}
                          aria-label="Kép eltávolítása"
                        >
                          <XIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="imageFile"
                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-muted-foreground/30 rounded-md cursor-pointer hover:border-muted-foreground/60 hover:bg-muted/30 transition-colors"
                      >
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Kattints vagy húzz ide egy képet
                        </span>
                        <Input
                          id="imageFile"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (!file) return;
                            if (!IMAGE_ACCEPTED_TYPES.includes(file.type)) {
                              toast.error('Csak JPEG, PNG vagy WebP formátum fogadható el.');
                              return;
                            }
                            if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
                              toast.error(`A fájl mérete nem haladhatja meg a ${IMAGE_MAX_SIZE_MB} MB-ot.`);
                              return;
                            }
                            setImageFile(file);
                          }}
                        />
                      </label>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Elfogadott formátumok: JPEG, PNG, WebP — max. {IMAGE_MAX_SIZE_MB} MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

        <div className="space-y-4 border-t pt-6">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  {editMode
                    ? 'A módosítás elküldése után az igazolás ismét függőben lesz, amíg az osztályfőnököd újra el nem bírálja.'
                    : 'Az igazolás beküldése után az osztályfőnököd elbírálja azt. Értesítést nem kapsz az eredményről.'}
                </span>
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                  Űrlap visszaállítása
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-w-[160px] w-full sm:w-auto"
                  data-tour="new-igazolas-submit"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      {editMode ? 'Mentés...' : 'Beküldés...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {editMode ? 'Módosítás mentése' : 'Igazolás beküldése'}
                    </>
                  )}
                </Button>
              </div>
            </div>
      </div>
      
      {/* BKK Disruption Selector Dialog */}
      {showBKKSelector && (
        <BKKDisruptionSelector
          onSelectDisruption={handleBKKDisruptionSelect}
          onClose={() => setShowBKKSelector(false)}
          selectedDate={formData.date}
        />
      )}
      {!editMode && (
        <OnboardingTour
          tourId={TOUR_IDS.NEW_IGAZOLAS}
          steps={newIgazolasTourSteps}
          ready={!isLoading}
        />
      )}
    </div>
  );
}
