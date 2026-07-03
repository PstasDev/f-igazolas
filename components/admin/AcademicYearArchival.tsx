"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface ArchivableClass {
  id: number
  nev: string
  tagozat: string
  kezdes_eve: number
  osztalyfonokok: { id: number; username: string; first_name: string; last_name: string }[]
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
  const [archivableClasses, setArchivableClasses] = useState<ArchivableClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [archiveTeacher, setArchiveTeacher] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedYearData, setSelectedYearData] = useState<ArchivedYearData | null>(null)
  const [loadingYearData, setLoadingYearData] = useState(false)

  useEffect(() => {
    loadArchivedYears()
  }, [])

  const loadArchivableClasses = async () => {
    try {
      const data = await apiClient['fetchWithAuth']<ArchivableClass[]>('/api/admin/classes/archivable')
      setArchivableClasses(data)
    } catch (err) {
      console.error('Failed to load archivable classes:', err)
      toast.error('Nem sikerült betölteni az osztályokat')
    }
  }

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
    if (!selectedClassId) {
      toast.error('Kérlek válassz egy osztályt')
      return
    }

    const selectedClass = archivableClasses.find(c => c.id === parseInt(selectedClassId))
    const className = selectedClass?.nev ?? selectedClassId

    try {
      setArchiving(true)
      const params = new URLSearchParams({ archive_teacher: String(archiveTeacher) })
      await apiClient['fetchWithAuth'](`/api/admin/classes/${selectedClassId}/archive?${params}`, {
        method: 'POST',
      })
      toast.success(`${className} osztály sikeresen archiválva`)
      setArchiveDialogOpen(false)
      setSelectedClassId('')
      setArchiveTeacher(false)
      loadArchivedYears()
    } catch (err) {
      console.error('Failed to archive class:', err)
      toast.error('Nem sikerült archiválni az osztályt')
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
            <Button onClick={() => { setArchiveDialogOpen(true); loadArchivableClasses() }}>
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
      <Dialog open={archiveDialogOpen} onOpenChange={(open) => {
        setArchiveDialogOpen(open)
        if (!open) { setSelectedClassId(''); setArchiveTeacher(false) }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Osztály archiválása</DialogTitle>
            <DialogDescription>
              Válaszd ki a kimenő osztályt. A tanulók fiókjai megmaradnak és be tudnak lépni,
              de mulasztásaik és igazolásaik nem jelennek meg semmilyen statisztikában.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Osztály</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz osztályt..." />
                </SelectTrigger>
                <SelectContent>
                  {archivableClasses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nev}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClassId && (() => {
              const cls = archivableClasses.find(c => c.id === parseInt(selectedClassId))
              if (!cls || cls.osztalyfonokok.length === 0) return null
              const teacherNames = cls.osztalyfonokok
                .map(t => `${t.last_name} ${t.first_name}`.trim() || t.username)
                .join(', ')
              return (
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="archive-teacher"
                    checked={archiveTeacher}
                    onCheckedChange={(v) => setArchiveTeacher(!!v)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="archive-teacher" className="font-normal leading-snug">
                    Az osztályfőnököt is archiváljam
                    <span className="block text-xs text-muted-foreground mt-0.5">{teacherNames}</span>
                  </Label>
                </div>
              )
            })()}

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
            <Button onClick={handleArchive} disabled={archiving || !selectedClassId}>
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
