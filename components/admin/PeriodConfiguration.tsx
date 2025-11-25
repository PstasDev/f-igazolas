"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { apiClient } from "@/lib/api"
import { IconClock, IconCheck, IconX, IconInfoCircle } from "@tabler/icons-react"
import { toast } from "sonner"

interface PeriodConfig {
  enabled_periods: number[]
}

interface PeriodUsageAnalysis {
  total_igazolasok: number
  period_usage: Record<number, number>
  most_common_periods: number[]
  unused_periods: number[]
}

interface PeriodConfigurationProps {
  classId?: number
  className?: string
  onClose?: () => void
}

export function PeriodConfiguration({ classId, className, onClose }: PeriodConfigurationProps) {
  const [config, setConfig] = useState<PeriodConfig | null>(null)
  const [analysis, setAnalysis] = useState<PeriodUsageAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const ALL_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  const loadData = useCallback(async () => {
    if (!classId) return
    
    try {
      setLoading(true)
      const [configData, analysisData] = await Promise.all([
        apiClient['fetchWithAuth']<PeriodConfig>(`/api/classes/${classId}/period-config`),
        apiClient['fetchWithAuth']<PeriodUsageAnalysis>(`/api/classes/${classId}/period-usage-analysis`)
      ])
      
      setConfig(configData)
      setAnalysis(analysisData)
    } catch (err) {
      console.error('Failed to load period configuration:', err)
      toast.error('Nem sikerült betölteni az óra-beállításokat')
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTogglePeriod = (period: number) => {
    if (!config) return
    
    const enabledPeriods = config.enabled_periods || ALL_PERIODS
    const newEnabledPeriods = enabledPeriods.includes(period)
      ? enabledPeriods.filter(p => p !== period)
      : [...enabledPeriods, period].sort((a, b) => a - b)
    
    setConfig({ enabled_periods: newEnabledPeriods })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!classId || !config) return
    
    try {
      setSaving(true)
      await apiClient['fetchWithAuth'](`/api/classes/${classId}/period-config`, {
        method: 'PUT',
        body: JSON.stringify(config)
      })
      toast.success('Óra-beállítások sikeresen mentve')
      setHasChanges(false)
      if (onClose) onClose()
    } catch (err) {
      console.error('Failed to save period configuration:', err)
      toast.error('Nem sikerült menteni az óra-beállításokat')
    } finally {
      setSaving(false)
    }
  }

  const handleEnableAll = () => {
    setConfig({ enabled_periods: ALL_PERIODS })
    setHasChanges(true)
  }

  const handleDisableAll = () => {
    setConfig({ enabled_periods: [] })
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!config) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Nem sikerült betölteni az óra-beállításokat</AlertDescription>
      </Alert>
    )
  }

  const enabledPeriods = config.enabled_periods || ALL_PERIODS
  const enabledCount = enabledPeriods.length

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <IconClock className="h-5 w-5" />
          Órák konfigurálása
          {className && <Badge variant="outline">{className}</Badge>}
        </h3>
        <p className="text-sm text-muted-foreground">
          Kiválaszthatod, mely tanórák állnak rendelkezésre a(z) {className || 'osztály'} számára az igazolások létrehozásakor.
        </p>
      </div>

      {analysis && analysis.total_igazolasok > 0 && (
        <Alert>
          <IconInfoCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Használati statisztika:</strong> Eddig {analysis.total_igazolasok} igazolás lett létrehozva.
            {analysis.most_common_periods.length > 0 && (
              <> A leggyakrabban használt órák: {analysis.most_common_periods.join(', ')}.</>
            )}
            {analysis.unused_periods.length > 0 && (
              <> Soha nem használt órák: {analysis.unused_periods.join(', ')}.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Engedélyezett órák ({enabledCount}/{ALL_PERIODS.length})
          </CardTitle>
          <CardDescription>
            Kapcsold be/ki az egyes tanórákat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleEnableAll}
            >
              <IconCheck className="h-4 w-4 mr-1" />
              Összes engedélyezése
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDisableAll}
            >
              <IconX className="h-4 w-4 mr-1" />
              Összes tiltása
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {ALL_PERIODS.map((period) => {
              const isEnabled = enabledPeriods.includes(period)
              const usageCount = analysis?.period_usage[period] || 0
              
              return (
                <div
                  key={period}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isEnabled 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                      : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <Label 
                    htmlFor={`period-${period}`} 
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <span className="font-semibold">{period}. óra</span>
                    {usageCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {usageCount}×
                      </Badge>
                    )}
                  </Label>
                  <Switch
                    id={`period-${period}`}
                    checked={isEnabled}
                    onCheckedChange={() => handleTogglePeriod(period)}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Mégse
          </Button>
        )}
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              Mentés...
            </>
          ) : (
            <>
              <IconCheck className="h-4 w-4 mr-2" />
              Mentés
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
