"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BKKAlertVerificationCard } from "@/components/ui/BKKAlertVerificationCard"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Info,
  RotateCcw,
  CheckCheck,
  XCircle,
  Clapperboard,
  Download,
  ChevronDown,
  Sparkles
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getIgazolasType, isMultiDayAbsence, buildCalendarGrid, getDayOfWeekShort } from "../types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { IgazolasTableRow } from "@/app/dashboard/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GoogleDriveIcon } from "./columns"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { getPeriodSchedule } from "@/lib/periods"
import * as XLSX from 'xlsx'
import { useFrontendConfig } from "@/app/context/FrontendConfigContext"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDataChange?: () => void
  onOptimisticUpdate?: (id: string, newAllapot: string) => void
  ftvSyncStatus?: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDataChange,
  onOptimisticUpdate,
  ftvSyncStatus,
}: DataTableProps<TData, TValue>) {
  const { config, updateConfig, loading: configLoading } = useFrontendConfig()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedRow, setSelectedRow] = React.useState<IgazolasTableRow | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [teacherNote, setTeacherNote] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [filterType, setFilterType] = React.useState<string>("all")
  const [filterFTV, setFilterFTV] = React.useState<string>("all")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")
  const [isSearchCollapsed, setIsSearchCollapsed] = React.useState(true)
  const [igazolasTipusok, setIgazolasTipusok] = React.useState<string[]>([])
  const [isEasyProcessingActive, setIsEasyProcessingActive] = React.useState(false)
  const isActivatingEasyProcessing = React.useRef(false)
  const hasInitializedSmartFilter = React.useRef(false)
  const [isDataReady, setIsDataReady] = React.useState(false)

  // Track when data is ready (has loaded at least once)
  React.useEffect(() => {
    if (data && data.length >= 0 && !isDataReady) {
      console.log('Data is ready, length:', data.length)
      setIsDataReady(true)
    }
  }, [data, isDataReady])

  // Check for calendar date filters on mount
  React.useEffect(() => {
    const storedDateFrom = sessionStorage.getItem('datatable_date_from')
    const storedDateTo = sessionStorage.getItem('datatable_date_to')
    const expandSearch = sessionStorage.getItem('datatable_expand_search')
    
    if (storedDateFrom && storedDateTo) {
      setDateFrom(storedDateFrom)
      setDateTo(storedDateTo)
      // Clear after reading
      sessionStorage.removeItem('datatable_date_from')
      sessionStorage.removeItem('datatable_date_to')
    }
    
    if (expandSearch === 'true') {
      setIsSearchCollapsed(false)
      sessionStorage.removeItem('datatable_expand_search')
    }
  }, [])

  // Fetch igazolas types on mount
  React.useEffect(() => {
    const fetchTypes = async () => {
      try {
        const types = await apiClient.listIgazolasTipus()
        setIgazolasTipusok(types.map(t => t.nev))
      } catch (error) {
        console.error('Failed to fetch igazolas types:', error)
      }
    }
    fetchTypes()
  }, [])

  // Debug: Log config changes
  React.useEffect(() => {
    console.log('Config changed:', {
      loading: configLoading,
      smartFilter: config.dashboard?.smartFilter,
      fullConfig: config,
    })
  }, [config, configLoading])

  // Initialize smart filter from FrontendConfig on mount
  React.useEffect(() => {
    console.log('[Smart Filter Init] Effect triggered', {
      configLoading,
      isDataReady,
      hasInitialized: hasInitializedSmartFilter.current,
      smartFilterValue: config.dashboard?.smartFilter,
    })

    // Wait for BOTH config to finish loading AND data to be ready
    if (configLoading || !isDataReady) {
      console.log('[Smart Filter Init] Waiting...', { configLoading, isDataReady })
      return
    }
    
    // Only initialize once
    if (hasInitializedSmartFilter.current) {
      console.log('[Smart Filter Init] Already initialized, skipping')
      return
    }
    
    const smartFilterEnabled = config.dashboard?.smartFilter ?? false
    console.log('[Smart Filter Init] Ready to initialize:', {
      smartFilterEnabled,
      configLoading,
      isDataReady,
      dataLength: data.length,
      fullDashboardConfig: config.dashboard,
    })
    
    if (smartFilterEnabled) {
      // Activate smart filter with CURRENT date
      console.log('[Smart Filter Init] ✅ ACTIVATING smart filter on load')
      isActivatingEasyProcessing.current = true
      setFilterStatus("pending")
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      setDateFrom("") // No start date - show all past
      setDateTo(todayStr) // Up to today (CURRENT date)
      setSorting([{ id: "date", desc: false }])
      setIsEasyProcessingActive(true)
      console.log('[Smart Filter Init] ✅ Filter settings applied:', {
        filterStatus: 'pending',
        dateFrom: '',
        dateTo: todayStr,
        sorting: 'date asc',
      })
    } else {
      console.log('[Smart Filter Init] Smart filter is disabled in config')
    }
    
    hasInitializedSmartFilter.current = true
    console.log('[Smart Filter Init] Initialization complete')
  }, [config, configLoading, isDataReady, data.length])

  // Watch for manual filter changes and deactivate easy processing mode
  React.useEffect(() => {
    // Don't deactivate if we're in the middle of activating easy processing
    if (isActivatingEasyProcessing.current) {
      isActivatingEasyProcessing.current = false
      return
    }
    
    if (isEasyProcessingActive) {
      // If easy processing is active and filters changed manually, deactivate
      setIsEasyProcessingActive(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType, filterFTV, dateFrom, dateTo])

  // Get filtered data based on all filters
  const getFilteredData = React.useMemo(() => {
    const igazolasokData = data as unknown as IgazolasTableRow[]
    let filtered = [...igazolasokData]

    // Apply search filter from column filters
    const nameFilter = columnFilters.find(f => f.id === "studentName")
    const searchValue = nameFilter?.value as string
    if (searchValue) {
      filtered = filtered.filter((item) =>
        item.studentName.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchValue.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => {
        if (filterStatus === "pending") return item.allapot === 'Függőben'
        if (filterStatus === "approved") return item.allapot === 'Elfogadva'
        if (filterStatus === "rejected") return item.allapot === 'Elutasítva'
        return true
      })
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.type === filterType)
    }

    // FTV filter
    if (filterFTV !== "all") {
      filtered = filtered.filter((item) => {
        if (filterFTV === "ftv") return item.fromFTV === true
        if (filterFTV === "non-ftv") return !item.fromFTV
        return true
      })
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((item) => {
        // Use the absence start date (startDate) instead of submission date
        const itemDate = new Date(item.startDate);
        // Normalize to midnight for date-only comparison
        itemDate.setHours(0, 0, 0, 0);
        let isValid = true;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          isValid = isValid && itemDate >= fromDate;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(0, 0, 0, 0);
          isValid = isValid && itemDate <= toDate;
        }
        
        return isValid;
      })
    }

    return filtered
  }, [data, filterStatus, filterType, filterFTV, columnFilters, dateFrom, dateTo])

  const table = useReactTable({
    data: getFilteredData as TData[],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    autoResetPageIndex: false, // Prevent automatic page reset
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  const handleRowClick = (row: TData) => {
    const igazolas = row as unknown as IgazolasTableRow
    setSelectedRow(igazolas)
    setTeacherNote(igazolas.teacherNote || "")
    setIsSheetOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedRow) return
    
    try {
      // Optimistic update for the sheet display
      setSelectedRow(prev => prev ? { ...prev, allapot: 'Elfogadva' } : null);
      
      // Apply optimistic update to parent data
      onOptimisticUpdate?.(selectedRow.id, 'Elfogadva');
      
      // First update teacher comment if provided
      if (teacherNote.trim()) {
        await apiClient.updateTeacherComment(parseInt(selectedRow.id), { 
          megjegyzes_tanar: teacherNote.trim() 
        })
      }
      
      // Then approve the igazolás
      await apiClient.quickActionIgazolas(parseInt(selectedRow.id), { action: 'Elfogadva' })
      
      toast.success('Igazolás jóváhagyva')
      setIsSheetOpen(false)
      
      // No need to refetch - optimistic update already applied
    } catch (error) {
      console.error('Failed to approve igazolás:', error)
      toast.error('Hiba történt az igazolás jóváhagyásakor')
      
      // Revert optimistic update on error
      setIsSheetOpen(false)
      onDataChange?.()
    }
  }

  const handleReject = async () => {
    if (!selectedRow) return
    
    try {
      // Optimistic update for the sheet display
      setSelectedRow(prev => prev ? { ...prev, allapot: 'Elutasítva' } : null);
      
      // Apply optimistic update to parent data
      onOptimisticUpdate?.(selectedRow.id, 'Elutasítva');
      
      // First update teacher comment if provided
      if (teacherNote.trim()) {
        await apiClient.updateTeacherComment(parseInt(selectedRow.id), { 
          megjegyzes_tanar: teacherNote.trim() 
        })
      }
      
      // Then reject the igazolás
      await apiClient.quickActionIgazolas(parseInt(selectedRow.id), { action: 'Elutasítva' })
      
      toast.success('Igazolás elutasítva')
      setIsSheetOpen(false)
      
      // No need to refetch - optimistic update already applied
    } catch (error) {
      console.error('Failed to reject igazolás:', error)
      toast.error('Hiba történt az igazolás elutasításakor')
      
      // Revert optimistic update on error
      setIsSheetOpen(false)
      onDataChange?.()
    }
  }

  const handleResetToPending = async () => {
    if (!selectedRow) return
    
    try {
      // Optimistic update for the sheet display
      setSelectedRow(prev => prev ? { ...prev, allapot: 'Függőben' } : null);
      
      // Apply optimistic update to parent data
      onOptimisticUpdate?.(selectedRow.id, 'Függőben');
      
      await apiClient.quickActionIgazolas(parseInt(selectedRow.id), { action: 'Függőben' })
      toast.success('Igazolás státusza visszaállítva függőben állapotra')
      setIsSheetOpen(false)
      
      // No need to refetch - optimistic update already applied
    } catch (error) {
      console.error('Failed to reset to pending:', error)
      toast.error('Hiba történt a státusz módosításakor')
      
      // Revert optimistic update on error
      setIsSheetOpen(false)
      onDataChange?.()
    }
  }

  const handleBulkApprove = async () => {
    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const ids = selectedRows.map(row => parseInt((row.original as unknown as IgazolasTableRow).id))
      
      if (ids.length === 0) {
        toast.error('Nincs kiválasztott igazolás')
        return
      }

      // Apply optimistic updates
      ids.forEach(id => {
        onOptimisticUpdate?.(id.toString(), 'Elfogadva');
      });

      await apiClient.bulkQuickActionIgazolas({ action: 'Elfogadva', ids })
      toast.success(`${ids.length} igazolás jóváhagyva`)
      setRowSelection({})
      
      // No need to refetch - optimistic updates already applied
    } catch (error) {
      console.error('Failed to bulk approve:', error)
      toast.error('Hiba történt a tömeges jóváhagyás során')
      
      // Revert on error by refetching
      setRowSelection({})
      onDataChange?.()
    }
  }

  const handleBulkReject = async () => {
    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const ids = selectedRows.map(row => parseInt((row.original as unknown as IgazolasTableRow).id))
      
      if (ids.length === 0) {
        toast.error('Nincs kiválasztott igazolás')
        return
      }

      // Apply optimistic updates
      ids.forEach(id => {
        onOptimisticUpdate?.(id.toString(), 'Elutasítva');
      });

      await apiClient.bulkQuickActionIgazolas({ action: 'Elutasítva', ids })
      toast.success(`${ids.length} igazolás elutasítva`)
      setRowSelection({})
      
      // No need to refetch - optimistic updates already applied
    } catch (error) {
      console.error('Failed to bulk reject:', error)
      toast.error('Hiba történt a tömeges elutasítás során')
      
      // Revert on error by refetching
      setRowSelection({})
      onDataChange?.()
    }
  }

  const handleBulkSetPending = async () => {
    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const ids = selectedRows.map(row => parseInt((row.original as unknown as IgazolasTableRow).id))
      
      if (ids.length === 0) {
        toast.error('Nincs kiválasztott igazolás')
        return
      }

      // Apply optimistic updates
      ids.forEach(id => {
        onOptimisticUpdate?.(id.toString(), 'Függőben');
      });

      await apiClient.bulkQuickActionIgazolas({ action: 'Függőben', ids })
      toast.success(`${ids.length} igazolás visszaállítva függőben állapotra`)
      setRowSelection({})
      
      // No need to refetch - optimistic updates already applied
    } catch (error) {
      console.error('Failed to bulk set pending:', error)
      toast.error('Hiba történt a tömeges státusz módosítás során')
      
      // Revert on error by refetching
      setRowSelection({})
      onDataChange?.()
    }
  }

  const handleExportData = (format: 'csv' | 'tsv' | 'xlsx') => {
    const exportData = getFilteredData.map(igazolas => ({
      'Diák neve': igazolas.studentName,
      'Osztály': igazolas.studentClass,
      'Dátum': igazolas.date,
      'Típus': igazolas.type,
      'Státusz': igazolas.allapot,
      'Órák': igazolas.hours.join(', '),
      'Korrigált órák': igazolas.correctedHours?.join(', ') || '',
      'Megjegyzés': igazolas.status || '',
      'Tanári megjegyzés': igazolas.teacherNote || '',
      'Beküldve': igazolas.submittedAt,
      'FTV importált': igazolas.fromFTV ? 'Igen' : 'Nem'
    }));

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'xlsx') {
      // Export as XLSX
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Igazolások');
      XLSX.writeFile(wb, `igazolasok_${timestamp}.xlsx`);
    } else {
      // Export as CSV or TSV
      const separator = format === 'csv' ? ',' : '\t';
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(separator),
        ...exportData.map(row => headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape values containing separator, quotes, or newlines
          const stringValue = String(value);
          if (stringValue.includes(separator) || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(separator))
      ];

      const content = csvRows.join('\n');
      // Use UTF-8 BOM for proper encoding in Excel
      const bom = '\uFEFF';
      const blob = new Blob([bom + content], { 
        type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/tab-separated-values;charset=utf-8;' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `igazolasok_${timestamp}.${format}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    toast.success(`Igazolások exportálva ${format.toUpperCase()} formátumban!`);
  };

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length

  const getHoursDisplay = (igazolas: IgazolasTableRow) => {
    const hours = igazolas.hours
    const correctedHours = igazolas.correctedHours || []
    const allapot = igazolas.allapot
    const fromFTV = igazolas.fromFTV || false
    
    return (
      <TooltipProvider>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => {
            const isFTVHour = fromFTV && hours.includes(h)
            const isCorrectionHour = correctedHours.includes(h)
            const isRegularHour = !fromFTV && hours.includes(h)
            
            let bgColor = "period-inactive"
            let glowColor = ""
            let tooltipText = "Nincs hiányzás"
            
            if (isCorrectionHour) {
              if (allapot === 'Elfogadva') {
                bgColor = "period-approved"
                glowColor = "period-glow-green"
                tooltipText = `Diák korrekció - Osztályfőnök jóváhagyta\n${getPeriodSchedule(h)}`
              } else if (allapot === 'Elutasítva') {
                bgColor = "period-rejected"
                glowColor = "period-glow-red"
                tooltipText = `Diák korrekció - Osztályfőnök elutasította\n${getPeriodSchedule(h)}`
              } else {
                bgColor = "period-correction"
                glowColor = "period-glow-purple"
                tooltipText = `Diák korrekció - Osztályfőnöki jóváhagyásra vár\n${getPeriodSchedule(h)}`
              }
            } else if (isFTVHour) {
              if (allapot === 'Elfogadva') {
                bgColor = "period-approved"
                glowColor = "period-glow-green"
                tooltipText = `FTV importált - Osztályfőnök jóváhagyta\n${getPeriodSchedule(h)}`
              } else if (allapot === 'Elutasítva') {
                bgColor = "period-rejected"
                glowColor = "period-glow-red"
                tooltipText = `FTV importált - Osztályfőnök elutasította\n${getPeriodSchedule(h)}`
              } else {
                bgColor = "period-pending"
                glowColor = "period-glow-blue"
                tooltipText = `FTV importált - Médiatanár igazolta\n${getPeriodSchedule(h)}`
              }
            } else if (isRegularHour) {
              if (allapot === 'Függőben') {
                bgColor = "period-pending"
                glowColor = "period-glow-blue"
                tooltipText = `Ellenőrzésre vár\n${getPeriodSchedule(h)}`
              } else if (allapot === 'Elfogadva') {
                bgColor = "period-approved"
                glowColor = "period-glow-green"
                tooltipText = `Jóváhagyva\n${getPeriodSchedule(h)}`
              } else {
                bgColor = "period-rejected"
                glowColor = "period-glow-red"
                tooltipText = `Elutasítva\n${getPeriodSchedule(h)}`
              }
            } else {
              tooltipText = `Nincs hiányzás\n${getPeriodSchedule(h)}`
            }
            
            const isActive = isFTVHour || isCorrectionHour || isRegularHour
            
            return (
              <Tooltip key={h}>
                <TooltipTrigger asChild>
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg cursor-help transition-all duration-500 ease-in-out transform ${bgColor} ${isActive ? glowColor : ''} hover:scale-110`}
                  >
                    {h}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-600 dark:border-slate-400 font-medium text-xs whitespace-pre-line max-w-xs shadow-lg">
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Enhanced Filters */}
        <Card className="border">
          <Collapsible open={!isSearchCollapsed} onOpenChange={(open) => setIsSearchCollapsed(!open)}>
            <CardHeader className="pb-4">
              <CollapsibleTrigger className="w-full cursor-pointer">
                <div className="flex items-center justify-between font-medium transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-semibold">Keresés és szűrés</div>
                      <div className="text-sm text-muted-foreground">
                        Szűrd az igazolásokat és rendezd őket oszlopfejlécre kattintással
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1">
                      {table.getFilteredRowModel().rows.length} találat
                    </Badge>
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isSearchCollapsed ? '' : 'rotate-180'}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-3 border-t space-y-6">
            {/* Quick Action - Könnyű feldolgozás */}
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-semibold">Könnyű feldolgozás</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rendezés dátum szerint, csak <span className="text-blue-500 dark:text-blue-400">függőben</span> lévő és múltbeli igazolások
                    <br />
                    <span className="text-cyan-500 dark:text-cyan-400 inline-flex items-center gap-1 mt-1">
                      {/* new icon */}
                      <Sparkles className="
                        size-4
                      " />
                      A rendszer megjegyzi a beállítást a következő látogatáskor
                    </span>
                  </p>
                </div>
                <Button
                  variant={isEasyProcessingActive ? "outline" : "default"}
                  size="sm"
                  onClick={async () => {
                    if (isEasyProcessingActive) {
                      // Deactivate - clear filters and persist to backend
                      setFilterStatus("all")
                      setDateFrom("")
                      setDateTo("")
                      setSorting([])
                      setIsEasyProcessingActive(false)
                      
                      // Persist deactivation to backend
                      try {
                        console.log('Deactivating smart filter, updating backend...')
                        await updateConfig({
                          dashboard: {
                            smartFilter: false,
                          },
                        })
                        console.log('Smart filter deactivated and saved')
                      } catch (error) {
                        console.error('Failed to update smartFilter config:', error)
                        toast.error('Nem sikerült menteni a beállítást')
                      }
                    } else {
                      // Activate - set filters for past (up to today) and persist to backend
                      isActivatingEasyProcessing.current = true
                      setFilterStatus("pending")
                      const today = new Date()
                      setDateFrom("") // No start date - show all past
                      setDateTo(today.toISOString().split('T')[0]) // Up to today
                      setSorting([{ id: "date", desc: false }])
                      setIsEasyProcessingActive(true)
                      
                      // Persist activation to backend
                      try {
                        console.log('Activating smart filter, updating backend...')
                        await updateConfig({
                          dashboard: {
                            smartFilter: true,
                          },
                        })
                        console.log('Smart filter activated and saved')
                      } catch (error) {
                        console.error('Failed to update smartFilter config:', error)
                        toast.error('Nem sikerült menteni a beállítást')
                      }
                    }
                  }}
                  className={`w-full sm:w-auto flex-shrink-0 gap-1 ${isEasyProcessingActive ? 'border-green-500 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-500 dark:hover:bg-green-950' : ''}`}
                >
                  {isEasyProcessingActive ? (
                    <>
                      <Check className="h-4 w-4" />
                      Aktív
                    </>
                  ) : (
                    'Aktiválás'
                  )}
                </Button>
              </div>
            </div>

            {/* Primary Search */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Keresés</Label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  placeholder="Diák neve vagy indoklás alapján..."
                  value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("studentName")?.setFilterValue(event.target.value)
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Státusz</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz státuszt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                        Minden státusz
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                        Függőben
                      </div>
                    </SelectItem>
                    <SelectItem value="approved">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></div>
                        Jóváhagyva
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"></div>
                        Elutasítva
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Hiányzás típusa</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz típust" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Minden típus</SelectItem>
                    {igazolasTipusok.map((tipus) => (
                      <SelectItem key={tipus} value={tipus}>
                        {tipus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">FTV importált</Label>
                <Select value={filterFTV} onValueChange={setFilterFTV}>
                  <SelectTrigger>
                    <SelectValue placeholder="FTV státusz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Mind</SelectItem>
                    <SelectItem value="ftv">
                      <div className="flex items-center gap-2">
                        <Clapperboard className="h-3 w-3 text-blue-500 drop-shadow-md shadow-blue-500" />
                        Csak <span className="text-blue-500 drop-shadow-md shadow-blue-500 font-bold">FTV</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="non-ftv">Csak manuális</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Dátum tartomány</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ettől</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Eddig</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filterStatus !== "all" || filterType !== "all" || filterFTV !== "all" || dateFrom || dateTo) && (
              <div className="flex flex-wrap gap-2 items-center pt-4 border-t">
                <span className="text-sm font-medium text-muted-foreground">Aktív szűrők:</span>
                {filterStatus !== "all" && (
                  <Badge variant="outline" className="gap-2">
                    Státusz: {filterStatus === "pending" ? "Függőben" : filterStatus === "approved" ? "Jóváhagyva" : "Elutasítva"}
                    <button 
                      onClick={() => setFilterStatus("all")} 
                      className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </Badge>
                )}
                {filterType !== "all" && (
                  <Badge variant="outline" className="gap-2">
                    Típus: {filterType}
                    <button 
                      onClick={() => setFilterType("all")} 
                      className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </Badge>
                )}
                {filterFTV !== "all" && (
                  <Badge variant="outline" className="gap-2">
                    FTV: {filterFTV === "ftv" ? "Igen" : "Nem"}
                    <button 
                      onClick={() => setFilterFTV("all")} 
                      className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="outline" className="gap-2">
                    Ettől: {dateFrom}
                    <button 
                      onClick={() => setDateFrom("")} 
                      className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="outline" className="gap-2">
                    Eddig: {dateTo}
                    <button 
                      onClick={() => setDateTo("")} 
                      className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterStatus("all")
                    setFilterType("all")
                    setFilterFTV("all")
                    setDateFrom("")
                    setDateTo("")
                  }}
                  className="h-7 px-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 mr-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-200" />
                  Összes törlése
                </Button>
              </div>
            )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Bulk Actions */}
        {selectedRowsCount > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">
                    {selectedRowsCount} igazolás kiválasztva
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkApprove}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mind jóváhagy
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    size="sm"
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Mind elutasít
                  </Button>
                  <Button
                    onClick={handleBulkSetPending}
                    size="sm"
                    className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 text-blue-700 hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 dark:from-blue-900/20 dark:to-blue-900/30 dark:text-blue-400 dark:hover:from-blue-900/30 dark:hover:to-blue-900/40 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mind függőben
                  </Button>
                  <Button
                    onClick={() => setRowSelection({})}
                    size="sm"
                    variant="outline"
                    className="shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200"
                  >
                    Kijelölés törlése
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card className="border">
          <CardContent className="p-4">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between font-medium transition-colors">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Órarend színkódok magyarázata</span>
                </div>
                <svg
                  className="h-4 w-4 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 pt-3 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-blue-500 text-white shadow-sm">0</span>
                    <span className="text-sm font-medium">Függőben / FTV importált</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-purple-500 text-white shadow-sm">0</span>
                    <span className="text-sm font-medium">Diák korrekció</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-green-500 text-white shadow-sm">0</span>
                    <span className="text-sm font-medium">Jóváhagyva</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-red-500 text-white shadow-sm">0</span>
                    <span className="text-sm font-medium">Elutasítva</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-muted text-muted-foreground border">0</span>
                    <span className="text-sm font-medium">Nincs hiányzás</span>
                  </div>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* FTV Sync Status */}
        {ftvSyncStatus && (
          <div>
            {ftvSyncStatus}
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id} className="font-bold text-xs uppercase tracking-wide whitespace-nowrap align-middle">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="hover:bg-muted/50 transition-colors border-b"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell 
                              key={cell.id} 
                              className={`py-4 align-middle ${cell.column.id !== 'actions' ? 'cursor-pointer hover:bg-muted/30' : ''}`}
                              onClick={cell.column.id !== 'actions' ? () => handleRowClick(row.original) : undefined}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-8 w-8" />
                            <p className="font-medium">Nincs találat</p>
                            <p className="text-sm">Próbálj más keresési feltételeket</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagination and Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground font-medium">
              Összesen {table.getFilteredRowModel().rows.length} igazolás
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportData('csv')}>
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('tsv')}>
                  Export TSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('xlsx')}>
                  Export XLSX
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Előző
            </Button>
            <div className="flex items-center gap-1">
              <div className="text-sm font-medium px-3 py-1.5 rounded-md bg-muted">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="gap-1"
            >
              Következő
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-3xl flex flex-col p-0 overflow-hidden">
          {selectedRow && (
            <>
              <SheetHeader className="p-6 pb-4 border-b shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <SheetTitle className="text-2xl mb-1">Igazolás részletei</SheetTitle>
                    <SheetDescription className="text-base">
                      {selectedRow.studentName} • {selectedRow.studentClass}
                    </SheetDescription>
                  </div>
                  {selectedRow.allapot === 'Függőben' && (
                    <Badge variant="pending">
                      Függőben
                    </Badge>
                  )}
                  {selectedRow.allapot === 'Elfogadva' && (
                    <Badge variant="approved">
                      Elfogadva
                    </Badge>
                  )}
                  {selectedRow.allapot === 'Elutasítva' && (
                    <Badge variant="rejected">
                      Elutasítva
                    </Badge>
                  )}
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {/* Student Section */}
                    <Card className="border-2">
                      <CardHeader className="bg-muted/50 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Diák által beküldött adatok</CardTitle>
                            <CardDescription className="text-xs">Csak olvasható információk</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diák neve</Label>
                            <p className="font-semibold text-lg">{selectedRow.studentName}</p>
                          </div>
                          <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Osztály</Label>
                            <p className="font-semibold text-lg">{selectedRow.studentClass}</p>
                          </div>
                        </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hiányzás típusa</Label>
                          {(() => {
                            const typeInfo = getIgazolasType(selectedRow.type)
                            return (
                              <Badge 
                                variant="outline" 
                                className={`${typeInfo.color} inline-flex items-center gap-1.5 font-medium`}
                              >
                                <span className="text-sm">{typeInfo.emoji}</span>
                                {typeInfo.name}
                              </Badge>
                            )
                          })()}
                        </div>
                        <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Dátum
                          </Label>
                          {isMultiDayAbsence(selectedRow.startDate, selectedRow.endDate) ? (
                            <div className="space-y-1">
                              <p className="text-sm font-semibold">{new Date(selectedRow.startDate).toLocaleDateString('hu-HU')}</p>
                              <p className="text-xs text-muted-foreground">→</p>
                              <p className="text-sm font-semibold">{new Date(selectedRow.endDate).toLocaleDateString('hu-HU')}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {Math.ceil((new Date(selectedRow.endDate).getTime() - new Date(selectedRow.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} nap
                              </p>
                            </div>
                          ) : (
                            <p className="font-semibold text-base">{selectedRow.date}</p>
                          )}
                        </div>
                      </div>

                        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {isMultiDayAbsence(selectedRow.startDate, selectedRow.endDate) ? 'Érintett napok' : 'Érintett órák'}
                          </Label>
                          {isMultiDayAbsence(selectedRow.startDate, selectedRow.endDate) ? (
                            <div className="flex flex-col gap-1 w-fit">
                              {/* Day headers */}
                              <div className="grid grid-cols-7 gap-1">
                                {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => (
                                  <div
                                    key={dayIndex}
                                    className="flex items-center justify-center text-[10px] font-semibold text-muted-foreground uppercase h-5 w-9"
                                  >
                                    {getDayOfWeekShort(dayIndex)}
                                  </div>
                                ))}
                              </div>
                              
                              {/* Calendar weeks */}
                              {buildCalendarGrid(selectedRow.startDate, selectedRow.endDate).map((week, weekIndex) => (
                                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                                  {week.map((day, dayIndex) => {
                                    let bgColor = "period-inactive";
                                    let glowColor = "";
                                    let tooltipText = `${day.date.toLocaleDateString('hu-HU', { weekday: 'long' })}\n${day.date.toLocaleDateString('hu-HU')}`;
                                    
                                    if (day.isInRange) {
                                      if (selectedRow.allapot === 'Függőben') {
                                        bgColor = "period-pending";
                                        glowColor = "period-glow-blue";
                                        tooltipText += "\nEllenőrzésre vár";
                                      } else if (selectedRow.allapot === 'Elfogadva') {
                                        bgColor = "period-approved";
                                        glowColor = "period-glow-green";
                                        tooltipText += "\nJóváhagyva";
                                      } else if (selectedRow.allapot === 'Elutasítva') {
                                        bgColor = "period-rejected";
                                        glowColor = "period-glow-red";
                                        tooltipText += "\nElutasítva";
                                      }
                                    } else {
                                      tooltipText = `${day.date.toLocaleDateString('hu-HU', { weekday: 'long' })}\n${day.date.toLocaleDateString('hu-HU')}\nNem érintett`;
                                    }
                                    
                                    return (
                                      <TooltipProvider key={dayIndex}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span
                                              className={`inline-flex items-center justify-center w-9 h-9 text-xs font-bold rounded-full cursor-help transition-all duration-300 ease-in-out transform ${bgColor} ${day.isInRange ? glowColor : ''} hover:scale-110`}
                                            >
                                              {day.dayOfMonth}
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-600 dark:border-slate-400 font-medium text-xs whitespace-pre-line max-w-xs shadow-lg">
                                            {tooltipText}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          ) : (
                            getHoursDisplay(selectedRow)
                          )}
                        </div>

                        {selectedRow.fromFTV && (
                          <Card className="border-2 border-blue-300 dark:border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
                            <CardHeader className="pb-4 bg-blue-100/50 dark:bg-blue-900/30">
                              <div className="flex items-start gap-3">
                                <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-500 shadow-lg">
                                  <Clapperboard className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-xl text-blue-900 dark:text-blue-200 flex items-center gap-2">
                                    FTV Sync
                                    <Badge variant="outline" className="bg-blue-200 text-blue-900 border-blue-400 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600 text-xs">
                                      Médiatanár által igazolva
                                    </Badge>
                                  </CardTitle>
                                  <CardDescription className="text-blue-700 dark:text-blue-400 mt-1">
                                    Forgatásszervezői Platform - Automatikus szinkronizálás
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                              {/* Main FTV Info */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-700">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 animate-pulse"></div>
                                    <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase">Státusz</Label>
                                  </div>
                                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Médiatanár által visszaigazolva</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-blue-200 dark:border-blue-700">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Clapperboard className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                    <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase">Forrás</Label>
                                  </div>
                                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">FTV Forgatásszervező Platform</p>
                                </div>
                              </div>

                              {/* Important Note */}
                              <Alert className="border-cyan-300 dark:border-cyan-600 bg-cyan-50/50 dark:bg-cyan-900/20">
                                <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                <AlertTitle className="text-cyan-900 dark:text-cyan-300 font-semibold">Fontos információ</AlertTitle>
                                <AlertDescription className="text-cyan-800 dark:text-cyan-400 text-sm">
                                  Ez az igazolás közvetlenül a Forgatásszervezői Platformról került importálásra. 
                                  A médiatanár már visszaigazolta a diák jelenlétét a forgatáson.
                                </AlertDescription>
                              </Alert>

                              {/* Student Correction Section - Only show if there are extra minutes */}
                              {((selectedRow.minutesBefore ?? 0) > 0 || (selectedRow.minutesAfter ?? 0) > 0) && (
                                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-300 dark:border-purple-600">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 rounded-lg bg-purple-600 dark:bg-purple-500">
                                      <User className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-purple-900 dark:text-purple-200">Diák által megadott extra időszak</p>
                                      <p className="text-xs text-purple-700 dark:text-purple-400">Osztályfőnöki jóváhagyásra vár</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {(selectedRow.minutesBefore ?? 0) > 0 && (
                                      <div className="flex items-center gap-3 p-2 rounded-md bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-600 dark:bg-purple-500 text-white font-bold text-lg">
                                          {selectedRow.minutesBefore}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">Forgatás előtt</p>
                                          <p className="text-xs text-purple-700 dark:text-purple-400">Utazási idő, előkészület</p>
                                        </div>
                                      </div>
                                    )}
                                    {(selectedRow.minutesAfter ?? 0) > 0 && (
                                      <div className="flex items-center gap-3 p-2 rounded-md bg-purple-100 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-700">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-600 dark:bg-purple-500 text-white font-bold text-lg">
                                          {selectedRow.minutesAfter}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">Forgatás után</p>
                                          <p className="text-xs text-purple-700 dark:text-purple-400">Hazautazás, lezárás</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-3 p-2 rounded bg-purple-200/50 dark:bg-purple-800/30">
                                    <p className="text-xs text-purple-800 dark:text-purple-300">
                                      <strong>Összesen:</strong> {(selectedRow.minutesBefore ?? 0) + (selectedRow.minutesAfter ?? 0)} perc extra időszak
                                    </p>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Indoklás / Korrekció section - only show if there's content */}
                        {((selectedRow.correctedHours && selectedRow.correctedHours.length > 0) || (!selectedRow.fromFTV && selectedRow.status)) && (
                          <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                            {selectedRow.correctedHours && selectedRow.correctedHours.length > 0 ? (
                            <>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Korrekció indoklása</Label>
                            <p className="text-sm leading-relaxed">{selectedRow.status || <span className="italic text-muted-foreground">Nincs megjegyzés</span>}</p>
                            </>
                            ) : (
                            <>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Indoklás</Label>
                            <p className="text-sm leading-relaxed">{selectedRow.status || <span className="italic text-muted-foreground">Nincs megjegyzés</span>}</p>
                            </>
                            )}
                          </div>
                        )}

                        {(selectedRow.imageUrl || selectedRow.imgDriveURL) && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                              <GoogleDriveIcon className="h-3 w-3" />
                              Mellékelt kép (Google Drive)
                            </Label>
                            <Button 
                              variant="outline" 
                              size="lg" 
                              className="w-full h-auto py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-300"
                              onClick={() => {
                                const imageUrl = selectedRow.imageUrl || selectedRow.imgDriveURL
                                if (imageUrl) {
                                  window.open(imageUrl, '_blank', 'noopener,noreferrer')
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                  <GoogleDriveIcon className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                  <p className="font-medium">Kép megtekintése Google Drive-on</p>
                                  <p className="text-xs text-muted-foreground">Kattints a megnyitáshoz</p>
                                </div>
                                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                              </div>
                            </Button>
                          </div>
                        )}

                        <div className="space-y-2 p-3 rounded-lg bg-muted/30 border">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                          {selectedRow.fromFTV ? (
                          <>
                            <RotateCcw className="h-3 w-3" />
                            Utoljára szinkronizálva
                          </>
                          ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Rögzítés dátuma
                          </>
                          )}
                        </Label>
                        <p className="text-sm font-medium">
                          {new Date(
                          selectedRow.submittedAt
                          ).toLocaleString('hu-HU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          })}
                        </p>
                        </div>
                    </CardContent>
                  </Card>

                  {/* BKK Verification Section */}
                  {selectedRow.bkk_verification && (
                    <BKKAlertVerificationCard bkkVerificationJson={selectedRow.bkk_verification} />
                  )}

                    {/* Teacher Section */}
                    <Card className="border-2 border-primary/20">
                      <CardHeader className="bg-primary/5 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Osztályfőnöki műveletek</CardTitle>
                            <CardDescription className="text-xs">A művelet az egész igazolásra vonatkozik</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-6 space-y-4">
                        <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500">
                          <AlertTitle className="text-blue-900 dark:text-blue-300 text-lg inline-flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Fontos információ
                          </AlertTitle>
                          <AlertDescription className="text-blue-800 dark:text-blue-400 text-sm">
                            A jóváhagyás vagy elutasítás az <strong>egész igazolásra</strong> vonatkozik. Az egyes tanórák külön-külön nem hagyhatók jóvá vagy utasíthatók el.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                          <Label htmlFor="teacherNote" className="text-sm font-semibold">
                            Osztályfőnök megjegyzése
                          </Label>
                          <Textarea
                            id="teacherNote"
                            placeholder="Írj megjegyzést az igazoláshoz... (pl. szülői igazolás bemutatva, dokumentáció rendben, stb.)"
                            value={teacherNote}
                            onChange={(e) => setTeacherNote(e.target.value)}
                            rows={5}
                            className="resize-none"
                            disabled={selectedRow.allapot !== 'Függőben'}
                          />
                          <p className="text-xs text-muted-foreground">
                            {selectedRow.allapot !== 'Függőben' 
                              ? "Ez az igazolás már feldolgozásra került." 
                              : "A megjegyzésed látható lesz a diák számára."}
                          </p>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Jelenlegi státusz</Label>
                          <div className="flex items-center gap-2">
                            {selectedRow.allapot === 'Függőben' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 text-base px-4 py-2 dark:border-blue-500 dark:text-blue-400">
                                <Clock className="h-4 w-4 mr-2" />
                                Függőben - Döntésre vár
                              </Badge>
                            )}
                            {selectedRow.allapot === 'Elfogadva' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 dark:text-green-400 dark:border-green-500 border-green-300 dark:bg-green-900/20 text-base px-4 py-2">
                                <Check className="h-4 w-4 mr-2" />
                                Elfogadva
                              </Badge>
                            )}
                            {selectedRow.allapot === 'Elutasítva' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 text-base px-4 py-2 dark:border-red-500 dark:text-red-400">
                                <X className="h-4 w-4 mr-2" />
                                Elutasítva
                              </Badge>
                            )}
                          </div>
                        </div>

                        {selectedRow.allapot === 'Függőben' ? (
                          <div className="grid grid-cols-2 gap-3 pt-4">
                            <Button
                              onClick={handleApprove}
                              size="lg"
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                              <Check className="h-5 w-5 mr-2" />
                              Jóváhagy
                            </Button>
                            <Button
                              onClick={handleReject}
                              size="lg"
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                              <X className="h-5 w-5 mr-2" />
                              Elutasít
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3 pt-4">
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full font-semibold border-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-600 transform hover:scale-105 transition-all duration-200"
                              onClick={handleResetToPending}
                            >
                              <RotateCcw className="h-5 w-5 mr-2" />
                              Visszaállítás függőben státuszra
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transform hover:scale-105 transition-all duration-200"
                              onClick={() => setIsSheetOpen(false)}
                            >
                              Bezár
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
