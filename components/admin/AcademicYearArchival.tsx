"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiClient } from "@/lib/api"
import { IconArchive, IconAlertCircle, IconEye, IconDownload, IconCalendar } from "@tabler/icons-react"
import { toast } from "sonner"

interface ArchivedYear {
  academic_year: string
  archive_date: string
  total_users: number
  total_classes: number
  total_igazolasok: number
}

interface ArchivedYearData {
  academic_year: string
  users: unknown[]
  classes: unknown[]
  igazolasok: unknown[]
  statistics: {
    total_users: number
    total_classes: number
    total_igazolasok: number
    total_students: number
    total_teachers: number
  }
}

export function AcademicYearArchival() {
  const [archivedYears, setArchivedYears] = useState<ArchivedYear[]>([])
  const [loading, setLoading] = useState(true)
  const [archiving, setArchiving] = useState(false)
  const [academicYear, setAcademicYear] = useState('')
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedYearData, setSelectedYearData] = useState<ArchivedYearData | null>(null)
  const [loadingYearData, setLoadingYearData] = useState(false)

  useEffect(() => {
    loadArchivedYears()
    
    // Set default academic year (current or previous)
    const now = new Date()
    const currentYear = now.getFullYear()
    const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1
    setAcademicYear(`${startYear}/${startYear + 1}`)
  }, [])

  const loadArchivedYears = async () => {
    try {
      setLoading(true)
      const data = await apiClient['fetchWithAuth']<ArchivedYear[]>('/api/admin/academic-year/archived')
      setArchivedYears(data)
    } catch (err) {
      console.error('Failed to load archived years:', err)
      toast.error('Nem sikerült betölteni az archivált éveket')
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!academicYear) {
      toast.error('Kérlek add meg a tanévet')
      return
    }

    if (!confirm(
      `Biztosan archiválni szeretnéd a(z) ${academicYear} tanévet?\n\n` +
      'Ez a művelet az alábbi adatokat archiválja:\n' +
      '- Összes felhasználó\n' +
      '- Összes osztály\n' +
      '- Összes igazolás\n\n' +
      'Az archivált adatok később megtekinthetők, de nem módosíthatók.'
    )) {
      return
    }

    try {
      setArchiving(true)
      await apiClient['fetchWithAuth']('/api/admin/academic-year/archive', {
        method: 'POST',
        body: JSON.stringify({ academic_year: academicYear })
      })
      toast.success(`${academicYear} tanév sikeresen archiválva`)
      setArchiveDialogOpen(false)
      loadArchivedYears()
    } catch (err) {
      console.error('Failed to archive academic year:', err)
      toast.error('Nem sikerült archiválni a tanévet')
    } finally {
      setArchiving(false)
    }
  }

  const handleViewYear = async (year: string) => {
    try {
      setLoadingYearData(true)
      setViewDialogOpen(true)
      const data = await apiClient['fetchWithAuth']<ArchivedYearData>(
        `/api/admin/academic-year/${encodeURIComponent(year)}/data`
      )
      setSelectedYearData(data)
    } catch (err) {
      console.error('Failed to load year data:', err)
      toast.error('Nem sikerült betölteni az év adatait')
      setViewDialogOpen(false)
    } finally {
      setLoadingYearData(false)
    }
  }

  const handleExportYear = async (year: string) => {
    try {
      const data = await apiClient['fetchWithAuth']<ArchivedYearData>(
        `/api/admin/academic-year/${encodeURIComponent(year)}/data`
      )
      
      // Create JSON file and download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `archived_${year.replace('/', '-')}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('Adatok exportálva')
    } catch (err) {
      console.error('Failed to export year data:', err)
      toast.error('Nem sikerült exportálni az adatokat')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <IconArchive className="h-4 w-4" />
        <AlertDescription>
          A tanév archiválása lehetővé teszi a múltbeli tanévek adatainak megőrzését és későbbi megtekintését.
          Az archivált adatok nem módosíthatók és nem törölhetők.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <IconArchive className="h-5 w-5" />
              Tanév archiválása
            </span>
            <Button onClick={() => setArchiveDialogOpen(true)}>
              <IconArchive className="h-4 w-4 mr-2" />
              Új archiválás
            </Button>
          </CardTitle>
          <CardDescription>
            Archivált tanévek listája és kezelése
          </CardDescription>
        </CardHeader>
        <CardContent>
          {archivedYears.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconArchive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Még nincsenek archivált tanévek</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanév</TableHead>
                  <TableHead>Archiválás dátuma</TableHead>
                  <TableHead className="text-right">Felhasználók</TableHead>
                  <TableHead className="text-right">Osztályok</TableHead>
                  <TableHead className="text-right">Igazolások</TableHead>
                  <TableHead className="text-right">Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedYears.map((year) => (
                  <TableRow key={year.academic_year}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{year.academic_year}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(year.archive_date).toLocaleDateString('hu-HU')}
                    </TableCell>
                    <TableCell className="text-right">{year.total_users}</TableCell>
                    <TableCell className="text-right">{year.total_classes}</TableCell>
                    <TableCell className="text-right">{year.total_igazolasok}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewYear(year.academic_year)}
                        >
                          <IconEye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportYear(year.academic_year)}
                        >
                          <IconDownload className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tanév archiválása</DialogTitle>
            <DialogDescription>
              Add meg a tanévet, amelyet archiválni szeretnél (pl. 2023/2024)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="academic-year">Tanév</Label>
              <Input
                id="academic-year"
                placeholder="2023/2024"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>

            <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950/20">
              <IconAlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Figyelmeztetés:</strong> Ez a művelet visszavonhatatlan!
                Az archivált adatok később csak megtekinthetők, de nem módosíthatók.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              Mégse
            </Button>
            <Button onClick={handleArchive} disabled={archiving || !academicYear}>
              {archiving ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Archiválás...
                </>
              ) : (
                <>
                  <IconArchive className="h-4 w-4 mr-2" />
                  Archiválás
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Year Data Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconCalendar className="h-5 w-5" />
              {selectedYearData?.academic_year} tanév adatai
            </DialogTitle>
            <DialogDescription>
              Archivált adatok megtekintése
            </DialogDescription>
          </DialogHeader>
          
          {loadingYearData ? (
            <div className="flex items-center justify-center p-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : selectedYearData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Összesen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedYearData.statistics.total_users}</p>
                    <p className="text-xs text-muted-foreground">felhasználó</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tanulók</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedYearData.statistics.total_students}</p>
                    <p className="text-xs text-muted-foreground">tanuló</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tanárok</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedYearData.statistics.total_teachers}</p>
                    <p className="text-xs text-muted-foreground">tanár</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Osztályok</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedYearData.statistics.total_classes}</p>
                    <p className="text-xs text-muted-foreground">osztály</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Igazolások</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedYearData.statistics.total_igazolasok}</p>
                    <p className="text-xs text-muted-foreground">igazolás</p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A részletes adatok megtekintéséhez exportáld az adatokat JSON formátumban.
                </AlertDescription>
              </Alert>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Bezárás
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
