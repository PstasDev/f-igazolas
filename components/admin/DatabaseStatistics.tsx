"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api"
import { IconDatabase, IconRefresh, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DatabaseStats {
  total_counts: {
    users: number
    profiles: number
    classes: number
    igazolasok: number
    mulasztasok: number
    igazolas_types: number
  }
  growth_rates: {
    igazolasok_7d: number
    mulasztasok_7d: number
    users_30d: number
  }
  database_size_mb: number
  largest_tables: Array<{
    table: string
    rows: number
    size_estimate_mb: number
  }>
}

export function DatabaseStatistics() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getDatabaseStats() as unknown as DatabaseStats
      setStats(response)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Failed to fetch database statistics')
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
            <IconDatabase className="h-5 w-5" />
            Database Statistics
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
            <IconDatabase className="h-5 w-5" />
            Database Statistics
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

  const chartData = [
    { name: 'Users', count: stats.total_counts.users },
    { name: 'Classes', count: stats.total_counts.classes },
    { name: 'Igazolások', count: stats.total_counts.igazolasok },
    { name: 'Mulasztások', count: stats.total_counts.mulasztasok },
    { name: 'Types', count: stats.total_counts.igazolas_types },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <IconDatabase className="h-5 w-5" />
              Database Statistics
            </CardTitle>
            <CardDescription>Overview of database records and growth</CardDescription>
          </div>
          <Button onClick={fetchStats} variant="outline" size="sm" className="w-full sm:w-auto flex-shrink-0">
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Counts Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="text-xs sm:text-sm text-muted-foreground">Total Users</div>
              <div className="text-xl sm:text-2xl font-bold">{stats.total_counts.users.toLocaleString()}</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="text-xs sm:text-sm text-muted-foreground">Classes</div>
              <div className="text-xl sm:text-2xl font-bold">{stats.total_counts.classes.toLocaleString()}</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="text-xs sm:text-sm text-muted-foreground">Igazolások</div>
              <div className="text-xl sm:text-2xl font-bold">{stats.total_counts.igazolasok.toLocaleString()}</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="text-xs sm:text-sm text-muted-foreground">Mulasztások</div>
              <div className="text-xl sm:text-2xl font-bold">{stats.total_counts.mulasztasok.toLocaleString()}</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="text-xs sm:text-sm text-muted-foreground">Igazolás Types</div>
              <div className="text-xl sm:text-2xl font-bold">{stats.total_counts.igazolas_types.toLocaleString()}</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="text-xs sm:text-sm text-muted-foreground">Database Size</div>
              <div className="text-xl sm:text-2xl font-bold">{stats.database_size_mb.toFixed(2)} MB</div>
            </div>
          </div>

          {/* Growth Rates */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Growth Trends</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-muted-foreground">Igazolások (7 days)</div>
                  {stats.growth_rates.igazolasok_7d > 0 ? (
                    <IconTrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <IconTrendingDown className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-lg sm:text-xl font-bold">{stats.growth_rates.igazolasok_7d > 0 ? '+' : ''}{stats.growth_rates.igazolasok_7d}</div>
              </div>
              <div className="p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-muted-foreground">Mulasztások (7 days)</div>
                  {stats.growth_rates.mulasztasok_7d > 0 ? (
                    <IconTrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <IconTrendingDown className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-lg sm:text-xl font-bold">{stats.growth_rates.mulasztasok_7d > 0 ? '+' : ''}{stats.growth_rates.mulasztasok_7d}</div>
              </div>
              <div className="p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-muted-foreground">New Users (30 days)</div>
                  {stats.growth_rates.users_30d > 0 ? (
                    <IconTrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <IconTrendingDown className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-lg sm:text-xl font-bold">{stats.growth_rates.users_30d > 0 ? '+' : ''}{stats.growth_rates.users_30d}</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Record Distribution</h3>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Largest Tables */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Largest Tables</h3>
            <div className="space-y-2">
              {stats.largest_tables.map((table) => (
                <div key={table.table} className="flex flex-col xs:flex-row xs:items-center justify-between p-3 border rounded-lg gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{table.table}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{table.rows.toLocaleString()} rows</div>
                  </div>
                  <div className="text-sm font-semibold flex-shrink-0">{table.size_estimate_mb.toFixed(2)} MB</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
