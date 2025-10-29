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
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ChevronDown,
  X,
  RotateCcw
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IgazolasTableRow } from "@/app/dashboard/types"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [filterType, setFilterType] = React.useState<string>("all")
  const [dateFrom, setDateFrom] = React.useState<string>("")
  const [dateTo, setDateTo] = React.useState<string>("")
  const [isSearchCollapsed, setIsSearchCollapsed] = React.useState(true)

  // Get filtered data based on all filters
  const getFilteredData = React.useMemo(() => {
    const igazolasokData = data as unknown as IgazolasTableRow[]
    let filtered = [...igazolasokData]

    // Apply search filter from column filters
    const nameFilter = columnFilters.find(f => f.id === "date")
    const searchValue = nameFilter?.value as string
    if (searchValue) {
      filtered = filtered.filter((item) =>
        item.date.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.type.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.allapot.toLowerCase().includes(searchValue.toLowerCase())
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
  }, [data, filterStatus, filterType, columnFilters, dateFrom, dateTo])

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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
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
                    placeholder="Keresés dátum, típus, indoklás vagy státusz alapján..."
                    value={(table.getColumn("date")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      table.getColumn("date")?.setFilterValue(event.target.value)
                    }
                    className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              {(filterStatus !== "all" || filterType !== "all" || dateFrom || dateTo) && (
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

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
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
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredRowModel().rows.length} igazolás összesen
        </div>
        <div className="flex items-center space-x-2">
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
          <div className="text-sm">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
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
  )
}
