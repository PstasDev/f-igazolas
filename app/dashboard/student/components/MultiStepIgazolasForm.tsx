"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CalendarIcon, 
  Upload, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  FileText,
  User,
  Send,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { IgazolasTipus } from "@/lib/types"
import { useRouter } from "next/navigation"

interface IgazolasFormData {
  // Step 1: Basic Info
  selectedTipus: string
  
  // Step 2: Dates
  startDateTime: string
  endDateTime: string
  
  // Step 3: Details
  megjegyzesDiak: string
  imageURL: string
}

const steps = [
  {
    id: 1,
    title: "Alapadatok",
    description: "Hiányzás típusa és oka",
    icon: FileText,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: 2,
    title: "Időpont",
    description: "Hiányzás időtartama",
    icon: Clock,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: 3,
    title: "Részletek",
    description: "További információk",
    icon: User,
    color: "from-orange-500 to-red-500"
  },
  {
    id: 4,
    title: "Ellenőrzés",
    description: "Végső áttekintés",
    icon: CheckCircle,
    color: "from-green-500 to-emerald-500"
  }
]

const reasonTypes = [
  { value: "beteg", label: "Betegség", emoji: "🤒" },
  { value: "orvosi", label: "Orvosi vizsgálat", emoji: "🏥" },
  { value: "csaladi", label: "Családi ok", emoji: "👨‍👩‍👧‍👦" },
  { value: "hatosagi", label: "Hatósági ügy", emoji: "🏛️" },
  { value: "versenyzos", label: "Versenyzői tevékenység", emoji: "🏆" },
  { value: "egyeb", label: "Egyéb", emoji: "📝" },
]

interface MultiStepIgazolasFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MultiStepIgazolasForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<IgazolasFormData>({
    selectedTipus: "",
    startDateTime: "",
    endDateTime: "",
    megjegyzesDiak: "",
    imageURL: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validateStep = (step: number): boolean => {
    const errors: string[] = []
    
    switch (step) {
      case 1:
        if (!formData.selectedTipus) errors.push("Válassza ki a hiányzás típusát")
        break
      case 2:
        if (!formData.startDateTime) errors.push("Válassza ki a kezdő dátumot")
        if (!formData.endDateTime) errors.push("Válassza ki a befejező dátumot")
        if (formData.startDateTime && formData.endDateTime && formData.startDateTime >= formData.endDateTime) {
          errors.push("A befejező dátum későbbi kell legyen a kezdőnél")
        }
        break
      case 3:
        // Optional step, no validation needed
        break
      case 4:
        // Review step, all previous validations apply
        break
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return
    
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Igazolás sikeresen beküldve! 🎉")
      
      // Reset form
      setFormData({
        type: "",
        reason: "",
        startDate: undefined,
        endDate: undefined,
        description: "",
        attachment: null,
        isUrgent: false,
      })
      setCurrentStep(1)
    } catch {
      toast.error("Hiba történt az igazolás beküldésekor!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("A fájl mérete nem lehet nagyobb 5MB-nál!")
        return
      }
      setFormData(prev => ({ ...prev, attachment: file }))
      toast.success("Fájl sikeresen feltöltve!")
    }
  }

  const removeFile = () => {
    setFormData(prev => ({ ...prev, attachment: null }))
  }

  const getSelectedReasonType = () => {
    return reasonTypes.find(type => type.value === formData.type)
  }

  const progressPercentage = (currentStep / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Új Igazolás Beküldése
          </h1>
          <Badge variant="outline" className="text-sm">
            {currentStep} / {steps.length}
          </Badge>
        </div>
        
        <Progress value={progressPercentage} className="h-2 mb-6" />
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            const Icon = step.icon
            
            return (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={cn(
                    "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    isActive && "border-blue-500 shadow-lg shadow-blue-500/25",
                    isCompleted && "border-green-500 bg-green-500",
                    !isActive && !isCompleted && "border-gray-300"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className={cn(
                      "w-6 h-6",
                      isActive ? "text-blue-500" : "text-gray-400"
                    )} />
                  )}
                  
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                
                <div className="ml-3 hidden sm:block">
                  <p className={cn(
                    "text-sm font-medium",
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={cn(
                    "hidden sm:block w-20 h-0.5 ml-6",
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card className="relative overflow-hidden">
        <div className={cn(
          "absolute top-0 left-0 h-1 bg-gradient-to-r transition-all duration-500",
          steps[currentStep - 1]?.color
        )} style={{ width: `${progressPercentage}%` }} />
        
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <motion.div
              key={currentStep}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "p-2 rounded-lg bg-gradient-to-r",
                steps[currentStep - 1]?.color
              )}
            >
              {React.createElement(steps[currentStep - 1]?.icon, { 
                className: "w-5 h-5 text-white" 
              })}
            </motion.div>
            {steps[currentStep - 1]?.title}
          </CardTitle>
          <CardDescription>
            {steps[currentStep - 1]?.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="type">Hiányzás típusa *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Válassza ki a hiányzás típusát" />
                      </SelectTrigger>
                      <SelectContent>
                        {reasonTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.emoji}</span>
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Hiányzás oka *</Label>
                    <Input
                      id="reason"
                      placeholder="Pl.: influenza, fogorvos, stb."
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      className="h-12"
                    />
                  </div>

                  {formData.type && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-2 text-blue-700">
                        <span className="text-2xl">{getSelectedReasonType()?.emoji}</span>
                        <span className="font-medium">{getSelectedReasonType()?.label}</span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        Kiválasztott hiányzás típus
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 2: Dates */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Hiányzás kezdete *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12",
                              !formData.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.startDate ? (
                              format(formData.startDate, "PPP", { locale: hu })
                            ) : (
                              <span>Válasszon dátumot</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.startDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Hiányzás vége *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12",
                              !formData.endDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.endDate ? (
                              format(formData.endDate, "PPP", { locale: hu })
                            ) : (
                              <span>Válasszon dátumot</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.endDate}
                            onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                            initialFocus
                            disabled={(date) => formData.startDate ? date < formData.startDate : false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                    >
                      <div className="flex items-center gap-2 text-purple-700">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">
                          Hiányzás időtartama: {
                            Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 3600 * 24))
                          } nap
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 3: Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="description">Részletes leírás (opcionális)</Label>
                    <Textarea
                      id="description"
                      placeholder="További információk a hiányzásról..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Melléklet (opcionális)</Label>
                    {formData.attachment ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Upload className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-green-800">{formData.attachment.name}</p>
                            <p className="text-sm text-green-600">
                              {(formData.attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="relative">
                        <input
                          id="file-upload"
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                        />
                        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm font-medium text-gray-600">
                            Kattintson a fájl feltöltéséhez
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, JPG, PNG (Max. 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">Alapadatok</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Típus:</span> {getSelectedReasonType()?.emoji} {getSelectedReasonType()?.label}</p>
                        <p><span className="font-medium">Ok:</span> {formData.reason}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">Időpont</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Kezdet:</span> {formData.startDate ? format(formData.startDate, "PPP", { locale: hu }) : '-'}</p>
                        <p><span className="font-medium">Vége:</span> {formData.endDate ? format(formData.endDate, "PPP", { locale: hu }) : '-'}</p>
                        {formData.startDate && formData.endDate && (
                          <p><span className="font-medium">Időtartam:</span> {
                            Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 3600 * 24))
                          } nap</p>
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">Részletek</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Leírás:</span> {formData.description || 'Nincs megadva'}</p>
                        <p><span className="font-medium">Melléklet:</span> {formData.attachment ? formData.attachment.name : 'Nincs'}</p>
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-blue-900">Kész a beküldésre!</h3>
                        <p className="text-sm text-blue-700">Ellenőrizze az adatokat, majd küldje be az igazolást.</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <h4 className="font-medium text-red-800 mb-2">Hibaüzenetek:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Előző
            </Button>

            {currentStep < steps.length ? (
              <Button
                onClick={nextStep}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Következő
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isSubmitting ? (
                  <>Beküldés...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Igazolás beküldése
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}