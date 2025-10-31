"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { IgazolasTableRow, getIgazolasType, isMultiDayAbsence, buildCalendarGrid, getDayOfWeekShort } from "@/app/dashboard/types"
import { BKKVerificationBadge } from "@/components/ui/BKKVerificationBadge"
import { Calendar, FileText, ArrowUpDown, ArrowUp, ArrowDown, Clapperboard } from "lucide-react"
import { QuickActionButtons } from "./components/QuickActionButtons"
import { getPeriodSchedule } from "@/lib/periods"

interface ActionHandlers {
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSetPending?: (id: string) => void;
}

// Google Drive SVG Icon Component
const GoogleDriveIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
)

export const createColumns = (actionHandlers?: ActionHandlers): ColumnDef<IgazolasTableRow>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "studentName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wide"
        >
          Diák
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("studentName") as string
      const studentClass = row.original.studentClass
      
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{name}</span>
          <span className="text-xs text-muted-foreground">{studentClass}</span>
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wide"
        >
          Hiányzás típusa
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      const fromFTV = row.original.fromFTV || false
      const hasCorrection = (row.original.minutesBefore ?? 0) > 0 || (row.original.minutesAfter ?? 0) > 0
      
      // Get type configuration with emoji and color
      const typeConfig = getIgazolasType(type)
      
      return (
        <div className="flex flex-col gap-1.5">
          <Badge variant="outline" className={typeConfig.color}>
            <span className="mr-1.5">{typeConfig.emoji}</span>
            {typeConfig.name}
          </Badge>
          {fromFTV && (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 text-xs dark:border-purple-500">
                <Clapperboard className="h-3 w-3 mr-1" />
                FTV
              </Badge>
              {hasCorrection && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:border-purple-500 dark:text-purple-400 text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  +Korrekció
                </Badge>
              )}
            </div>
          )}
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wide"
        >
          Dátum
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      )
    },
    cell: ({ row }) => {
      const isMultiDay = isMultiDayAbsence(row.original.startDate, row.original.endDate);
      
      if (isMultiDay) {
        const startDate = new Date(row.original.startDate);
        const endDate = new Date(row.original.endDate);
        return (
          <div className="flex flex-col gap-1 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">
                {startDate.toLocaleDateString('hu-HU')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs">→</span>
              <span className="text-xs">
                {endDate.toLocaleDateString('hu-HU')}
              </span>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{row.getValue("date")}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "hours",
    header: "Órarend",
    size: 400, // Reduced from 600 to prevent overflow
    cell: ({ row }) => {
      const hours = row.original.hours
      const correctedHours = row.original.correctedHours || []
      const allapot = row.original.allapot
      const fromFTV = row.original.fromFTV || false
      const isMultiDay = isMultiDayAbsence(row.original.startDate, row.original.endDate);
      
      // Multi-day display: show calendar grid with dates
      if (isMultiDay) {
        const calendarGrid = buildCalendarGrid(row.original.startDate, row.original.endDate);
        
        return (
          <TooltipProvider>
            <div className="flex flex-col gap-0.5 w-fit">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-0.5">
                {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => (
                  <div
                    key={dayIndex}
                    className="flex items-center justify-center text-[9px] font-semibold text-muted-foreground uppercase h-4 w-7"
                  >
                    {getDayOfWeekShort(dayIndex)}
                  </div>
                ))}
              </div>
              
              {/* Calendar weeks */}
              {calendarGrid.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-0.5">
                  {week.map((day, dayIndex) => {
                    let bgColor = "period-inactive";
                    let glowColor = "";
                    let tooltipText = `${day.date.toLocaleDateString('hu-HU', { weekday: 'long' })}\n${day.date.toLocaleDateString('hu-HU')}`;
                    
                    if (day.isInRange) {
                      if (allapot === 'Függőben') {
                        bgColor = "period-pending";
                        glowColor = "period-glow-blue";
                        tooltipText += "\nEllenőrzésre vár";
                      } else if (allapot === 'Elfogadva') {
                        bgColor = "period-approved";
                        glowColor = "period-glow-green";
                        tooltipText += "\nJóváhagyva";
                      } else if (allapot === 'Elutasítva') {
                        bgColor = "period-rejected";
                        glowColor = "period-glow-red";
                        tooltipText += "\nElutasítva";
                      }
                    } else {
                      tooltipText = `${day.date.toLocaleDateString('hu-HU', { weekday: 'long' })}\n${day.date.toLocaleDateString('hu-HU')}\nNem érintett`;
                    }
                    
                    return (
                      <Tooltip key={dayIndex}>
                        <TooltipTrigger asChild>
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 text-[10px] font-bold rounded-full cursor-help transition-all duration-300 ease-in-out transform ${bgColor} ${day.isInRange ? glowColor : ''} hover:scale-110`}
                          >
                            {day.dayOfMonth}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-600 dark:border-slate-400 font-medium text-xs whitespace-pre-line max-w-xs shadow-lg">
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        );
      }
      
      // Single day display: show period squares (existing logic)
      return (
        <TooltipProvider>
          <div className="flex gap-1 flex-nowrap min-w-[360px]">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => {
              const isFTVHour = fromFTV && hours.includes(h) // Media teacher verified
              const isCorrectionHour = correctedHours.includes(h) // Student correction
              const isRegularHour = !fromFTV && hours.includes(h) // Regular submission
              
              let bgColor = "period-inactive"
              let glowColor = ""
              let tooltipText = "Nincs hiányzás"
              
              if (isCorrectionHour) {
                // Purple: Student correction (unverified by class teacher)
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
                // Blue: Media teacher verified, waiting for class teacher approval
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
                  tooltipText = `FTV importált - Médiatanár igazolta, osztályfőnöki jóváhagyásra vár\n${getPeriodSchedule(h)}`
                }
              } else if (isRegularHour) {
                // Regular submission - follows normal approval flow
                if (allapot === 'Függőben') {
                  bgColor = "period-pending"
                  glowColor = "period-glow-blue"
                  tooltipText = `Ellenőrzésre vár\n${getPeriodSchedule(h)}`
                } else if (allapot === 'Elfogadva') {
                  bgColor = "period-approved"
                  glowColor = "period-glow-green"
                  tooltipText = `Jóváhagyva\n${getPeriodSchedule(h)}`
                } else if (allapot === 'Elutasítva') {
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
                      className={`inline-flex items-center justify-center w-7 h-7 text-xs font-semibold rounded-md cursor-help transform ${bgColor} ${isActive ? glowColor : ''} hover:scale-110`}
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
    },
  },
  {
    accessorKey: "status",
    header: "Indoklás",
    size: 300,
    minSize: 200,
    maxSize: 400,
    cell: ({ row }) => {
      const reason = row.getValue("status") as string
      const imageUrl = row.original.imageUrl || row.original.imgDriveURL
      const hasBKKVerification = row.original.bkk_verification
      
      const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (imageUrl) {
          window.open(imageUrl, '_blank', 'noopener,noreferrer')
        }
      }
      
      return (
        <div className="flex flex-col gap-2 max-w-sm">
          {!hasBKKVerification && (
            <span className="text-sm break-words whitespace-normal leading-relaxed">{reason}</span>
          )}
          <div className="flex flex-wrap gap-2">
            {imageUrl && (
              <Badge 
                variant="emerald" 
                className="w-fit cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                onClick={handleImageClick}
              >
                <GoogleDriveIcon className="h-3 w-3 mr-1" />
                Kép csatolva
              </Badge>
            )}
            <BKKVerificationBadge 
              bkkVerificationJson={row.original.bkk_verification}
              onClick={() => {
                // TODO: Show BKK verification details in a modal/dialog
                console.log('BKK verification clicked:', row.original.bkk_verification);
              }}
            />
          </div>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Műveletek",
    cell: ({ row }) => {
      const allapot = row.original.allapot
      
      return (
        <QuickActionButtons
          allapot={allapot}
          onApprove={() => actionHandlers?.onApprove?.(row.original.id)}
          onReject={() => actionHandlers?.onReject?.(row.original.id)}
          onSetPending={() => actionHandlers?.onSetPending?.(row.original.id)}
        />
      )
    },
  },
]

// Backward compatible export with no-op handlers
export const columns = createColumns()

export { GoogleDriveIcon }
