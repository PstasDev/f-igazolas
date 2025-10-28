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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  FileText, 
  User, 
  Video,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Info,
  RotateCcw,
  CheckCheck,
  XCircle
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onDataChange?: () => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDataChange,
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
  const [filterCorrection, setFilterCorrection] = React.useState<string>("all")
  const [groupBy, setGroupBy] = React.useState<string>("none")

  const table = useReactTable({
    data,
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
      onDataChange?.()
    } catch (error) {
      console.error('Failed to approve igazolás:', error)
      toast.error('Hiba történt az igazolás jóváhagyásakor')
    }
  }

  const handleReject = async () => {
    if (!selectedRow) return
    
    try {
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
      onDataChange?.()
    } catch (error) {
      console.error('Failed to reject igazolás:', error)
      toast.error('Hiba történt az igazolás elutasításakor')
    }
  }

  const handleResetToPending = () => {
    console.log('Reset to Pending:', selectedRow?.id)
    // TODO: Implement actual API call to reset status to pending
    toast.info('Függőben státusz funkció hamarosan elérhető')
    setIsSheetOpen(false)
  }

  const handleBulkApprove = async () => {
    try {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const ids = selectedRows.map(row => parseInt((row.original as unknown as IgazolasTableRow).id))
      
      if (ids.length === 0) {
        toast.error('Nincs kiválasztott igazolás')
        return
      }

      await apiClient.bulkQuickActionIgazolas({ action: 'Elfogadva', ids })
      toast.success(`${ids.length} igazolás jóváhagyva`)
      setRowSelection({})
      onDataChange?.()
    } catch (error) {
      console.error('Failed to bulk approve:', error)
      toast.error('Hiba történt a tömeges jóváhagyás során')
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

      await apiClient.bulkQuickActionIgazolas({ action: 'Elutasítva', ids })
      toast.success(`${ids.length} igazolás elutasítva`)
      setRowSelection({})
      onDataChange?.()
    } catch (error) {
      console.error('Failed to bulk reject:', error)
      toast.error('Hiba történt a tömeges elutasítás során')
    }
  }

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length

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
        if (filterFTV === "regular") return !item.fromFTV
        return true
      })
    }

    // Correction filter
    if (filterCorrection !== "all") {
      filtered = filtered.filter((item) => {
        const hasCorrection = (item.minutesBefore ?? 0) > 0 || (item.minutesAfter ?? 0) > 0
        if (filterCorrection === "with") return hasCorrection
        if (filterCorrection === "without") return !hasCorrection
        return true
      })
    }

    return filtered
  }, [data, filterStatus, filterType, filterFTV, filterCorrection, columnFilters])

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
    const allapot = igazolas.allapot
    const fromFTV = igazolas.fromFTV || false
    const minutesBefore = igazolas.minutesBefore || 0
    const minutesAfter = igazolas.minutesAfter || 0
    
    const correctionHours: number[] = []
    if (fromFTV && (minutesBefore > 0 || minutesAfter > 0)) {
      if (minutesBefore >= 45 && hours.length > 0) {
        const firstHour = Math.min(...hours)
        if (firstHour > 0) correctionHours.push(firstHour - 1)
      }
      if (minutesAfter >= 45 && hours.length > 0) {
        const lastHour = Math.max(...hours)
        if (lastHour < 8) correctionHours.push(lastHour + 1)
      }
    }
    
    return (
      <TooltipProvider>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => {
            const isFTVHour = fromFTV && hours.includes(h)
            const isCorrectionHour = correctionHours.includes(h)
            const isRegularHour = !fromFTV && hours.includes(h)
            
            let bgColor = "bg-gray-100 dark:bg-gray-800 text-gray-400"
            let tooltipText = "Nincs hiányzás"
            
            if (isCorrectionHour) {
              if (allapot === 'Elfogadva') {
                bgColor = "bg-green-500 text-white shadow-md"
                tooltipText = "Diák korrekció - Osztályfőnök jóváhagyta"
              } else {
                bgColor = "bg-purple-500 text-white shadow-md"
                tooltipText = "Diák korrekció - Osztályfőnöki jóváhagyásra vár"
              }
            } else if (isFTVHour) {
              if (allapot === 'Elfogadva') {
                bgColor = "bg-green-500 text-white shadow-md"
                tooltipText = "FTV importált - Osztályfőnök jóváhagyta"
              } else if (allapot === 'Elutasítva') {
                bgColor = "bg-red-500 text-white shadow-md"
                tooltipText = "FTV importált - Osztályfőnök elutasította"
              } else {
                bgColor = "bg-blue-500 text-white shadow-md"
                tooltipText = "FTV importált - Médiatanár igazolta"
              }
            } else if (isRegularHour) {
              if (allapot === 'Függőben') {
                bgColor = "bg-blue-500 text-white shadow-md" // Blue for pending
                tooltipText = "Ellenőrzésre vár"
              } else if (allapot === 'Elfogadva') {
                bgColor = "bg-green-500 text-white shadow-md"
                tooltipText = "Jóváhagyva"
              } else {
                bgColor = "bg-red-500 text-white shadow-md"
                tooltipText = "Elutasítva"
              }
            }
            
            const isActive = isFTVHour || isCorrectionHour || isRegularHour
            
            return (
              <Tooltip key={h}>
                <TooltipTrigger asChild>
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-lg transition-all ${bgColor} ${isActive ? 'ring-2 ring-offset-2 ring-gray-200 dark:ring-gray-600' : ''}`}
                  >
                    {h}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">{h}. óra: {tooltipText}</p>
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Szűrők és csoportosítás</CardTitle>
            <CardDescription>Keress, szűrj és csoportosítsd az igazolásokat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Primary Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="🔍 Keresés diák neve alapján..."
                value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("studentName")?.setFilterValue(event.target.value)
                }
                className="flex-1"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Státusz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden státusz</SelectItem>
                  <SelectItem value="pending">Függőben</SelectItem>
                  <SelectItem value="approved">Jóváhagyva</SelectItem>
                  <SelectItem value="rejected">Elutasítva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Hiányzás típusa" />
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

              <Select value={filterFTV} onValueChange={setFilterFTV}>
                <SelectTrigger>
                  <SelectValue placeholder="FTV státusz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">FTV és nem FTV</SelectItem>
                  <SelectItem value="ftv">Csak FTV importált</SelectItem>
                  <SelectItem value="non-ftv">Nem FTV</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCorrection} onValueChange={setFilterCorrection}>
                <SelectTrigger>
                  <SelectValue placeholder="Korrekció" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden</SelectItem>
                  <SelectItem value="with-correction">Korrekció van</SelectItem>
                  <SelectItem value="no-correction">Nincs korrekció</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grouping Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Csoportosítás</label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Csoportosítás módja" />
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

            {/* Active Filters Summary */}
            {(filterStatus !== "all" || filterType !== "all" || filterFTV !== "all" || filterCorrection !== "all") && (
              <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Aktív szűrők:</span>
                {filterStatus !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Státusz: {filterStatus === "pending" ? "Függőben" : filterStatus === "approved" ? "Jóváhagyva" : "Elutasítva"}
                    <button onClick={() => setFilterStatus("all")} className="ml-1 hover:bg-muted rounded-full">×</button>
                  </Badge>
                )}
                {filterType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Típus: {filterType}
                    <button onClick={() => setFilterType("all")} className="ml-1 hover:bg-muted rounded-full">×</button>
                  </Badge>
                )}
                {filterFTV !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    FTV: {filterFTV === "ftv" ? "Igen" : "Nem"}
                    <button onClick={() => setFilterFTV("all")} className="ml-1 hover:bg-muted rounded-full">×</button>
                  </Badge>
                )}
                {filterCorrection !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Korrekció: {filterCorrection === "with-correction" ? "Van" : "Nincs"}
                    <button onClick={() => setFilterCorrection("all")} className="ml-1 hover:bg-muted rounded-full">×</button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterStatus("all")
                    setFilterType("all")
                    setFilterFTV("all")
                    setFilterCorrection("all")
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Összes törlése
                </Button>
              </div>
            )}
          </CardContent>
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
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mind jóváhagy
                  </Button>
                  <Button
                    onClick={handleBulkReject}
                    size="sm"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Mind elutasít
                  </Button>
                  <Button
                    onClick={() => setRowSelection({})}
                    size="sm"
                    variant="outline"
                  >
                    Kijelölés törlése
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <details className="group rounded-lg border bg-card text-card-foreground shadow-sm">
          <summary className="flex cursor-pointer items-center justify-between p-4 font-medium hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span>Órarend színkódok</span>
            </div>
            <svg
              className="h-5 w-5 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-blue-500 text-white shadow-sm">0</span>
                <span className="text-xs">Függőben / FTV importált</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-purple-500 text-white shadow-sm">0</span>
                <span className="text-xs">Diák korrekció</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-green-500 text-white shadow-sm">0</span>
                <span className="text-xs">Jóváhagyva</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-red-500 text-white shadow-sm">0</span>
                <span className="text-xs">Elutasítva</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded bg-gray-100 dark:bg-gray-800 text-gray-400 border">0</span>
                <span className="text-xs">Nincs hiányzás</span>
              </div>
            </div>
          </div>
        </details>

        {/* Table */}
        {groupBy === "none" ? (
          // Standard ungrouped table
          <Card>
            <CardContent className="p-0">
              <div className="rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id} className="font-bold text-xs uppercase tracking-wide">
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
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-b"
                          onClick={() => handleRowClick(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="py-4">
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
                      <Table>
                        <TableHeader className="bg-muted/50">
                          {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                              {headerGroup.headers.map((header) => {
                                return (
                                  <TableHead key={header.id} className="font-bold text-xs uppercase tracking-wide">
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
                                className="cursor-pointer hover:bg-muted/50 transition-colors border-b"
                                onClick={() => handleRowClick(row.original)}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell key={cell.id} className="py-4">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
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

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground font-medium">
            Összesen {table.getFilteredRowModel().rows.length} igazolás
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
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400">
                      Függőben
                    </Badge>
                  )}
                  {selectedRow.allapot === 'Elfogadva' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400">
                      Elfogadva
                    </Badge>
                  )}
                  {selectedRow.allapot === 'Elutasítva' && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 shrink-0">
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
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30">
                            {selectedRow.type}
                          </Badge>
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
                          <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-900/20">
                            <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <AlertTitle className="text-blue-900 dark:text-blue-300">FTV Importált Adat</AlertTitle>
                            <AlertDescription className="text-blue-800 dark:text-blue-400">
                              <p className="mb-2">Ez az igazolás a Forgatásszervezői Platformról került importálásra, és a médiatanár már igazolta a jelenlétet.</p>
                              {(selectedRow.minutesBefore || selectedRow.minutesAfter) && (
                                <div className="mt-3 p-3 rounded-md bg-purple-100 dark:bg-purple-900/30 border border-purple-300">
                                  <p className="font-semibold text-purple-900 dark:text-purple-300 mb-1">Diák korrekciója:</p>
                                  {(selectedRow.minutesBefore ?? 0) > 0 && (
                                    <p className="text-sm text-purple-800 dark:text-purple-400">• {selectedRow.minutesBefore} perc a forgatás előtt</p>
                                  )}
                                  {(selectedRow.minutesAfter ?? 0) > 0 && (
                                    <p className="text-sm text-purple-800 dark:text-purple-400">• {selectedRow.minutesAfter} perc a forgatás után</p>
                                  )}
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2 p-4 rounded-lg bg-muted/30">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diák megjegyzése</Label>
                          <p className="text-sm leading-relaxed">{selectedRow.status}</p>
                        </div>

                        {selectedRow.imageUrl && (
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                              <GoogleDriveIcon className="h-3 w-3" />
                              Mellékelt kép (Google Drive)
                            </Label>
                            <Button variant="outline" size="lg" className="w-full h-auto py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-300">
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
                          <Clock className="h-3 w-3" />
                          Beküldés időpontja
                        </Label>
                        <p className="text-sm font-medium">
                          {new Date(selectedRow.submittedAt).toLocaleString('hu-HU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
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
                        <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-900/20">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <AlertTitle className="text-blue-900 dark:text-blue-300">Fontos információ</AlertTitle>
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
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 text-base px-4 py-2">
                                <Clock className="h-4 w-4 mr-2" />
                                Függőben - Döntésre vár
                              </Badge>
                            )}
                            {selectedRow.allapot === 'Elfogadva' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 text-base px-4 py-2">
                                <Check className="h-4 w-4 mr-2" />
                                Elfogadva
                              </Badge>
                            )}
                            {selectedRow.allapot === 'Elutasítva' && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 text-base px-4 py-2">
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
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              <Check className="h-5 w-5 mr-2" />
                              Jóváhagy
                            </Button>
                            <Button
                              onClick={handleReject}
                              size="lg"
                              variant="destructive"
                              className="font-semibold shadow-md hover:shadow-lg transition-all"
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
                              className="w-full font-semibold"
                              onClick={handleResetToPending}
                            >
                              <RotateCcw className="h-5 w-5 mr-2" />
                              Visszaállítás függőben státuszra
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              className="w-full font-semibold"
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
