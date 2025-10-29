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
import { Calendar, Clock, FileText, Check, HelpCircle, ExternalLink, Folder, Share, Copy } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { IgazolasTipus, IgazolasCreateRequest } from '@/lib/types';
import { getIgazolasType } from '../../types';
import { BELL_SCHEDULE, getPeriodSchedule } from '@/lib/periods';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BKKDisruptionSelector } from './BKKDisruptionSelector';
import { ProcessedBKKAlert, ProcessedVehiclePosition, getVehicleTypeEmoji, getVehicleTypeName, getBKKColors } from '@/lib/bkk-types';

interface FormData {
  date: string;
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
  periodRange: [0, 2], // Default to first 3 periods (0, 1, 2)
  tipus: null,
  megjegyzes_diak: '',
  imgDriveURL: '',
};

export function MultiStepIgazolasForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [igazolasTipusok, setIgazolasTipusok] = useState<IgazolasTipus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBKKSelector, setShowBKKSelector] = useState(false);
  const router = useRouter();

  // Load igazolás types on component mount
  useEffect(() => {
    const loadIgazolasTipusok = async () => {
      try {
        setIsLoading(true);
        const types = await apiClient.listIgazolasTipus();
        setIgazolasTipusok(types);
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
    if (formData.periodRange.length === 2) {
      const firstPeriod = formData.periodRange[0];
      const startTime = BELL_SCHEDULE[firstPeriod]?.start || '08:00';
      return `${formData.date}T${startTime}`;
    }
    return '';
  };

  const getEndDateTime = (): string => {
    if (formData.periodRange.length === 2) {
      const lastPeriod = formData.periodRange[1];
      const endTime = BELL_SCHEDULE[lastPeriod]?.end || '16:00';
      return `${formData.date}T${endTime}`;
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
      
      const requestData: IgazolasCreateRequest = {
        eleje: startDateTime,
        vege: endDateTime,
        tipus: formData.tipus,
        megjegyzes_diak: formData.megjegyzes_diak || undefined,
        diak: true,
        korrigalt: false,
        imgDriveURL: formData.imgDriveURL || undefined,
      };

      await apiClient.createIgazolas(requestData);
      toast.success('Igazolás sikeresen beküldve!');
      
      // Navigate back to the igazolások list
      window.location.hash = 'igazolasok';
      router.refresh();
    } catch (error) {
      console.error('Failed to create igazolás:', error);
      toast.error('Hiba történt az igazolás beküldésekor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePeriodRangeChange = (value: number[]) => {
    updateFormData({ periodRange: value });
  };

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
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Date Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <Label htmlFor="date" className="text-lg font-medium">Dátum</Label>
          </div>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => updateFormData({ date: e.target.value })}
            required
            className="max-w-xs"
          />
        </div>

        {/* Step 2: Period Selection */}
        <Separator />
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <Label className="text-lg font-medium">Tanórák kiválasztása</Label>
          </div>
              
              <Field>
                <FieldTitle>Óraválasztó</FieldTitle>
                <FieldDescription>
                  Válaszd ki az időszakot: {" "}
                  <span className="font-medium">{BELL_SCHEDULE[formData.periodRange[0]]?.name}</span> -{" "}
                  <span className="font-medium">{BELL_SCHEDULE[formData.periodRange[1]]?.name}</span>
                  {" "}({getConsecutivePeriods().map(i => BELL_SCHEDULE[i]?.name).join(', ')})
                </FieldDescription>
                <Slider
                  value={formData.periodRange}
                  onValueChange={handlePeriodRangeChange}
                  max={BELL_SCHEDULE.length - 1}
                  min={0}
                  step={1}
                  className="mt-4 w-full"
                  aria-label="Period Range"
                />
              </Field>
              
              <TooltipProvider>
                <div className="flex flex-wrap gap-2 justify-center">
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
                            className={`inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg cursor-help transition-all duration-500 ease-in-out transform ${bgColor} ${isInRange ? glowColor : ''} hover:scale-110`}
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

        {/* Step 3: Type Selection */}
        <Separator />
        <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <Label className="text-lg font-medium">Igazolás típusa</Label>
              </div>
              <Select
                value={formData.tipus?.toString() || ''}
                onValueChange={(value) => updateFormData({ tipus: parseInt(value) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Válassz igazolás típust..." />
                </SelectTrigger>
                <SelectContent>
                  {igazolasTipusok.map((tipus) => {
                      const typeInfo = getIgazolasType(tipus.nev);
                      return (
                        <SelectItem key={tipus.id} value={tipus.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{typeInfo.emoji}</span>
                            <span>{tipus.nev}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
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
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        {selectedTipusInfo.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

        {/* Step 4: BKK Disruption Selection */}
        <Separator />
        {/* Mobile-first design for BKK Section */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xl md:text-2xl">🚇</span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-blue-900 dark:text-blue-100">
                BKK Forgalmi Információk
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Közlekedési késés igazolása
              </p>
            </div>
          </div>
          
          {/* Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 flex items-center justify-center mt-1">
                <span className="text-white text-lg md:text-xl">ℹ️</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-base md:text-lg">
                  Közlekedési késés igazolása
                </h4>
                <p className="text-sm md:text-base text-blue-800 dark:text-blue-200 mb-6 leading-relaxed">
                  Ha olyan késés vagy forgalmi zavar miatt hiányoztál vagy késtél, mely szerepel a BKK rendszerében, 
                  azt az alábbi gombra kattintva kiválaszthatod.
                </p>
                <p className="text-xs md:text-sm text-blue-700 dark:text-blue-300 mb-6 bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
                  💡 Ez egy BKK által hitelesített adat lesz, melyet az osztályfőnököd is látni fog az igazolásodban.
                </p>
                
                {!formData.bkkDisruption ? (
                  <Button
                    type="button"
                    onClick={() => setShowBKKSelector(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 md:py-3 rounded-xl transition-all duration-200 hover:shadow-lg text-base md:text-sm"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xl md:text-lg">🚇</span>
                      <span>BKK Forgalmi Információk Megnyitása</span>
                    </div>
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Selected BKK Item - Mobile Optimized */}
                    <div className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 md:p-5">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          formData.bkkDisruption.type === 'alert' 
                            ? 'bg-orange-500'
                            : getBKKColors((formData.bkkDisruption.data as ProcessedVehiclePosition).vehicleType).background
                        }`}>
                          <span className="text-white text-xl md:text-2xl">
                            {formData.bkkDisruption.type === 'alert' 
                              ? '⚠️' 
                              : getVehicleTypeEmoji((formData.bkkDisruption.data as ProcessedVehiclePosition).vehicleType)
                            }
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-blue-900 dark:text-blue-100 text-base md:text-lg mb-2">
                            {formData.bkkDisruption.type === 'alert' 
                              ? '🚨 Forgalmi Zavar Kiválasztva' 
                              : '🚍 Jármű Kiválasztva'
                            }
                          </p>
                          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                            {formData.bkkDisruption.description}
                          </p>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500 text-xs md:text-sm px-3 py-1">
                            ✅ Hivatalos BKK adat
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeBKKDisruption}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 w-10 h-10 md:w-8 md:h-8 rounded-lg flex-shrink-0"
                        >
                          <span className="sr-only">Eltávolítás</span>
                          <span className="text-lg md:text-base">✕</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Change Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBKKSelector(true)}
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950 py-3 md:py-2 rounded-xl text-base md:text-sm font-medium"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg md:text-base">🔄</span>
                        <span>Másik zavar kiválasztása</span>
                      </div>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Optional Fields */}
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
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Dátum</Label>
                    <p className="text-sm">{new Date(formData.date).toLocaleDateString('hu-HU')}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Időszak</Label>
                    <p className="text-sm">
                      {getConsecutivePeriods().map(i => BELL_SCHEDULE[i]?.name).join(', ')}
                    </p>
                  </div>
                  
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
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Az igazolás beküldése után az osztályfőnököd elbírálja azt. Értesítést kapsz az eredményről.
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