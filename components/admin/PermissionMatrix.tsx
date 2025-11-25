"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { IconGrid3x3, IconRefresh, IconAlertCircle, IconCheck, IconX, IconDownload } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface ClassInfo {
  id: number
  name: string
  tagozat: string
  kezdes_eve: number
}

interface IgazolasTipusInfo {
  id: number
  nev: string
  leiras: string
  beleszamit: boolean
  iskolaerdeku: boolean
}

interface PermissionMatrixData {
  classes: ClassInfo[]
  types: IgazolasTipusInfo[]
  matrix: Record<number, Record<number, boolean>>
}

export function PermissionMatrix() {
  const [data, setData] = useState<PermissionMatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingChanges, setPendingChanges] = useState<Array<{ class_id: number; type_id: number; allowed: boolean }>>([])
  const [saving, setSaving] = useState(false)

  const fetchMatrix = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.getPermissionMatrix() as unknown as PermissionMatrixData
      setData(response)
      setPendingChanges([])
    } catch (err: unknown) {
      console.error('Permission matrix fetch error:', err)
      const error = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(error.response?.data?.detail || error.message || 'Failed to fetch permission matrix')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (classId: number, typeId: number) => {
    if (!data) return

    const currentAllowed = data.matrix[classId]?.[typeId] ?? true
    const newAllowed = !currentAllowed

    // Update local state immediately for responsiveness
    setData({
      ...data,
      matrix: {
        ...data.matrix,
        [classId]: {
          ...data.matrix[classId],
          [typeId]: newAllowed
        }
      }
    })

    // Track pending change
    setPendingChanges(prev => {
      const existing = prev.findIndex(c => c.class_id === classId && c.type_id === typeId)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { class_id: classId, type_id: typeId, allowed: newAllowed }
        return updated
      }
      return [...prev, { class_id: classId, type_id: typeId, allowed: newAllowed }]
    })
  }

  const savePendingChanges = async () => {
    if (pendingChanges.length === 0) return

    setSaving(true)
    setError(null)
    try {
      await apiClient.bulkUpdatePermissions({ updates: pendingChanges })
      setPendingChanges([])
      await fetchMatrix()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const exportToCSV = () => {
    if (!data) return

    const headers = ['Class', ...data.types.map(t => t.nev)]
    const rows = data.classes.map(cls => {
      const row = [cls.name]
      data.types.forEach(type => {
        const allowed = data.matrix[cls.id]?.[type.id] ?? true
        row.push(allowed ? 'Allowed' : 'Blocked')
      })
      return row
    })

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `permission-matrix-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchMatrix()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconGrid3x3 className="h-5 w-5" />
            Permission Matrix
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
            <IconGrid3x3 className="h-5 w-5" />
            Permission Matrix
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

  if (!data) return null

  // Filter classes and types based on search
  const filteredClasses = data.classes.filter(cls => 
    (cls.name || cls.nev || `${cls.kezdes_eve}${cls.tagozat}`).toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredTypes = data.types.filter(type =>
    type.nev.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate summary stats
  const totalPermissions = data.classes.length * data.types.length
  const blockedCount = data.classes.reduce((sum, cls) => {
    return sum + data.types.reduce((typeSum, type) => {
      const allowed = data.matrix[cls.id]?.[type.id] ?? true
      return typeSum + (allowed ? 0 : 1)
    }, 0)
  }, 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <IconGrid3x3 className="h-5 w-5" />
              Igazolás Type Permission Matrix
            </CardTitle>
            <CardDescription>
              Manage which classes can submit which igazolás types
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            <Button onClick={fetchMatrix} variant="outline" size="sm">
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <IconDownload className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {pendingChanges.length > 0 && (
              <Button onClick={savePendingChanges} disabled={saving} size="sm">
                {saving && <Spinner className="mr-2" />}
                Save {pendingChanges.length} Change{pendingChanges.length > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="text-xs sm:text-sm text-muted-foreground">Total Classes</div>
              <div className="text-xl sm:text-2xl font-bold">{data.classes.length}</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="text-xs sm:text-sm text-muted-foreground">Total Types</div>
              <div className="text-xl sm:text-2xl font-bold">{data.types.length}</div>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <div className="text-xs sm:text-sm text-muted-foreground">Blocked Permissions</div>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {blockedCount} / {totalPermissions}
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search classes or types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            {searchTerm && (
              <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")}>
                Clear
              </Button>
            )}
          </div>

          {/* Pending Changes Alert */}
          {pendingChanges.length > 0 && (
            <Alert>
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have {pendingChanges.length} unsaved change{pendingChanges.length > 1 ? 's' : ''}. 
                Click &ldquo;Save&rdquo; to apply them.
              </AlertDescription>
            </Alert>
          )}

          {/* Matrix Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-3 font-medium sticky left-0 bg-muted z-20 border-r min-w-[120px]">
                      <span>Class / Type</span>
                    </th>
                    {filteredTypes.map(type => (
                      <th key={type.id} className="text-center p-2 font-medium min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold">{type.nev}</span>
                          {type.iskolaerdeku && (
                            <Badge variant="secondary" className="text-xs">Iskolaérdekű</Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredClasses.map(cls => (
                    <tr key={cls.id} className="hover:bg-muted/50">
                      <td className="p-3 font-medium sticky left-0 bg-background border-r">
                        <span>{cls.name || cls.nev || `${cls.kezdes_eve}${cls.tagozat}`}</span>
                      </td>
                      {filteredTypes.map(type => {
                        const allowed = data.matrix[cls.id]?.[type.id] ?? true
                        const hasPendingChange = pendingChanges.some(
                          c => c.class_id === cls.id && c.type_id === type.id
                        )
                        
                        return (
                          <td key={type.id} className="p-0 text-center">
                            <button
                              onClick={() => togglePermission(cls.id, type.id)}
                              className={cn(
                                "w-full h-full p-4 transition-colors relative",
                                allowed 
                                  ? "bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50" 
                                  : "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                              )}
                              title={allowed ? 'Click to block' : 'Click to allow'}
                            >
                              {allowed ? (
                                <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                              ) : (
                                <IconX className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto" />
                              )}
                              {hasPendingChange && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-muted-foreground">Allowed (Class can use this type)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <IconX className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-muted-foreground">Blocked (Class cannot use this type)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-muted-foreground">Unsaved change</span>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>
              Click any cell to toggle permission. Green = allowed, Red = blocked. 
              Changes are saved in bulk when you click &ldquo;Save&rdquo;.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
