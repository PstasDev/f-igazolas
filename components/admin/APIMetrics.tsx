"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { IconApi, IconRefresh, IconAlertCircle, IconClock, IconActivity } from "@tabler/icons-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface APIEndpoint {
  path: string
  method: string
  avg_response_ms: number
  request_count: number
  error_count: number
  p95_response_ms?: number
}

interface APIMetricsData {
  endpoints: APIEndpoint[]
  slowest_endpoints?: APIEndpoint[]
  most_used?: APIEndpoint[]
}

export function APIMetrics() {
  const [metrics, setMetrics] = useState<APIMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getAPIMetrics() as unknown as APIMetricsData
      setMetrics(response)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Failed to fetch API metrics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)
    try {
      await apiClient.refreshAPIMetrics()
      // After refresh, fetch the updated metrics
      await fetchMetrics()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Failed to refresh API metrics')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconApi className="h-5 w-5" />
            API Performance Metrics
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
            <IconApi className="h-5 w-5" />
            API Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!metrics || !metrics.endpoints || metrics.endpoints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconApi className="h-5 w-5" />
            API Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No API metrics available yet.</p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing && <Spinner className="mr-2" />}
              Collect Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Prepare data for charts
  const topEndpointsByRequests = [...metrics.endpoints]
    .sort((a, b) => b.request_count - a.request_count)
    .slice(0, 10)
    .map(e => ({
      name: `${e.method} ${e.path.split('/').pop() || e.path}`,
      count: e.request_count,
    }))

  const slowestEndpoints = [...metrics.endpoints]
    .sort((a, b) => b.avg_response_ms - a.avg_response_ms)
    .slice(0, 10)
    .map(e => ({
      name: `${e.method} ${e.path.split('/').pop() || e.path}`,
      ms: Math.round(e.avg_response_ms),
    }))

  // Calculate overall stats
  const totalRequests = metrics.endpoints.reduce((sum, e) => sum + e.request_count, 0)
  const totalErrors = metrics.endpoints.reduce((sum, e) => sum + e.error_count, 0)
  const avgResponseTime = metrics.endpoints.reduce((sum, e) => sum + e.avg_response_ms, 0) / metrics.endpoints.length
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <IconApi className="h-5 w-5" />
              API Performance Metrics
            </CardTitle>
            <CardDescription>Monitor endpoint performance, response times, and error rates</CardDescription>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button onClick={fetchMetrics} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleRefresh} disabled={refreshing} size="sm" className="flex-1 sm:flex-none">
              {refreshing && <Spinner className="mr-2" />}
              <IconActivity className="h-4 w-4 mr-2" />
              Collect New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Requests</div>
                <IconActivity className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Errors</div>
                <IconAlertCircle className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold">{totalErrors.toLocaleString()}</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs sm:text-sm text-muted-foreground">Avg Response Time</div>
                <IconClock className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold">{Math.round(avgResponseTime)} ms</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs sm:text-sm text-muted-foreground">Error Rate</div>
                <IconAlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold">{errorRate.toFixed(2)}%</div>
            </div>
          </div>

          {/* Most Used Endpoints Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Most Used Endpoints (Top 10)</h3>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topEndpointsByRequests} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Slowest Endpoints Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Slowest Endpoints (Top 10)</h3>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={slowestEndpoints} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="ms" fill="#ef4444" name="Avg Response (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Endpoint Details Table */}
          <div>
            <h3 className="text-sm font-semibold mb-3">All Endpoints ({metrics.endpoints.length})</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Method</th>
                    <th className="text-left p-3 font-medium">Endpoint</th>
                    <th className="text-right p-3 font-medium">Requests</th>
                    <th className="text-right p-3 font-medium">Errors</th>
                    <th className="text-right p-3 font-medium">Avg (ms)</th>
                    <th className="text-right p-3 font-medium">P95 (ms)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {metrics.endpoints.map((endpoint, idx) => (
                    <tr key={idx} className="hover:bg-muted/50">
                      <td className="p-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {endpoint.method}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-xs truncate max-w-[200px] sm:max-w-none">
                        {endpoint.path}
                      </td>
                      <td className="p-3 text-right font-medium">{endpoint.request_count.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        {endpoint.error_count > 0 ? (
                          <span className="text-red-600 font-medium">{endpoint.error_count}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {Math.round(endpoint.avg_response_ms)}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {endpoint.p95_response_ms ? Math.round(endpoint.p95_response_ms) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Click &ldquo;Collect New&rdquo; to trigger performance tests and gather fresh metrics. 
              This operation may take a few moments as it runs automated tests against the API.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
