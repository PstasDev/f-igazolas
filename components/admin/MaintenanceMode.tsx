"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { apiClient } from "@/lib/api"
import { IconTool, IconRefresh, IconAlertCircle } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"

interface MaintenanceStatus {
  is_enabled: boolean
  message: string
  enabled_at: string | null
  enabled_by: string | null
}

export function MaintenanceMode() {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getMaintenanceStatus() as MaintenanceStatus
      setStatus(response)
      setMessage(response.message || "")
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Failed to fetch maintenance status')
    } finally {
      setLoading(false)
    }
  }

  const toggleMaintenance = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await apiClient.toggleMaintenanceMode({ message }) as MaintenanceStatus
      setStatus(response)
      setMessage(response.message || "")
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Failed to toggle maintenance mode')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTool className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <IconTool className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>Enable maintenance mode to prevent user access during updates</CardDescription>
        </div>
        <Button onClick={fetchStatus} variant="outline" size="sm">
          <IconRefresh className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Status */}
        {status && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div>
                <div className="font-semibold">Current Status</div>
                <div className="text-sm text-muted-foreground">
                  {status.is_enabled ? 'Maintenance mode is active' : 'System is operational'}
                </div>
              </div>
            </div>
            <Badge variant={status.is_enabled ? "destructive" : "default"} className="text-sm px-3 py-1">
              {status.is_enabled ? "MAINTENANCE" : "OPERATIONAL"}
            </Badge>
          </div>
        )}

        {/* Enabled Info */}
        {status?.is_enabled && status.enabled_at && (
          <div className="p-4 border rounded-lg border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <div className="flex items-start gap-2">
              <IconAlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800 dark:text-yellow-200">Maintenance Mode Active</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Enabled {new Date(status.enabled_at).toLocaleString()}
                  {status.enabled_by && ` by ${status.enabled_by}`}
                </div>
                {status.message && (
                  <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 italic">
                    &ldquo;{status.message}&rdquo;
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="message">Maintenance Message</Label>
          <Textarea
            id="message"
            placeholder="Enter a message to display to users (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            This message will be displayed to users when maintenance mode is active.
          </p>
        </div>

        {/* Toggle Button */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">
              {status?.is_enabled ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
            </div>
            <div className="text-sm text-muted-foreground">
              {status?.is_enabled 
                ? 'Allow users to access the system' 
                : 'Prevent users from accessing the system'}
            </div>
          </div>
          <Button
            onClick={toggleMaintenance}
            disabled={saving}
            variant={status?.is_enabled ? "default" : "destructive"}
            size="lg"
          >
            {saving && <Spinner className="mr-2" />}
            {status?.is_enabled ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {/* Warning */}
        {!status?.is_enabled && (
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Enabling maintenance mode will prevent all non-superuser users from accessing the system.
              Make sure to communicate this to users beforehand.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
