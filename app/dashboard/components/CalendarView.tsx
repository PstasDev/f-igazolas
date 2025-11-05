"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { isAttendanceRequired } from "@/lib/attendance-utils"
import { useRole } from "@/app/context/RoleContext"
import { useFTVSync } from "@/hooks/use-ftv-sync"
import { FTVSyncStatus } from "@/components/ui/ftv-sync-status"
import type { TanevRendje, Override, Osztaly } from "@/lib/types"
import { IconAlertCircle, IconChevronLeft, IconChevronRight, IconFileText, IconPlus, IconTrash, IconEdit, IconChevronDown } from "@tabler/icons-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths, parseISO } from "date-fns"
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

interface IgazolasStats {
  [date: string]: {
    approved: number
    denied: number
    pending: number
  }
}

export function CalendarView() {
  const { user } = useRole()
  const [schedule, setSchedule] = useState<TanevRendje | null>(null)
  const [classes, setClasses] = useState<Osztaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isFtvRegistered, setIsFtvRegistered] = useState<boolean | null>(null)
  
  // Override dialog state
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [editingOverride, setEditingOverride] = useState<Override | null>(null)
  const [overrideForm, setOverrideForm] = useState({
    date: '',
    is_required: true,
    class_id: null as number | null,
    reason: '',
  })
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [overrideToDelete, setOverrideToDelete] = useState<number | null>(null)
  
  // Guide collapsed state
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  const isTeacher = user?.role === 'teacher'
  const isSuperuser = user?.isSuperuser || false
  const canManageOverrides = isTeacher || isSuperuser

  // Use FTV sync hook for igazolások
  const {
    data: allIgazolasok,
    isSyncing,
    metadata,
    syncNow,
  } = useFTVSync({
    fetchFunction: (mode) => isTeacher ? apiClient.listIgazolas(mode) : apiClient.getMyIgazolas(mode),
    autoSync: isTeacher ? true : (isFtvRegistered ?? false), // Teachers always auto-sync, students only if FTV registered
    checkFtvRegistration: !isTeacher, // Only check registration for students
    syncType: isTeacher ? 'class' : 'user', // Teachers use class-level sync, students use user-level sync
  })

  // Check FTV registration
  useEffect(() => {
    const checkFtvRegistration = async () => {
      try {
        const profile = await apiClient.getMyProfile()
        setIsFtvRegistered(profile.ftv_registered ?? false)
      } catch (error) {
        console.error('Failed to check FTV registration:', error)
        setIsFtvRegistered(false)
      }
    }

    if (user) {
      checkFtvRegistration()
    }
  }, [user])

  // Load schedule and classes data
  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get current school year range
      const now = new Date()
      const currentYear = now.getFullYear()
      const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1
      const fromDate = `${startYear}-09-01`
      const toDate = `${startYear + 1}-08-31`
      
      const promises: Promise<unknown>[] = [
        apiClient.getTanevRendje(fromDate, toDate)
      ]
      
      // Load classes if superuser
      if (isSuperuser) {
        promises.push(apiClient.listOsztaly())
      }
      
      const results = await Promise.all(promises)
      
      setSchedule(results[0] as TanevRendje)
      if (isSuperuser && results[1]) {
        setClasses(results[1] as Osztaly[])
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Calculate igazolások stats per date
  // Filters out igazolások that fall entirely on non-attendance days when FTV sync is active
  const igazolasStats = useMemo<IgazolasStats>(() => {
    const stats: IgazolasStats = {}
    
    // Filter igazolások - exclude those that fall entirely on non-attendance days
    const filteredIgazolasok = allIgazolasok.filter(ig => {
      // If no schedule loaded, include all
      if (!schedule) return true
      
      // Check if igazolás has at least one attendance-required day
      const start = new Date(ig.eleje)
      const end = new Date(ig.vege)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd')
        const studentClass = user?.profile?.osztalyom || null
        
        if (isAttendanceRequired(dateStr, studentClass, schedule)) {
          return true // Has at least one attendance-required day, keep it
        }
      }
      
      return false // All days are non-attendance days, filter it out
    })
    
    filteredIgazolasok.forEach(ig => {
      // Iterate through the date range of the igazolás
      const start = new Date(ig.eleje)
      const end = new Date(ig.vege)
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd')
        
        // Only count stats for attendance-required days
        if (schedule) {
          const studentClass = user?.profile?.osztalyom || null
          if (!isAttendanceRequired(dateStr, studentClass, schedule)) {
            continue // Skip non-attendance days
          }
        }
        
        if (!stats[dateStr]) {
          stats[dateStr] = { approved: 0, denied: 0, pending: 0 }
        }
        
        if (ig.allapot === 'Elfogadva') {
          stats[dateStr].approved++
        } else if (ig.allapot === 'Elutasítva') {
          stats[dateStr].denied++
        } else {
          stats[dateStr].pending++
        }
      }
    })
    
    return stats
  }, [allIgazolasok, schedule, user])

  // Get calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Navigate month
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => {
    setCurrentMonth(new Date())
    setSelectedDate(new Date())
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  // Navigate to Igazolások with date filter
  const viewIgazolasokForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    // Store date filters in session storage for the data-table's "Keresés és szűrők" card
    sessionStorage.setItem('datatable_date_from', dateStr)
    sessionStorage.setItem('datatable_date_to', dateStr)
    sessionStorage.setItem('datatable_expand_search', 'true')
    // Navigate to igazolasok view
    window.location.hash = 'igazolasok'
  }

  // Open override dialog
  const openOverrideDialog = (dateOrOverride?: Date | Override) => {
    if (dateOrOverride && !(dateOrOverride instanceof Date)) {
      // It's an override object - editing mode
      setEditingOverride(dateOrOverride)
      setOverrideForm({
        date: dateOrOverride.date,
        is_required: dateOrOverride.is_required,
        class_id: dateOrOverride.class_id,
        reason: dateOrOverride.reason || '',
      })
    } else {
      // It's a date or nothing - create mode
      setEditingOverride(null)
      const dateToUse = dateOrOverride instanceof Date ? dateOrOverride : (selectedDate || new Date())
      const defaultClassId = isSuperuser ? null : (user?.profile?.osztalyom?.id || null)
      setOverrideForm({
        date: format(dateToUse, 'yyyy-MM-dd'),
        is_required: true,
        class_id: defaultClassId,
        reason: '',
      })
    }
    setOverrideDialogOpen(true)
  }

  // Save override
  const saveOverride = async () => {
    try {
      if (editingOverride) {
        // Update existing override
        if (isSuperuser) {
          await apiClient.updateGlobalOverride(editingOverride.id, {
            date: overrideForm.date,
            is_required: overrideForm.is_required,
            class_id: overrideForm.class_id,
            reason: overrideForm.reason,
          })
        } else if (isTeacher) {
          await apiClient.updateClassOverride(editingOverride.id, {
            date: overrideForm.date,
            is_required: overrideForm.is_required,
            reason: overrideForm.reason,
          })
        }
      } else {
        // Create new override
        if (isSuperuser) {
          await apiClient.createGlobalOverride({
            date: overrideForm.date,
            is_required: overrideForm.is_required,
            class_id: overrideForm.class_id, // Can be null for all classes
            reason: overrideForm.reason,
          })
        } else if (isTeacher) {
          await apiClient.createClassOverride({
            date: overrideForm.date,
            is_required: overrideForm.is_required,
            reason: overrideForm.reason,
          })
        }
      }
      
      setOverrideDialogOpen(false)
      setEditingOverride(null)
      // Refetch schedule data without full page reload
      await loadData()
    } catch (err) {
      console.error('Failed to save override:', err)
      alert(err instanceof Error ? err.message : 'Failed to save override')
    }
  }

  // Get overrides for selected date (only global and own class)
  const getOverridesForDate = (date: Date) => {
    if (!schedule) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    const userClassId = user?.profile?.osztalyom?.id
    return schedule.overrides.filter(o => 
      o.date === dateStr && 
      (o.class_id === null || o.class_id === userClassId)
    )
  }
  
  // Get breaks for selected date
  const getBreaksForDate = (date: Date) => {
    if (!schedule) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedule.tanitasi_szunetek.filter(szunet => {
      return dateStr >= szunet.from_date && dateStr <= szunet.to_date
    })
  }
  
  // Get break emojis for a date (for display in calendar grid)
  const getBreakEmojisForDate = (date: Date): string[] => {
    const breaks = getBreaksForDate(date)
    return breaks.map(b => BREAK_TYPE_EMOJIS[b.type])
  }
  
  // Calculate break spans for the current calendar view
  const breakSpans = useMemo(() => {
    if (!schedule) return []
    
    const spans: Array<{
      break: typeof schedule.tanitasi_szunetek[0]
      startWeek: number
      endWeek: number
      startDay: number
      endDay: number
    }> = []
    
    const calendarStart = calendarDays[0]
    const calendarEnd = calendarDays[calendarDays.length - 1]
    
    schedule.tanitasi_szunetek.forEach(szunet => {
      const breakStart = parseISO(szunet.from_date)
      const breakEnd = parseISO(szunet.to_date)
      
      // Check if break overlaps with calendar view
      if (breakEnd >= calendarStart && breakStart <= calendarEnd) {
        // Find which week row(s) this break spans
        const actualStart = breakStart < calendarStart ? calendarStart : breakStart
        const actualEnd = breakEnd > calendarEnd ? calendarEnd : breakEnd
        
        const startIdx = calendarDays.findIndex(d => format(d, 'yyyy-MM-dd') === format(actualStart, 'yyyy-MM-dd'))
        const endIdx = calendarDays.findIndex(d => format(d, 'yyyy-MM-dd') === format(actualEnd, 'yyyy-MM-dd'))
        
        if (startIdx !== -1 && endIdx !== -1) {
          spans.push({
            break: szunet,
            startWeek: Math.floor(startIdx / 7),
            endWeek: Math.floor(endIdx / 7),
            startDay: startIdx % 7,
            endDay: endIdx % 7,
          })
        }
      }
    })
    
    return spans
  }, [schedule, calendarDays])

  // Delete override
  const confirmDeleteOverride = (overrideId: number) => {
    setOverrideToDelete(overrideId)
    setDeleteDialogOpen(true)
  }

  const deleteOverride = async () => {
    if (!overrideToDelete) return
    
    try {
      if (isSuperuser) {
        await apiClient.deleteGlobalOverride(overrideToDelete)
      } else if (isTeacher) {
        await apiClient.deleteClassOverride(overrideToDelete)
      }
      setDeleteDialogOpen(false)
      setOverrideToDelete(null)
      await loadData()
    } catch (err) {
      console.error('Failed to delete override:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete override')
    }
  }

  // Check if attendance is required for a date
  const checkAttendanceRequired = (date: Date): boolean => {
    if (!schedule) return false
    const dateStr = format(date, 'yyyy-MM-dd')
    return isAttendanceRequired(dateStr, user?.profile?.osztalyom, schedule)
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

  const stats = selectedDate ? (igazolasStats[format(selectedDate, 'yyyy-MM-dd')] || { approved: 0, denied: 0, pending: 0 }) : null
  const attendanceRequired = selectedDate ? checkAttendanceRequired(selectedDate) : false
  const overridesForDate = selectedDate ? getOverridesForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      {/* FTV Sync Status Card */}
      {(isTeacher || isFtvRegistered) && metadata && (
        <FTVSyncStatus
          isSyncing={isSyncing}
          metadata={metadata}
          onSyncNow={syncNow}
        />
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Naptár</h2>
          <p className="text-muted-foreground">
            Tanítási napok és igazolások áttekintése
          </p>
        </div>
        
        <Button onClick={goToToday} variant="outline">
          Ma
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <Card
          >
          <CardHeader
          className="max-md:p-4">
            <div className="flex items-center justify-left gap-4">
              <CardTitle>
                {format(currentMonth, 'yyyy. MMMM', { locale: hu })}
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={goToPreviousMonth}>
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={goToNextMonth}>
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900/30" />
                  <span>Tanítási nap</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-900/30" />
                  <span>Szünnap</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 dark:text-green-400">Elfogadva</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-red-600 dark:text-red-400">Elutasítva</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-blue-600 dark:text-blue-400">Függőben</span>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent
            className="max-sm:p-2"
          >
            <div className="space-y-1">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-0 sm:gap-2">
                {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map((day, idx) => (
                  <div
                    key={idx}
                    className="text-center text-xs sm:text-sm font-medium text-muted-foreground p-1 sm:p-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar weeks with break bars */}
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIdx) => {
                const weekDays = calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7)
                const weekBreaks = breakSpans.filter(span => 
                  weekIdx >= span.startWeek && weekIdx <= span.endWeek
                )
                
                return (
                  <div key={weekIdx} className="space-y-1">
                    {/* Week row */}
                    <div className="grid grid-cols-7 gap-0 sm:gap-2">
                      {weekDays.map((day, dayIdx) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const stats = igazolasStats[dateStr] || { approved: 0, denied: 0, pending: 0 }
                        const isCurrentMonth = isSameMonth(day, currentMonth)
                        const isTodayDate = isToday(day)
                        const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr
                        const attendanceReq = checkAttendanceRequired(day)
                        const userClassId = user?.profile?.osztalyom?.id
                        const hasOverride = schedule?.overrides.some(o => 
                          o.date === dateStr && 
                          (o.class_id === null || o.class_id === userClassId)
                        ) || false
                        const breakEmojis = getBreakEmojisForDate(day)
                        
                        return (
                          <button
                            key={dayIdx}
                            onClick={() => handleDateSelect(day)}
                            className={`
                              relative p-1 sm:p-2 text-xs sm:text-sm transition-all min-h-[60px] sm:min-h-[80px] sm:rounded-lg flex flex-col items-center justify-between gap-0.5  aspect-auto 
                              ${!isCurrentMonth ? 'opacity-40' : ''}
                              ${isTodayDate ? 'ring-2 ring-primary' : ''}
                              ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                              ${attendanceReq 
                                ? 'bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30' 
                                : 'bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30'
                              }
                            `}
                          >
                            <div className="flex flex-col items-center gap-0.5 w-full z-10">
                              <span className={`font-medium text-sm sm:text-base ${isTodayDate ? 'text-primary' : ''}`}>
                                {format(day, 'd')}
                              </span>
                              {hasOverride && (
                                <Badge variant="destructive" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-4 sm:h-5">
                                  Változás!
                                </Badge>
                              )}
                            </div>
                            
                            {/* Break emoji display */}
                            {breakEmojis.length > 0 && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xl sm:text-3xl opacity-30">
                                  {breakEmojis[0]}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex gap-0.5 sm:gap-1 z-10 w-full justify-center flex-wrap">
                              <Badge 
                                variant="outline" 
                                className={`text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0 h-3.5 sm:h-4 min-w-[16px] sm:min-w-[20px] justify-center bg-green-100 dark:bg-green-900/30 border-green-400 ${stats.approved === 0 ? 'opacity-20' : ''}`}
                              >
                                {stats.approved}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0 h-3.5 sm:h-4 min-w-[16px] sm:min-w-[20px] justify-center bg-red-100 dark:bg-red-900/30 border-red-400 ${stats.denied === 0 ? 'opacity-20' : ''}`}
                              >
                                {stats.denied}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0 h-3.5 sm:h-4 min-w-[16px] sm:min-w-[20px] justify-center bg-blue-100 dark:bg-blue-900/30 border-blue-400 ${stats.pending === 0 ? 'opacity-20' : ''}`}
                              >
                                {stats.pending}
                              </Badge>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Break bars for this week */}
                    {weekBreaks.map((span, spanIdx) => {
                      const isFirstWeek = weekIdx === span.startWeek
                      const isLastWeek = weekIdx === span.endWeek
                      const startCol = isFirstWeek ? span.startDay : 0
                      const endCol = isLastWeek ? span.endDay : 6
                      const colorMatch = BREAK_TYPE_COLORS[span.break.type].match(/border-(\w+)-(\d+)/)
                      const borderColor = colorMatch ? `${colorMatch[1]}-${colorMatch[2]}` : 'gray-500'
                      
                      return (
                        <div key={spanIdx} className="grid grid-cols-7 gap-1 sm:gap-2">
                          {Array.from({ length: 7 }, (_, colIdx) => {
                            if (colIdx < startCol || colIdx > endCol) {
                              return <div key={colIdx} />
                            }
                            
                            const isStart = colIdx === startCol
                            const isEnd = colIdx === endCol
                            const isMiddle = !isStart && !isEnd
                            
                            return (
                              <div key={colIdx} className="flex flex-col -my-0.5">
                                <div 
                                  className={`h-2 border-${borderColor} dark:border-${borderColor} border-b-2 ${isStart ? 'border-l-2' : ''} ${isEnd ? 'border-r-2' : ''} ${isMiddle ? '-mx-0.5' : ''}`}
                                />
                              </div>
                            )
                          })}
                          {/* Centered label below the full span */}
                          <div 
                            className="col-span-7 flex justify-center"
                            style={{
                              gridColumn: `${startCol + 1} / ${endCol + 2}`,
                            }}
                          >
                            <div className="text-center text-[10px] font-medium text-muted-foreground mt-0.5">
                              {BREAK_TYPE_EMOJIS[span.break.type]} {span.break.name || BREAK_TYPE_LABELS[span.break.type]}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected date card */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, 'yyyy. MMMM d.', { locale: hu })}
              </CardTitle>
              <CardDescription>
                {attendanceRequired ? (
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30">
                    Tanítási nap
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30">
                    Szünnap
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Elfogadva:</span>
                    <span className="font-medium text-green-600">{stats.approved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Elutasítva:</span>
                    <span className="font-medium text-red-600">{stats.denied}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Függőben:</span>
                    <span className="font-medium text-blue-600">{stats.pending}</span>
                  </div>
                </div>
              )}
              
              {!stats && (
                <p className="text-sm text-muted-foreground">
                  Nincs igazolás ezen a napon.
                </p>
              )}
              
              {/* Show school breaks for this date */}
              {getBreaksForDate(selectedDate).length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tanítási szünetek:</p>
                  {getBreaksForDate(selectedDate).map((szunet) => (
                    <div key={szunet.id} className={`p-2 rounded border ${BREAK_TYPE_COLORS[szunet.type]}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{BREAK_TYPE_EMOJIS[szunet.type]}</span>
                        <Badge variant="outline">{BREAK_TYPE_LABELS[szunet.type]}</Badge>
                      </div>
                      <p className="text-xs font-medium">{szunet.name || BREAK_TYPE_LABELS[szunet.type]}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(szunet.from_date), 'MMM d')} - {format(parseISO(szunet.to_date), 'MMM d, yyyy', { locale: hu })}
                      </p>
                      {szunet.description && (
                        <p className="text-xs text-muted-foreground mt-1">{szunet.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show overrides for this date */}
              {overridesForDate.length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Kivételek:</p>
                  {overridesForDate.map((override) => (
                    <div key={override.id} className="flex items-start justify-between gap-2 p-2 rounded bg-muted/50 text-xs">
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="mb-1">
                          {override.is_required ? 'Kötelező' : 'Nem kötelező'}
                        </Badge>
                        <p className="text-xs truncate">{override.reason}</p>
                      </div>
                      {canManageOverrides && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => openOverrideDialog(override)}
                          >
                            <IconEdit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => confirmDeleteOverride(override.id)}
                          >
                            <IconTrash className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-2 pt-3 border-t">
                <Button
                  onClick={() => viewIgazolasokForDate(selectedDate)}
                  className="w-full h-auto text-center"
                  variant="outline"
                >
                  <div className="flex items-start gap-2 w-full justify-center">
                    <IconFileText className="mt-1 h-4 w-4 flex-shrink-0" />
                    <span className="text-sm whitespace-normal break-words">
                      Erre a napra vonatkozó hiányzások megtekintése
                    </span>
                  </div>
                </Button>
                
                {canManageOverrides && (
                  <Button
                    onClick={() => openOverrideDialog(selectedDate)}
                    className="w-full h-auto text-center"
                    variant="outline"
                  >
                  <div className="flex items-start gap-2 w-full justify-center">
                    <IconPlus className="mt-1 h-4 w-4 flex-shrink-0" />
                    <span className="text-sm whitespace-normal break-words">
                      Rendkívüli tanítási rend rögzítése {!isSuperuser && '(osztályom számára)'}
                    </span>
                  </div>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOverride ? 'Kivétel szerkesztése' : 'Új kivétel hozzáadása'}</DialogTitle>
            <DialogDescription>
              Kivétel létrehozása vagy módosítása az alapértelmezett tanítási rend alól
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

            {/* Class selector for superusers */}
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
                    {classes.sort((a, b) => a.nev.localeCompare(b.nev, 'hu')).map((osztaly) => (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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

      {/* Teacher Guide - Collapsible */}
      {isTeacher && (
        <Collapsible open={isGuideOpen} onOpenChange={setIsGuideOpen}>
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-500">Új</Badge>
                  <CardTitle className="text-lg">Újdonság: Naptár menü</CardTitle>
                </div>
                <IconChevronDown className={`h-5 w-5 transition-transform ${isGuideOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>Naptár nézet:</strong> Könnyen áttekinthetőek a még függő hiányzások és eloszlásuk.
                </p>
                <p>
                  <strong>Tanítási szünetek és hétvégék rögzítése:</strong> Ha a diák leadna szünnapra hiányzást, 
                  akkor jelzi neki a rendszer, hogy ezen a napon nem kötelező a jelenlét.
                </p>
                <p>
                  <strong>FTV szinkronizáció:</strong> Amikor az FTV rendszerrel szinkronizál a rendszer, 
                  a szünnapokra vonatkozó igazolásokat automatikusan elrejti a statisztikákból és a táblázatból.
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  )
}
