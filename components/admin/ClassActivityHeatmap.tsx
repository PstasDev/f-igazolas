"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar } from "lucide-react"
import { apiClient } from "@/lib/api"
import { format, subDays } from "date-fns"
import { hu } from "date-fns/locale"

interface HeatmapData {
  dates: string[]
  classes: Array<{
    id: number
    name: string
    data: Array<{
      date: string
      value: number
      intensity: number
    }>
  }>
}

const INTENSITY_COLORS = [
  'bg-gray-100 dark:bg-gray-800',
  'bg-green-100 dark:bg-green-900/30',
  'bg-green-200 dark:bg-green-800/40',
  'bg-green-300 dark:bg-green-700/50',
  'bg-green-400 dark:bg-green-600/60',
  'bg-green-500 dark:bg-green-500/70',
]

export function ClassActivityHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metricType, setMetricType] = useState<'submissions' | 'approvals' | 'logins'>('submissions')
  const [dateRange, setDateRange] = useState<number>(30) // days
  const [hoveredCell, setHoveredCell] = useState<{ classId: number; date: string; value: number } | null>(null)

  const loadHeatmap = async () => {
    try {
      setLoading(true)
      setError(null)

      const toDate = format(new Date(), 'yyyy-MM-dd')
      const fromDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd')

      const response = await apiClient.getClassActivityHeatmap(fromDate, toDate, metricType)
      setData(response)
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba a heatmap betöltése közben")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHeatmap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricType, dateRange])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return null
  }

  const metricLabels = {
    submissions: 'Beadások',
    approvals: 'Elfogadások',
    logins: 'Bejelentkezések',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Osztály aktivitás heatmap
            </CardTitle>
            <CardDescription>
              GitHub-stílusú vizualizáció az osztályok aktivitásáról
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={metricType} onValueChange={(v) => setMetricType(v as 'submissions' | 'approvals' | 'logins')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submissions">Beadások</SelectItem>
                <SelectItem value="approvals">Elfogadások</SelectItem>
                <SelectItem value="logins">Bejelentkezések</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 nap</SelectItem>
                <SelectItem value="14">14 nap</SelectItem>
                <SelectItem value="30">30 nap</SelectItem>
                <SelectItem value="60">60 nap</SelectItem>
                <SelectItem value="90">90 nap</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadHeatmap} variant="outline" size="sm">
              Frissítés
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Kevesebb</span>
            <div className="flex gap-1">
              {INTENSITY_COLORS.map((color, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm ${color} border`} />
              ))}
            </div>
            <span className="text-muted-foreground">Több</span>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {data.classes.map((classData) => (
                <div key={classData.id} className="mb-6">
                  <h3 className="text-sm font-medium mb-2">{classData.name}</h3>
                  <div className="flex gap-1 flex-wrap">
                    {classData.data.map((point) => (
                      <div
                        key={point.date}
                        className={`w-3 h-3 rounded-sm ${INTENSITY_COLORS[point.intensity]} border cursor-pointer transition-transform hover:scale-150 hover:z-10 relative`}
                        onMouseEnter={() => setHoveredCell({ classId: classData.id, date: point.date, value: point.value })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${format(new Date(point.date), 'yyyy. MM. dd.', { locale: hu })}\n${metricLabels[metricType]}: ${point.value}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          {hoveredCell && (
            <div className="p-3 bg-popover border rounded-lg shadow-lg text-sm">
              <p className="font-medium">{format(new Date(hoveredCell.date), 'yyyy. MM. dd.', { locale: hu })}</p>
              <p className="text-muted-foreground">{metricLabels[metricType]}: {hoveredCell.value}</p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Osztályok</p>
              <p className="text-2xl font-bold">{data.classes.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Napok</p>
              <p className="text-2xl font-bold">{data.dates.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Összes aktivitás</p>
              <p className="text-2xl font-bold">
                {data.classes.reduce((sum, c) => sum + c.data.reduce((s, d) => s + d.value, 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
