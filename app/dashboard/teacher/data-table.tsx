"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
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
  ChevronDown
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
import { getIgazolasType } from "../types"
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDataChange?: () => void
  onOptimisticUpdate?: (id: string, newAllapot: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDataChange,
  onOptimisticUpdate,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedRow, setSelectedRow] = React.useState<IgazolasTableRow | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [teacherNote, setTeacherNote] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [filterType, setFilterType] = React.useState<string>("all")
  const [filterFTV, setFilterFTV] = React.useState<string>("all")
  const [groupBy, setGroupBy] = React.useState<string>("none")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")
  const [isSearchCollapsed, setIsSearchCollapsed] = React.useState(true)

  // Get filtered data based on all filters
  const getFilteredData = React.useMemo(() => {
    const igazolasokData = data as unknown as IgazolasTableRow[]
    let filtered = [...igazolasokData]

    // Apply search filter from column filters
    const nameFilter = columnFilters.find(f => f.id === "studentName")
    const searchValue = nameFilter?.value as string
    if (searchValue) {
      filtered = filtered.filter((item) =>
        item.studentName.toLowerCase().includes(searchValue.toLowerCase())
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
        const itemDate = new Date(item.submittedAt);
        let isValid = true;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          isValid = isValid && itemDate >= fromDate;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // Include the entire end date
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
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

  // Group data if grouping is enabled
  const groupedData = React.useMemo(() => {
    if (groupBy === "none") return null

    const filtered = getFilteredData
    const groups: Record<string, IgazolasTableRow[]> = {}

    filtered.forEach((item) => {
      let key = ""
      switch (groupBy) {
        case "status":
          key = item.allapot
          break
        case "type":
          key = item.type
          break
        case "student":
          key = item.studentName
          break
        case "date":
          key = item.date
          break
        default:
          key = "Egyéb"
      }

      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })

    return groups
  }, [groupBy, getFilteredData])

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
        <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200/50 dark:border-blue-800/50">
          <Collapsible open={!isSearchCollapsed} onOpenChange={(open) => setIsSearchCollapsed(!open)}>
            <CardHeader className="pb-4">
              <CollapsibleTrigger className="w-full cursor-pointer">
                <div className="flex items-center justify-between font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/50">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Keresés és szűrés</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Szűrd az igazolásokat és rendezd őket oszlopfejlécre kattintással
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {table.getFilteredRowModel().rows.length} találat
                    </Badge>
                    <ChevronDown className={`h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${isSearchCollapsed ? '' : 'rotate-180'}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-3 border-t border-blue-200 dark:border-blue-800 space-y-6">
            {/* Primary Search */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Keresés</Label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  placeholder="Diák neve alapján..."
                  value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("studentName")?.setFilterValue(event.target.value)
                  }
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Státusz</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Válassz státuszt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        Minden státusz
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Függőben
                      </div>
                    </SelectItem>
                    <SelectItem value="approved">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Jóváhagyva
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Elutasítva
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hiányzás típusa</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Válassz típust" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Minden típus</SelectItem>
                    <SelectItem value="studiós távollét">🎬 Studiós</SelectItem>
                    <SelectItem value="médiás távollét">📺 Médiás</SelectItem>
                    <SelectItem value="orvosi igazolás">🏥 Orvosi</SelectItem>
                    <SelectItem value="családi okok">👨‍👩‍👧‍👦 Családi</SelectItem>
                    <SelectItem value="közlekedés">🚇 Közlekedés</SelectItem>
                    <SelectItem value="egyéb">📝 Egyéb</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">FTV importált</Label>
                <Select value={filterFTV} onValueChange={setFilterFTV}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="FTV státusz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Mind</SelectItem>
                    <SelectItem value="ftv">
                      <div className="flex items-center gap-2">
                        <Clapperboard className="h-3 w-3 text-blue-600" />
                        Csak FTV
                      </div>
                    </SelectItem>
                    <SelectItem value="non-ftv">Csak manuális</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Csoportosítás</Label>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Csoportosítás" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nincs csoportosítás</SelectItem>
                    <SelectItem value="status">Státusz szerint</SelectItem>
                    <SelectItem value="type">Típus szerint</SelectItem>
                    <SelectItem value="student">Diák szerint</SelectItem>
                    <SelectItem value="date">Dátum szerint</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dátum tartomány</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Ettől</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Eddig</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filterStatus !== "all" || filterType !== "all" || filterFTV !== "all" || dateFrom || dateTo) && (
              <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktív szűrők:</span>
                {filterStatus !== "all" && (
                  <Badge variant="outline" className="gap-2 bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400">
                    Státusz: {filterStatus === "pending" ? "Függőben" : filterStatus === "approved" ? "Jóváhagyva" : "Elutasítva"}
                    <button 
                      onClick={() => setFilterStatus("all")} 
                      className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterType !== "all" && (
                  <Badge variant="outline" className="gap-2 bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400">
                    Típus: {filterType}
                    <button 
                      onClick={() => setFilterType("all")} 
                      className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filterFTV !== "all" && (
                  <Badge variant="outline" className="gap-2 bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400">
                    FTV: {filterFTV === "ftv" ? "Igen" : "Nem"}
                    <button 
                      onClick={() => setFilterFTV("all")} 
                      className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="outline" className="gap-2 bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400">
                    Ettől: {dateFrom}
                    <button 
                      onClick={() => setDateFrom("")} 
                      className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="outline" className="gap-2 bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400">
                    Eddig: {dateTo}
                    <button 
                      onClick={() => setDateTo("")} 
                      className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
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
                  className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
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
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/50 dark:to-orange-950/50 dark:border-amber-800/50">
          <CardContent className="p-4">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between font-medium hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Órarend színkódok magyarázata</span>
                </div>
                <svg
                  className="h-4 w-4 transition-transform group-open:rotate-180 text-amber-600 dark:text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-blue-500 text-white shadow-sm">0</span>
                    <span className="text-sm font-medium">Függőben / FTV importált</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-purple-500 text-white shadow-sm">0</span>
                    <span className="text-sm font-medium">Diák korrekció</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-green-500 text-white shadow-sm">0</span>
                    <span className="text-sm font-medium">Jóváhagyva</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-red-500 text-white shadow-sm">0</span>
                    <span className="text-sm font-medium">Elutasítva</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-gray-100 dark:bg-gray-800 text-gray-400 border">0</span>
                    <span className="text-sm font-medium">Nincs hiányzás</span>
                  </div>
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Table */}
        {groupBy === "none" ? (
          // Standard ungrouped table
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
                              <TableHead key={header.id} className="font-bold text-xs uppercase tracking-wide whitespace-nowrap">
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
                              className={`py-4 ${cell.column.id !== 'actions' ? 'cursor-pointer hover:bg-muted/30' : ''}`}
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
        ) : (
          // Grouped table view
          <div className="space-y-4">
            {groupedData && Object.entries(groupedData).length > 0 ? (
              Object.entries(groupedData).map(([groupKey, groupRows]) => (
                <Card key={groupKey}>
                  <CardHeader className="pb-2 bg-muted/30">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <span className="text-primary">{groupKey}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {groupRows.length} igazolás
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table className="min-w-full">
                          <TableHeader className="bg-muted/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                              <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                  return (
                                    <TableHead key={header.id} className="font-bold text-xs uppercase tracking-wide whitespace-nowrap">
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
                          {groupRows.map((rowData) => {
                            const row = table.getRowModel().rows.find(r => (r.original as IgazolasTableRow).id === rowData.id)
                            if (!row) return null
                            
                            return (
                              <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className="hover:bg-muted/50 transition-colors border-b"
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell 
                                    key={cell.id} 
                                    className={`py-4 ${cell.column.id !== 'actions' ? 'cursor-pointer hover:bg-muted/30' : ''}`}
                                    onClick={cell.column.id !== 'actions' ? () => handleRowClick(row.original) : undefined}
                                  >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-8 w-8" />
                    <p className="font-medium">Nincs találat</p>
                    <p className="text-sm">Próbálj más keresési feltételeket</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

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
          {groupBy === "none" && (
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
          )}
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
                          <p className="font-semibold text-base">{selectedRow.date}</p>
                        </div>
                      </div>

                        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Érintett órák</Label>
                          {getHoursDisplay(selectedRow)}
                        </div>

                        {selectedRow.fromFTV && (
                          <Alert className="border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                            <AlertTitle className="text-blue-900 dark:text-blue-400 text-lg inline-flex items-center gap-2 mb-2">
                              <Clapperboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              FTV Importált Adat
                              </AlertTitle>
                            <AlertDescription className="text-blue-800 dark:text-blue-400">
                              <p className="mb-2">Ez az igazolás a Forgatásszervezői Platformról került importálásra, és a médiatanár már igazolta a jelenlétet.</p>
                              {(selectedRow.minutesBefore || selectedRow.minutesAfter) && (
                                <div className="mt-3 p-3 rounded-md bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-500">
                                  <p className="font-semibold text-purple-900 dark:text-purple-300 mb-1">Diák korrekciója:</p>
                                  {(selectedRow.minutesBefore ?? 0) > 0 && (
                                    <p className="text-sm text-purple-800 dark:text-purple-400">• <span className="text-purple-900 dark:text-purple-300 font-bold">{selectedRow.minutesBefore}</span> perc a forgatás előtt</p>
                                  )}
                                  {(selectedRow.minutesAfter ?? 0) > 0 && (
                                    <p className="text-sm text-purple-800 dark:text-purple-400">• <span className="text-purple-900 dark:text-purple-300 font-bold">{selectedRow.minutesAfter}</span> perc a forgatás után</p>
                                  )}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                          {selectedRow.correctedHours && selectedRow.correctedHours.length > 0 ? (
                          <>
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Korrekció indoklása</Label>
                          <p className="text-sm leading-relaxed">{selectedRow.status || <span className="italic text-muted-foreground">Nincs megjegyzés</span>}</p>
                          </>
                          ) : !selectedRow.fromFTV ? (
                          <>
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Indoklás</Label>
                          <p className="text-sm leading-relaxed">{selectedRow.status || <span className="italic text-muted-foreground">Nincs megjegyzés</span>}</p>
                          </>
                          ) : null}
                        </div>

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
