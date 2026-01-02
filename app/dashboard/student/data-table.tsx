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
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { BKKAlertVerificationCard } from "@/components/ui/BKKAlertVerificationCard"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ChevronDown,
  X,
  RotateCcw,
  Calendar,
  Clock,
  User,
  ExternalLink,
  Clapperboard
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { getIgazolasType, isMultiDayAbsence, buildCalendarGrid, getDayOfWeekShort } from "../types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { IgazolasTableRow } from "@/app/dashboard/types"
import { getPeriodSchedule } from "@/lib/periods"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  ftvSyncStatus?: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  ftvSyncStatus,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [filterType, setFilterType] = React.useState<string>("all")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")
  const [isSearchCollapsed, setIsSearchCollapsed] = React.useState(true)
  const [selectedRow, setSelectedRow] = React.useState<IgazolasTableRow | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState<string>("")
  const [igazolasTipusok, setIgazolasTipusok] = React.useState<string[]>([])

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
        const { apiClient } = await import('@/lib/api')
        const types = await apiClient.listIgazolasTipus()
        setIgazolasTipusok(types.map(t => t.nev))
      } catch (error) {
        console.error('Failed to fetch igazolas types:', error)
      }
    }
    fetchTypes()
  }, [])

  // Get filtered data based on all filters
  const getFilteredData = React.useMemo(() => {
    const igazolasokData = data as unknown as IgazolasTableRow[]
    let filtered = [...igazolasokData]

    // Apply search filter
    if (searchValue && searchValue.trim()) {
      const searchLower = searchValue.toLowerCase().trim()
      filtered = filtered.filter((item) =>
        item.date.toLowerCase().includes(searchLower) ||
        item.type.toLowerCase().includes(searchLower) ||
        item.status?.toLowerCase().includes(searchLower) ||
        item.reason?.toLowerCase().includes(searchLower) ||
        item.allapot.toLowerCase().includes(searchLower)
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

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((item) => {
        // Parse igazolás date range (normalize to date-only, ignore time)
        const igazolasStart = new Date(item.startDate);
        igazolasStart.setHours(0, 0, 0, 0);
        const igazolasEnd = new Date(item.endDate);
        igazolasEnd.setHours(0, 0, 0, 0);
        
        // Parse filter date range
        const filterStart = dateFrom ? new Date(dateFrom) : null;
        if (filterStart) filterStart.setHours(0, 0, 0, 0);
        
        const filterEnd = dateTo ? new Date(dateTo) : null;
        if (filterEnd) filterEnd.setHours(0, 0, 0, 0);
        
        // Check for overlap between the two date ranges
        // Two ranges overlap if: start1 <= end2 AND end1 >= start2
        
        if (filterStart && filterEnd) {
          // Both dates specified: check if ranges overlap
          return igazolasStart <= filterEnd && igazolasEnd >= filterStart;
        } else if (filterStart) {
          // Only "from" date specified: igazolás must end on or after filterStart
          return igazolasEnd >= filterStart;
        } else if (filterEnd) {
          // Only "to" date specified: igazolás must start on or before filterEnd
          return igazolasStart <= filterEnd;
        }
        
        return true;
      })
    }

    return filtered
  }, [data, filterStatus, filterType, searchValue, dateFrom, dateTo])

  // Helper function to display hours (visual period display like in table columns)
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
                tooltipText = `Diák korrekció - Jóváhagyva\n${getPeriodSchedule(h)}`
              } else if (allapot === 'Elutasítva') {
                bgColor = "period-rejected"
                glowColor = "period-glow-red"
                tooltipText = `Diák korrekció - Elutasítva\n${getPeriodSchedule(h)}`
              } else {
                bgColor = "period-correction"
                glowColor = "period-glow-yellow"
                tooltipText = `Diák korrekció - Jóváhagyásra vár\n${getPeriodSchedule(h)}`
              }
            } else if (isFTVHour) {
              if (allapot === 'Elfogadva') {
                bgColor = "period-approved"
                glowColor = "period-glow-green"
                tooltipText = `FTV importált - Jóváhagyva\n${getPeriodSchedule(h)}`
              } else if (allapot === 'Elutasítva') {
                bgColor = "period-rejected"
                glowColor = "period-glow-red"
                tooltipText = `FTV importált - Elutasítva\n${getPeriodSchedule(h)}`
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

  // Handle row click
  const handleRowClick = (row: TData) => {
    const igazolas = row as unknown as IgazolasTableRow
    setSelectedRow(igazolas)
    setIsOpen(true)
  }

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
    onPaginationChange: setPagination,
    autoResetPageIndex: false, // Prevent automatic page reset
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  })

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
            {/* Primary Search */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Keresés</Label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  placeholder="Keresés dátum, típus, indoklás vagy státusz alapján..."
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
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
            {(filterStatus !== "all" || filterType !== "all" || dateFrom || dateTo || searchValue) && (
              <div className="flex flex-wrap gap-2 items-center pt-4 border-t">
                <span className="text-sm font-medium text-muted-foreground">Aktív szűrők:</span>
                {searchValue && (
                  <Badge variant="outline" className="gap-2">
                    Keresés: {searchValue}
                    <button 
                      onClick={() => setSearchValue("")} 
                      className="ml-1 hover:bg-muted rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3 cursor-pointer" />
                    </button>
                  </Badge>
                )}
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
                    setDateFrom("")
                    setDateTo("")
                    setSearchValue("")
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

        {/* Legend */}
        <Card className="border">
          <CardContent className="p-4">
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between font-medium transition-colors">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
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
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-yellow-500 text-white shadow-sm">0</span>
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
                          className="hover:bg-muted/50 transition-colors border-b cursor-pointer"
                          onClick={() => handleRowClick(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-4 align-middle">
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

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground font-medium">
              Összesen {table.getFilteredRowModel().rows.length} igazolás
            </div>
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

      {/* Details Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl overflow-y-auto">
          {selectedRow && (
            <>
              <SheetHeader className="border-b pb-4 mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <SheetTitle className="text-2xl font-bold">Igazolás részletei</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                      {selectedRow.studentName} - {selectedRow.studentClass}
                    </SheetDescription>
                  </div>
                  {(() => {
                    const typeInfo = getIgazolasType(selectedRow.type)
                    return (
                      <Badge 
                        variant="outline" 
                        className={`${typeInfo.color} text-base px-3 py-1 whitespace-nowrap`}
                      >
                        <span className="mr-2">{typeInfo.emoji}</span>
                        {typeInfo.name}
                      </Badge>
                    )
                  })()}
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {/* Student Data Section */}
                    <Card className="border-2">
                      <CardHeader className="bg-muted/50 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Beküldött adatok</CardTitle>
                            <CardDescription className="text-xs">Az általad megadott információk</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Neved</Label>
                            <p className="font-semibold text-lg">{selectedRow.studentName}</p>
                          </div>
                          <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Osztályod</Label>
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
                                <AlertCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                <AlertTitle className="text-cyan-900 dark:text-cyan-300 font-semibold">Fontos információ</AlertTitle>
                                <AlertDescription className="text-cyan-800 dark:text-cyan-400 text-sm">
                                  Ez az igazolás közvetlenül a Forgatásszervezői Platformról került importálásra. 
                                  A médiatanár már visszaigazolta a jelenléted a forgatáson.
                                </AlertDescription>
                              </Alert>

                              {/* Student Correction Section - Only show if there are extra minutes */}
                              {((selectedRow.minutesBefore ?? 0) > 0 || (selectedRow.minutesAfter ?? 0) > 0) && (
                                <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-2 border-yellow-300 dark:border-yellow-600">
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="p-2 rounded-lg bg-yellow-600 dark:bg-yellow-500">
                                      <User className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-yellow-900 dark:text-yellow-200">Általad megadott extra időszak</p>
                                      <p className="text-xs text-yellow-700 dark:text-yellow-400">Osztályfőnöki jóváhagyásra vár</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {(selectedRow.minutesBefore ?? 0) > 0 && (
                                      <div className="flex items-center gap-3 p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-600 dark:bg-yellow-500 text-white font-bold text-lg">
                                          {selectedRow.minutesBefore}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">Forgatás előtt</p>
                                          <p className="text-xs text-yellow-700 dark:text-yellow-400">Utazási idő, előkészület</p>
                                        </div>
                                      </div>
                                    )}
                                    {(selectedRow.minutesAfter ?? 0) > 0 && (
                                      <div className="flex items-center gap-3 p-2 rounded-md bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-700">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-600 dark:bg-yellow-500 text-white font-bold text-lg">
                                          {selectedRow.minutesAfter}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">Forgatás után</p>
                                          <p className="text-xs text-yellow-700 dark:text-yellow-400">Hazautazás, lezárás</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-3 p-2 rounded bg-yellow-200/50 dark:bg-yellow-800/30">
                                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
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
                              <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                              </svg>
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
                                  <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                                    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                                    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                                    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                                    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                                    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                                    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                                  </svg>
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
                            {new Date(selectedRow.submittedAt).toLocaleString('hu-HU', {
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

                    {/* Teacher Note Section - if exists */}
                    {selectedRow.teacherNote && (
                      <Card className="border-2 border-primary/20">
                        <CardHeader className="bg-primary/5 pb-4">
                          <CardTitle className="text-lg">Osztályfőnök megjegyzése</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <p className="text-sm leading-relaxed">{selectedRow.teacherNote}</p>
                        </CardContent>
                      </Card>
                    )}
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
