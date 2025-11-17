"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api"
import { IconFileDatabase, IconRefresh, IconPhoto, IconFileText } from "@tabler/icons-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

interface StorageStats {
  total_storage_mb: number
  breakdown: {
    images_mb: number
    bkk_data_mb: number
    database_mb: number
  }
  largest_files: Array<{
    igazolas_id: number
    student_name: string
    file_size_mb: number
    date: string
  }>
  storage_trend_30d: Array<{
    date: string
    total_mb: number
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function StorageUsageMonitoring() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getStorageStats() as unknown as StorageStats
      setStats(response)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Failed to fetch storage statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileDatabase className="h-5 w-5" />
            Storage Usage Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileDatabase className="h-5 w-5" />
            Storage Usage Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  const pieData = [
    { name: 'Images', value: stats.breakdown.images_mb },
    { name: 'BKK Data', value: stats.breakdown.bkk_data_mb },
    { name: 'Database', value: stats.breakdown.database_mb },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconFileDatabase className="h-5 w-5" />
              Storage Usage Monitoring
            </CardTitle>
            <CardDescription>Track storage usage and trends</CardDescription>
          </div>
          <Button onClick={fetchStats} variant="outline" size="sm">
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Storage */}
          <div className="p-6 border rounded-lg bg-muted/50">
            <div className="text-sm text-muted-foreground mb-1">Total Storage Used</div>
            <div className="text-4xl font-bold">{stats.total_storage_mb.toFixed(2)} MB</div>
            <div className="text-sm text-muted-foreground mt-1">
              ≈ {(stats.total_storage_mb / 1024).toFixed(2)} GB
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <IconPhoto className="h-4 w-4 text-blue-500" />
                <div className="text-sm text-muted-foreground">Images</div>
              </div>
              <div className="text-2xl font-bold">{stats.breakdown.images_mb.toFixed(2)} MB</div>
              <div className="text-xs text-muted-foreground mt-1">
                {((stats.breakdown.images_mb / stats.total_storage_mb) * 100).toFixed(1)}% of total
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <IconFileText className="h-4 w-4 text-green-500" />
                <div className="text-sm text-muted-foreground">BKK Data</div>
              </div>
              <div className="text-2xl font-bold">{stats.breakdown.bkk_data_mb.toFixed(2)} MB</div>
              <div className="text-xs text-muted-foreground mt-1">
                {((stats.breakdown.bkk_data_mb / stats.total_storage_mb) * 100).toFixed(1)}% of total
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <IconFileDatabase className="h-4 w-4 text-yellow-500" />
                <div className="text-sm text-muted-foreground">Database</div>
              </div>
              <div className="text-2xl font-bold">{stats.breakdown.database_mb.toFixed(2)} MB</div>
              <div className="text-xs text-muted-foreground mt-1">
                {((stats.breakdown.database_mb / stats.total_storage_mb) * 100).toFixed(1)}% of total
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Storage Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} MB`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 30-Day Trend */}
          {stats.storage_trend_30d && stats.storage_trend_30d.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">30-Day Storage Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.storage_trend_30d}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)} MB`} />
                  <Legend />
                  <Line type="monotone" dataKey="total_mb" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Largest Files */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Largest Files</h3>
            <div className="space-y-2">
              {stats.largest_files.map((file) => (
                <div key={file.igazolas_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{file.student_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Igazolás #{file.igazolas_id} • {file.date}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{file.file_size_mb.toFixed(2)} MB</div>
                </div>
              ))}
              {stats.largest_files.length === 0 && (
                <div className="text-center text-muted-foreground py-4">No files found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
