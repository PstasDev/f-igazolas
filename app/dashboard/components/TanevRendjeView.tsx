"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { apiClient } from "@/lib/api"
import { getAttendanceReason } from "@/lib/attendance-utils"
import { useRole } from "@/app/context/RoleContext"
import type { TanevRendje, Override, TanitasiSzunet, Osztaly } from "@/lib/types"
import { IconPlus, IconEdit, IconTrash, IconAlertCircle, IconCalendar, IconCheck, IconX } from "@tabler/icons-react"
import { format } from "date-fns"
import { hu } from "date-fns/locale"

type BreakType = 'oszi' | 'teli' | 'tavaszi' | 'nyari' | 'erettsegi' | 'digitalis' | 'egyeb';

const BREAK_TYPE_LABELS: Record<BreakType, string> = {
  oszi: 'Őszi szünet',
  teli: 'Téli szünet',
  tavaszi: 'Tavaszi szünet',
  nyari: 'Nyári szünet',
  erettsegi: 'Érettségi időszak',
  digitalis: 'Digitális oktatás',
  egyeb: 'Egyéb',
}

export function TanevRendjeView() {
  const { user } = useRole()
  const [schedule, setSchedule] = useState<TanevRendje | null>(null)
  const [classes, setClasses] = useState<Osztaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  
  // Override dialog state
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [editingOverride, setEditingOverride] = useState<Override | null>(null)
  const [overrideForm, setOverrideForm] = useState({
    date: '',
    is_required: true,
    class_id: null as number | null,
    reason: '',
  })
  
  // School break dialog state (superuser only)
  const [breakDialogOpen, setBreakDialogOpen] = useState(false)
  const [editingBreak, setEditingBreak] = useState<TanitasiSzunet | null>(null)
  const [breakForm, setBreakForm] = useState({
    type: 'oszi' as BreakType,
    name: '',
    from_date: '',
    to_date: '',
    description: '',
  })

  const isSuperuser = user?.isSuperuser || false
  const isTeacher = user?.role === 'teacher'
  const canManageOverrides = isSuperuser || isTeacher

  // Load schedule data
  const loadSchedule = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current school year range
      const now = new Date()
      const currentYear = now.getFullYear()
      const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1 // September = month 8
      const fromDate = `${startYear}-09-01`
      const toDate = `${startYear + 1}-08-31`
      
      const data = await apiClient.getTanevRendje(fromDate, toDate)
      setSchedule(data)
      
      // Load classes if superuser
      if (isSuperuser) {
        const classesData = await apiClient.listOsztaly()
        setClasses(classesData)
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadSchedule()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Get events for selected date
  const getEventsForDate = (date: Date): Array<{ type: 'break' | 'override', data: TanitasiSzunet | Override }> => {
    if (!schedule) return []
    
    const dateStr = format(date, 'yyyy-MM-dd')
    const events: Array<{ type: 'break' | 'override', data: TanitasiSzunet | Override }> = []
    
    // Check breaks
    schedule.tanitasi_szunetek.forEach(szunet => {
      if (dateStr >= szunet.from_date && dateStr <= szunet.to_date) {
        events.push({ type: 'break', data: szunet })
      }
    })
    
    // Check overrides
    schedule.overrides.forEach(override => {
      if (override.date === dateStr) {
        // Show all global overrides and class-specific ones for teacher's class
        if (!override.class_id || override.class_id === user?.profile?.osztalyom?.id) {
          events.push({ type: 'override', data: override })
        }
      }
    })
    
    return events
  }

  // Open override dialog for new or edit
  const openOverrideDialog = (override?: Override) => {
    if (override) {
      setEditingOverride(override)
      setOverrideForm({
        date: override.date,
        is_required: override.is_required,
        class_id: override.class_id,
        reason: override.reason || '',
      })
    } else {
      setEditingOverride(null)
      setOverrideForm({
        date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        is_required: true,
        class_id: isSuperuser ? null : user?.profile?.osztalyom?.id || null,
        reason: '',
      })
    }
    setOverrideDialogOpen(true)
  }

  // Save override
  const saveOverride = async () => {
    try {
      if (editingOverride) {
        // Update existing
        if (isSuperuser) {
          await apiClient.updateGlobalOverride(editingOverride.id, overrideForm)
        } else {
          await apiClient.updateClassOverride(editingOverride.id, overrideForm)
        }
      } else {
        // Create new
        if (isSuperuser) {
          await apiClient.createGlobalOverride(overrideForm)
        } else {
          await apiClient.createClassOverride(overrideForm)
        }
      }
      
      setOverrideDialogOpen(false)
      await loadSchedule()
    } catch (err) {
      console.error('Failed to save override:', err)
      alert(err instanceof Error ? err.message : 'Failed to save override')
    }
  }

  // Delete override
  const deleteOverride = async (override: Override) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a kivételt?')) return
    
    try {
      if (isSuperuser) {
        await apiClient.deleteGlobalOverride(override.id)
      } else {
        await apiClient.deleteClassOverride(override.id)
      }
      await loadSchedule()
    } catch (err) {
      console.error('Failed to delete override:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete override')
    }
  }

  // Open break dialog for new or edit
  const openBreakDialog = (szunet?: TanitasiSzunet) => {
    if (szunet) {
      setEditingBreak(szunet)
      setBreakForm({
        type: szunet.type,
        name: szunet.name || '',
        from_date: szunet.from_date,
        to_date: szunet.to_date,
        description: szunet.description || '',
      })
    } else {
      setEditingBreak(null)
      setBreakForm({
        type: 'oszi',
        name: '',
        from_date: '',
        to_date: '',
        description: '',
      })
    }
    setBreakDialogOpen(true)
  }

  // Save school break
  const saveBreak = async () => {
    try {
      if (editingBreak) {
        await apiClient.updateTanitasiSzunet(editingBreak.id, breakForm)
      } else {
        await apiClient.createTanitasiSzunet(breakForm)
      }
      
      setBreakDialogOpen(false)
      await loadSchedule()
    } catch (err) {
      console.error('Failed to save break:', err)
      alert(err instanceof Error ? err.message : 'Failed to save break')
    }
  }

  // Delete school break
  const deleteBreak = async (szunet: TanitasiSzunet) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a szünetet?')) return
    
    try {
      await apiClient.deleteTanitasiSzunet(szunet.id)
      await loadSchedule()
    } catch (err) {
      console.error('Failed to delete break:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete break')
    }
  }

  // Custom day content for calendar
  const modifiers = schedule ? {
    break: schedule.tanitasi_szunetek.flatMap(szunet => {
      const start = new Date(szunet.from_date)
      const end = new Date(szunet.to_date)
      const dates = []
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d))
      }
      return dates
    }),
    override: schedule.overrides.map(o => new Date(o.date)),
  } : {}

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <IconAlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const events = selectedDate ? getEventsForDate(selectedDate) : []
  const attendanceInfo = selectedDate && schedule ? getAttendanceReason(
    format(selectedDate, 'yyyy-MM-dd'),
    user?.profile?.osztalyom,
    schedule
  ) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tanév rendje</h2>
          <p className="text-muted-foreground">
            A tanév során érvényes szünetek és kivételek
          </p>
        </div>
        
        {isSuperuser && (
          <div className="flex gap-2">
            <Button onClick={() => openBreakDialog()}>
              <IconPlus className="mr-2 h-4 w-4" />
              Szünet hozzáadása
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_400px]">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Naptár</CardTitle>
            <CardDescription>
              Válassz egy dátumot a részletek megtekintéséhez
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              modifiers={modifiers}
              modifiersClassNames={{
                break: 'bg-blue-100 dark:bg-blue-900/30',
                override: 'bg-amber-100 dark:bg-amber-900/30',
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Selected date details */}
        <div className="space-y-4">
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="h-5 w-5" />
                  {format(selectedDate, 'yyyy. MMMM d.', { locale: hu })}
                </CardTitle>
                {attendanceInfo && (
                  <CardDescription className="flex items-center gap-2">
                    {attendanceInfo.required ? (
                      <IconCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <IconX className="h-4 w-4 text-red-600" />
                    )}
                    {attendanceInfo.reason}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nincs különleges esemény ezen a napon.
                  </p>
                )}

                {events.map((event, idx) => (
                  <div key={idx} className="space-y-2">
                    {event.type === 'break' ? (
                      <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-900/10">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30">
                              {BREAK_TYPE_LABELS[(event.data as TanitasiSzunet).type]}
                            </Badge>
                            <p className="font-medium">
                              {(event.data as TanitasiSzunet).name || BREAK_TYPE_LABELS[(event.data as TanitasiSzunet).type]}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date((event.data as TanitasiSzunet).from_date), 'yyyy. MM. dd.')} - {format(new Date((event.data as TanitasiSzunet).to_date), 'yyyy. MM. dd.')}
                            </p>
                            {(event.data as TanitasiSzunet).description && (
                              <p className="text-sm">{(event.data as TanitasiSzunet).description}</p>
                            )}
                          </div>
                          {isSuperuser && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openBreakDialog(event.data as TanitasiSzunet)}
                              >
                                <IconEdit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteBreak(event.data as TanitasiSzunet)}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-900/10">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30">
                              {(event.data as Override).is_required ? 'Tanítási nap' : 'Szünnap'}
                            </Badge>
                            {(event.data as Override).class_name && (
                              <p className="text-sm font-medium">{(event.data as Override).class_name}</p>
                            )}
                            {!(event.data as Override).class_id && (
                              <p className="text-sm font-medium text-blue-600">Minden osztály</p>
                            )}
                            <p className="text-sm">{(event.data as Override).reason}</p>
                          </div>
                          {canManageOverrides && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openOverrideDialog(event.data as Override)}
                              >
                                <IconEdit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteOverride(event.data as Override)}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {canManageOverrides && (
                  <Button
                    onClick={() => openOverrideDialog()}
                    variant="outline"
                    className="w-full"
                  >
                    <IconPlus className="mr-2 h-4 w-4" />
                    Kivétel hozzáadása
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOverride ? 'Kivétel szerkesztése' : 'Új kivétel'}
            </DialogTitle>
            <DialogDescription>
              Kivétel létrehozása az alapértelmezett tanítási rend alól
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="override-date">Dátum</Label>
              <Input
                id="override-date"
                type="date"
                value={overrideForm.date}
                onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="override-required"
                checked={overrideForm.is_required}
                onCheckedChange={(checked) => setOverrideForm({ ...overrideForm, is_required: checked })}
              />
              <Label htmlFor="override-required">
                Jelenléti kötelezettség {overrideForm.is_required ? '(Kötelező)' : '(Nem kötelező)'}
              </Label>
            </div>

            {isSuperuser && (
              <div className="space-y-2">
                <Label htmlFor="override-class">Osztály</Label>
                <Select
                  value={overrideForm.class_id?.toString() || 'all'}
                  onValueChange={(value) => setOverrideForm({ ...overrideForm, class_id: value === 'all' ? null : parseInt(value) })}
                >
                  <SelectTrigger id="override-class">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Minden osztály</SelectItem>
                    {classes.map((osztaly) => (
                      <SelectItem key={osztaly.id} value={osztaly.id.toString()}>
                        {osztaly.nev}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="override-reason">Indoklás</Label>
              <Textarea
                id="override-reason"
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                placeholder="Miért van szükség erre a kivételre?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Mégse
            </Button>
            <Button onClick={saveOverride}>
              Mentés
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* School Break Dialog (Superuser only) */}
      {isSuperuser && (
        <Dialog open={breakDialogOpen} onOpenChange={setBreakDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBreak ? 'Szünet szerkesztése' : 'Új szünet'}
              </DialogTitle>
              <DialogDescription>
                Tanítási szünet létrehozása vagy módosítása
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="break-type">Típus</Label>
                <Select
                  value={breakForm.type}
                  onValueChange={(value) => setBreakForm({ ...breakForm, type: value as BreakType })}
                >
                  <SelectTrigger id="break-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BREAK_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="break-name">Név (opcionális)</Label>
                <Input
                  id="break-name"
                  value={breakForm.name}
                  onChange={(e) => setBreakForm({ ...breakForm, name: e.target.value })}
                  placeholder="pl. Téli szünet 2024/2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="break-from">Kezdő dátum</Label>
                  <Input
                    id="break-from"
                    type="date"
                    value={breakForm.from_date}
                    onChange={(e) => setBreakForm({ ...breakForm, from_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="break-to">Záró dátum</Label>
                  <Input
                    id="break-to"
                    type="date"
                    value={breakForm.to_date}
                    onChange={(e) => setBreakForm({ ...breakForm, to_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="break-description">Leírás (opcionális)</Label>
                <Textarea
                  id="break-description"
                  value={breakForm.description}
                  onChange={(e) => setBreakForm({ ...breakForm, description: e.target.value })}
                  placeholder="További információk a szünetről..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBreakDialogOpen(false)}>
                Mégse
              </Button>
              <Button onClick={saveBreak}>
                Mentés
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
