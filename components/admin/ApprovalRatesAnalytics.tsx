"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { apiClient } from "@/lib/api"
import { format, subDays } from "date-fns"
import { hu } from "date-fns/locale"

interface ApprovalRatesData {
  overall_rate: number
  by_teacher: Array<{
    teacher_id: number
    teacher_name: string
    total: number
    approved: number
    rejected: number
    approval_rate: number
  }>
  by_type: Array<{
    type_id: number
    type_name: string
    total: number
    approved: number
    rejected: number
    approval_rate: number
  }>
  by_class: Array<{
    class_id: number
    class_name: string
    total: number
    approved: number
    rejected: number
    approval_rate: number
  }>
  trend: Array<{
    date: string
    approval_rate: number
    total: number
  }>
}

export function ApprovalRatesAnalytics() {
  const [data, setData] = useState<ApprovalRatesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<number>(30)

  const loadApprovalRates = async () => {
    try {
      setLoading(true)
      setError(null)

      const toDate = format(new Date(), 'yyyy-MM-dd')
      const fromDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd')

      const response = await apiClient.getApprovalRates(fromDate, toDate, 'all')
      setData(response)
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string }
      setError(error.detail || error.message || "Hiba az elemzés betöltése közben")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApprovalRates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange])

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

  const getRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-500'
    if (rate >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getRateIcon = (rate: number) => {
    if (rate >= 80) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (rate >= 60) return <Minus className="h-4 w-4 text-yellow-500" />
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Elfogadási ráta elemzés</CardTitle>
              <CardDescription>
                Igazolások elfogadási arányai különböző szempontok szerint
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
              <Button onClick={loadApprovalRates} variant="outline" size="sm">
                Frissítés
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Overall Rate */}
          <div className="mb-6 p-6 border rounded-lg bg-accent/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Általános elfogadási ráta</p>
              <div className="flex items-center justify-center gap-2">
                {getRateIcon(data.overall_rate)}
                <p className={`text-5xl font-bold ${getRateColor(data.overall_rate)}`}>
                  {data.overall_rate.toFixed(1)}%
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Az elmúlt {dateRange} napból
              </p>
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="teacher" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="teacher">Tanárok szerint</TabsTrigger>
              <TabsTrigger value="type">Típus szerint</TabsTrigger>
              <TabsTrigger value="class">Osztályok szerint</TabsTrigger>
            </TabsList>

            {/* By Teacher */}
            <TabsContent value="teacher" className="space-y-2">
              {data.by_teacher.map((teacher) => (
                <div key={teacher.teacher_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition">
                  <div className="flex-1">
                    <p className="font-medium">{teacher.teacher_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {teacher.total} igazolás • {teacher.approved} elfogadva • {teacher.rejected} elutasítva
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRateIcon(teacher.approval_rate)}
                    <span className={`text-2xl font-bold ${getRateColor(teacher.approval_rate)}`}>
                      {teacher.approval_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {data.by_teacher.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nincs adat</p>
              )}
            </TabsContent>

            {/* By Type */}
            <TabsContent value="type" className="space-y-2">
              {data.by_type.map((type) => (
                <div key={type.type_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition">
                  <div className="flex-1">
                    <p className="font-medium">{type.type_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {type.total} beadás • {type.approved} elfogadva • {type.rejected} elutasítva
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRateIcon(type.approval_rate)}
                    <span className={`text-2xl font-bold ${getRateColor(type.approval_rate)}`}>
                      {type.approval_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {data.by_type.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nincs adat</p>
              )}
            </TabsContent>

            {/* By Class */}
            <TabsContent value="class" className="space-y-2">
              {data.by_class.map((cls) => (
                <div key={cls.class_id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition">
                  <div className="flex-1">
                    <p className="font-medium">{cls.class_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cls.total} igazolás • {cls.approved} elfogadva • {cls.rejected} elutasítva
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRateIcon(cls.approval_rate)}
                    <span className={`text-2xl font-bold ${getRateColor(cls.approval_rate)}`}>
                      {cls.approval_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {data.by_class.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nincs adat</p>
              )}
            </TabsContent>
          </Tabs>

          {/* Trend Chart (simplified) */}
          {data.trend.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium mb-4">Trend az idő során</h3>
              <div className="space-y-1">
                {data.trend.slice(-10).map((point) => (
                  <div key={point.date} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-24">
                      {format(new Date(point.date), 'MM. dd.', { locale: hu })}
                    </span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          point.approval_rate >= 80 ? 'bg-green-500' :
                          point.approval_rate >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${point.approval_rate}%` }}
                      />
                    </div>
                    <span className={`font-medium w-16 text-right ${getRateColor(point.approval_rate)}`}>
                      {point.approval_rate.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground w-12 text-right text-xs">
                      ({point.total})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
