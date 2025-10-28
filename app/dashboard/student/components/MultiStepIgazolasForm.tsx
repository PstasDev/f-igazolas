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
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, FileText, Upload } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { IgazolasTipus, IgazolasCreateRequest } from '@/lib/types';
import { getIgazolasType } from '../../types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface FormData {
  eleje: string;
  vege: string;
  tipus: number | null;
  megjegyzes_diak: string;
  diak_extra_ido_elotte: number;
  diak_extra_ido_utana: number;
  imgDriveURL: string;
}

const INITIAL_FORM_DATA: FormData = {
  eleje: '',
  vege: '',
  tipus: null,
  megjegyzes_diak: '',
  diak_extra_ido_elotte: 0,
  diak_extra_ido_utana: 0,
  imgDriveURL: '',
};

const STEPS = [
  { id: 1, title: 'Időpont', description: 'Válaszd ki az igazolás időpontját', icon: Calendar },
  { id: 2, title: 'Típus', description: 'Válaszd ki az igazolás típusát', icon: FileText },
  { id: 3, title: 'Részletek', description: 'Add meg a további részleteket', icon: Clock },
  { id: 4, title: 'Feltöltés', description: 'Tölts fel dokumentumot (opcionális)', icon: Upload },
  { id: 5, title: 'Ellenőrzés', description: 'Ellenőrizd az adatokat', icon: Check },
];

export function MultiStepIgazolasForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [igazolasTipusok, setIgazolasTipusok] = useState<IgazolasTipus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.eleje !== '' && formData.vege !== '';
      case 2:
        return formData.tipus !== null;
      case 3:
        return true; // Optional fields
      case 4:
        return true; // Optional file upload
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  const canProceed = isStepValid(currentStep);

  const handleNext = () => {
    if (canProceed && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.tipus) {
      toast.error('Kérlek válassz igazolás típust');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const requestData: IgazolasCreateRequest = {
        eleje: formData.eleje,
        vege: formData.vege,
        tipus: formData.tipus,
        megjegyzes_diak: formData.megjegyzes_diak || undefined,
        diak: true,
        korrigalt: false,
        diak_extra_ido_elotte: formData.diak_extra_ido_elotte || undefined,
        diak_extra_ido_utana: formData.diak_extra_ido_utana || undefined,
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

  const selectedTipus = formData.tipus ? igazolasTipusok.find(t => t.id === formData.tipus) : null;
  const selectedTipusInfo = selectedTipus ? getIgazolasType(selectedTipus.nev) : null;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Új igazolás beküldése</CardTitle>
        <CardDescription>
          Kövesd a lépéseket az igazolás beküldéséhez
        </CardDescription>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-between mt-6">
          {STEPS.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isValid = isStepValid(step.id);
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                      ? isValid
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 transition-colors ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-center mt-4">
          <h3 className="text-lg font-semibold">{STEPS[currentStep - 1].title}</h3>
          <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Időpont */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eleje">Kezdés időpontja</Label>
                <Input
                  id="eleje"
                  type="datetime-local"
                  value={formData.eleje}
                  onChange={(e) => updateFormData({ eleje: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vege">Befejezés időpontja</Label>
                <Input
                  id="vege"
                  type="datetime-local"
                  value={formData.vege}
                  onChange={(e) => updateFormData({ vege: e.target.value })}
                  required
                />
              </div>
            </div>
            
            {formData.eleje && formData.vege && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Időtartam:</strong> {new Date(formData.eleje).toLocaleString('hu-HU')} - {new Date(formData.vege).toLocaleString('hu-HU')}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Körülbelül {Math.round((new Date(formData.vege).getTime() - new Date(formData.eleje).getTime()) / (1000 * 60))} perc
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Típus */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipus">Igazolás típusa</Label>
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
            </div>
            
            {selectedTipusInfo && (
              <div className="space-y-3">
                <div className={`p-4 rounded-md border ${selectedTipusInfo.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{selectedTipusInfo.emoji}</span>
                    <h4 className="font-medium">{selectedTipusInfo.name}</h4>
                  </div>
                  <p className="text-sm mb-3">{selectedTipusInfo.description}</p>
                  <div className="flex gap-2">
                    <Badge variant={selectedTipusInfo.iskolaerdeku ? 'default' : 'secondary'}>
                      {selectedTipusInfo.iskolaerdeku ? 'Iskolaérdekű' : 'Egyéni'}
                    </Badge>
                    <Badge variant={selectedTipusInfo.beleszamit ? 'destructive' : 'default'}>
                      {selectedTipusInfo.beleszamit ? 'Beleszámít a hiányzásba' : 'Nem számít hiányzásnak'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Részletek */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="megjegyzes">Megjegyzés (opcionális)</Label>
              <Textarea
                id="megjegyzes"
                placeholder="Add meg a részleteket, körülményeket..."
                value={formData.megjegyzes_diak}
                onChange={(e) => updateFormData({ megjegyzes_diak: e.target.value })}
                rows={4}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium">Extra idő beállítások</h4>
              <p className="text-sm text-muted-foreground">
                Ha szükséges, megadhatsz extra időt az igazolás előtt és után (percekben).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="elotte">Extra idő előtte (perc)</Label>
                  <Input
                    id="elotte"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.diak_extra_ido_elotte}
                    onChange={(e) => updateFormData({ diak_extra_ido_elotte: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utana">Extra idő utána (perc)</Label>
                  <Input
                    id="utana"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.diak_extra_ido_utana}
                    onChange={(e) => updateFormData({ diak_extra_ido_utana: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Feltöltés */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Dokumentum URL (opcionális)</Label>
              <Input
                id="file"
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={formData.imgDriveURL}
                onChange={(e) => updateFormData({ imgDriveURL: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Google Drive vagy más online storage linkjét add meg a támogató dokumentumhoz.
              </p>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <h4 className="font-medium text-amber-800 mb-2">💡 Tipp:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Orvosi igazolásnál töltsd fel az orvosi dokumentumot</li>
                <li>• Családi eseményeknél a meghívót vagy egyéb igazoló dokumentumot</li>
                <li>• Győződj meg róla, hogy a link nyilvánosan elérhető</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 5: Ellenőrzés */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-lg space-y-4">
              <h4 className="font-medium text-lg">Igazolás összefoglalása</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Időpont</Label>
                  <p className="text-sm">
                    {new Date(formData.eleje).toLocaleString('hu-HU')} - {new Date(formData.vege).toLocaleString('hu-HU')}
                  </p>
                </div>
                
                {selectedTipus && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Típus</Label>
                    <div className="flex items-center gap-2">
                      <span>{selectedTipusInfo?.emoji}</span>
                      <span className="text-sm">{selectedTipus.nev}</span>
                    </div>
                  </div>
                )}
                
                {formData.megjegyzes_diak && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-600">Megjegyzés</Label>
                    <p className="text-sm">{formData.megjegyzes_diak}</p>
                  </div>
                )}
                
                {(formData.diak_extra_ido_elotte > 0 || formData.diak_extra_ido_utana > 0) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Extra idő</Label>
                    <p className="text-sm">
                      {formData.diak_extra_ido_elotte > 0 && `${formData.diak_extra_ido_elotte} perc előtte`}
                      {formData.diak_extra_ido_elotte > 0 && formData.diak_extra_ido_utana > 0 && ', '}
                      {formData.diak_extra_ido_utana > 0 && `${formData.diak_extra_ido_utana} perc utána`}
                    </p>
                  </div>
                )}
                
                {formData.imgDriveURL && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Dokumentum</Label>
                    <a 
                      href={formData.imgDriveURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Támogató dokumentum megtekintése
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                Az igazolás beküldése után az osztályfőnököd elbírálja azt. Értesítést kapsz az eredményről.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Előző
          </Button>
          
          <div className="flex gap-2">
            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
              >
                Következő
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}