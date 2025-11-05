"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient } from "@/lib/api"
import { useRole } from "@/app/context/RoleContext"
import type { TanevRendje, Override, TanitasiSzunet, Osztaly } from "@/lib/types"
import { IconAlertCircle, IconPlus, IconEdit, IconTrash, IconSchool } from "@tabler/icons-react"
import { Clapperboard } from "lucide-react"
import { format } from "date-fns"

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

const BREAK_TYPE_EMOJIS: Record<BreakType, string> = {
  oszi: '🍂',
  teli: '❄️',
  tavaszi: '🌸',
  nyari: '☀️',
  erettsegi: '📝',
  digitalis: '💻',
  egyeb: '📅',
}

const BREAK_TYPE_COLORS: Record<BreakType, string> = {
  oszi: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300',
  teli: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300',
  tavaszi: 'bg-pink-100 dark:bg-pink-900/30 border-pink-300',
  nyari: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300',
  erettsegi: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300',
  digitalis: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300',
  egyeb: 'bg-gray-100 dark:bg-gray-900/30 border-gray-300',
}

export function AdminView() {
  const { user } = useRole()
  const [schedule, setSchedule] = useState<TanevRendje | null>(null)
  const [classes, setClasses] = useState<Osztaly[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Override dialog state
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [editingOverride, setEditingOverride] = useState<Override | null>(null)
  const [overrideForm, setOverrideForm] = useState({
    date: '',
    is_required: true,
    class_id: null as number | null,
    reason: '',
  })
  
  // School break dialog state
  const [breakDialogOpen, setBreakDialogOpen] = useState(false)
  const [editingBreak, setEditingBreak] = useState<TanitasiSzunet | null>(null)
  const [breakForm, setBreakForm] = useState({
    type: 'oszi' as BreakType,
    name: '',
    from_date: '',
    to_date: '',
    description: '',
  })
  
  // Delete confirmation dialogs
  const [deleteOverrideDialogOpen, setDeleteOverrideDialogOpen] = useState(false)
  const [overrideToDelete, setOverrideToDelete] = useState<Override | null>(null)
  const [deleteBreakDialogOpen, setDeleteBreakDialogOpen] = useState(false)
  const [breakToDelete, setBreakToDelete] = useState<TanitasiSzunet | null>(null)

  // Load data
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const now = new Date()
      const currentYear = now.getFullYear()
      const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1
      const fromDate = `${startYear}-09-01`
      const toDate = `${startYear + 1}-08-31`
      
      const [scheduleData, classesData] = await Promise.all([
        apiClient.getTanevRendje(fromDate, toDate),
        apiClient.listOsztaly()
      ])
      
      setSchedule(scheduleData)
      setClasses(classesData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.isSuperuser) {
      loadData()
    }
  }, [user])

  // FTV Sync handlers
  const handleFullFTVSync = async () => {
    if (!confirm('Teljes FTV szinkronizáció indítása? Ez eltarthat néhány percig.')) return
    
    try {
      setSyncing(true)
      await apiClient.manualFTVSync()
      alert('FTV szinkronizáció sikeresen befejeződött!')
    } catch (err) {
      console.error('FTV sync failed:', err)
      alert(err instanceof Error ? err.message : 'FTV szinkronizáció sikertelen')
    } finally {
      setSyncing(false)
    }
  }

  // Override CRUD
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
        date: '',
        is_required: true,
        class_id: null,
        reason: '',
      })
    }
    setOverrideDialogOpen(true)
  }

  const saveOverride = async () => {
    try {
      if (editingOverride) {
        // When updating, explicitly include class_id to ensure backend receives it
        await apiClient.updateGlobalOverride(editingOverride.id, {
          date: overrideForm.date,
          is_required: overrideForm.is_required,
          class_id: overrideForm.class_id,
          reason: overrideForm.reason,
        })
      } else {
        await apiClient.createGlobalOverride(overrideForm)
      }
      
      setOverrideDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error('Failed to save override:', err)
      alert(err instanceof Error ? err.message : 'Failed to save override')
    }
  }

  const confirmDeleteOverride = (override: Override) => {
    setOverrideToDelete(override)
    setDeleteOverrideDialogOpen(true)
  }

  const deleteOverride = async () => {
    if (!overrideToDelete) return
    
    try {
      await apiClient.deleteGlobalOverride(overrideToDelete.id)
      setDeleteOverrideDialogOpen(false)
      setOverrideToDelete(null)
      await loadData()
    } catch (err) {
      console.error('Failed to delete override:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete override')
    }
  }

  // School Break CRUD
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

  const saveBreak = async () => {
    try {
      if (editingBreak) {
        await apiClient.updateTanitasiSzunet(editingBreak.id, breakForm)
      } else {
        await apiClient.createTanitasiSzunet(breakForm)
      }
      
      setBreakDialogOpen(false)
      await loadData()
    } catch (err) {
      console.error('Failed to save break:', err)
      alert(err instanceof Error ? err.message : 'Failed to save break')
    }
  }

  const confirmDeleteBreak = (szunet: TanitasiSzunet) => {
    setBreakToDelete(szunet)
    setDeleteBreakDialogOpen(true)
  }

  const deleteBreak = async () => {
    if (!breakToDelete) return
    
    try {
      await apiClient.deleteTanitasiSzunet(breakToDelete.id)
      setDeleteBreakDialogOpen(false)
      setBreakToDelete(null)
      await loadData()
    } catch (err) {
      console.error('Failed to delete break:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete break')
    }
  }

  if (!user?.isSuperuser) {
    return (
      <Alert variant="destructive">
        <IconAlertCircle className="h-4 w-4" />
        <AlertDescription>Nincs jogosultságod az adminisztrációs funkciókhoz.</AlertDescription>
      </Alert>
    )
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Adminisztráció</h2>
        <p className="text-muted-foreground">
          Iskola-szintű beállítások és szinkronizáció kezelése
        </p>
      </div>

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes">Osztályok</TabsTrigger>
          <TabsTrigger value="breaks">Tanítási szünetek</TabsTrigger>
          <TabsTrigger value="overrides">Kivételek</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Osztályok</CardTitle>
                  <CardDescription>
                    Az iskola osztályainak listája és FTV szinkronizáció
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleFullFTVSync} 
                  disabled={syncing}
                  variant="default"
                  className="gap-2 bg-neutral-900/5 hover:bg-neutral-900/10 dark:bg-neutral-50/5 dark:hover:bg-neutral-50/10"
                >
                  {syncing ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Szinkronizálás...
                    </>
                  ) : (
                    <>
                      <Clapperboard className="h-4 w-4 text-blue-500 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <span className="font-bold text-blue-500 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                        FTV
                      </span>
                      <span className="font-medium text-blue-500/70 dark:text-blue-400/70">
                        Sync
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...classes].sort((a, b) => a.nev.localeCompare(b.nev, 'hu')).map((osztaly) => (
                  <div key={osztaly.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <IconSchool className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{osztaly.nev}</p>
                        <p className="text-sm text-muted-foreground">
                          {osztaly.tanulok.length} tanuló
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* School Breaks Tab */}
        <TabsContent value="breaks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tanítási szünetek</CardTitle>
                  <CardDescription>
                    Általános szünetek az összes osztályra vonatkozóan
                  </CardDescription>
                </div>
                <Button onClick={() => openBreakDialog()}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Új szünet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedule?.tanitasi_szunetek.map((szunet) => (
                  <div key={szunet.id} className={`flex items-center justify-between p-3 border rounded-lg ${BREAK_TYPE_COLORS[szunet.type]}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{BREAK_TYPE_EMOJIS[szunet.type]}</span>
                        <Badge variant="outline">{BREAK_TYPE_LABELS[szunet.type]}</Badge>
                        <p className="font-medium">{szunet.name || BREAK_TYPE_LABELS[szunet.type]}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(szunet.from_date), 'yyyy. MM. dd.')} - {format(new Date(szunet.to_date), 'yyyy. MM. dd.')}
                      </p>
                      {szunet.description && (
                        <p className="text-sm text-muted-foreground">{szunet.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openBreakDialog(szunet)}>
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => confirmDeleteBreak(szunet)}>
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {schedule?.tanitasi_szunetek.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Még nincsenek tanítási szünetek definiálva.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overrides Tab */}
        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kivételek</CardTitle>
                  <CardDescription>
                    Egyedi kivételek a tanítási rend alól
                  </CardDescription>
                </div>
                <Button onClick={() => openOverrideDialog()}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Új kivétel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {schedule?.overrides.map((override) => (
                  <div key={override.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={override.is_required ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}>
                          {override.is_required ? 'Kötelező' : 'Nem kötelező'}
                        </Badge>
                        <p className="font-medium">{format(new Date(override.date), 'yyyy. MM. dd.')}</p>
                        {override.class_name ? (
                          <Badge variant="secondary">{override.class_name}</Badge>
                        ) : (
                          <Badge variant="secondary">Minden osztály</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{override.reason}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openOverrideDialog(override)}>
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => confirmDeleteOverride(override)}>
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {schedule?.overrides.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Még nincsenek kivételek definiálva.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* School Break Dialog */}
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

      {/* Delete Override Confirmation Dialog */}
      <AlertDialog open={deleteOverrideDialogOpen} onOpenChange={setDeleteOverrideDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törölni szeretnéd ezt a kivételt?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem visszavonható. A kivétel végleg törlődik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOverrideToDelete(null)}>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={deleteOverride}>Törlés</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Break Confirmation Dialog */}
      <AlertDialog open={deleteBreakDialogOpen} onOpenChange={setDeleteBreakDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Biztosan törölni szeretnéd ezt a szünetet?</AlertDialogTitle>
            <AlertDialogDescription>
              Ez a művelet nem visszavonható. A tanítási szünet végleg törlődik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBreakToDelete(null)}>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBreak}>Törlés</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
