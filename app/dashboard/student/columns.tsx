"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { IgazolasTableRow, getIgazolasType } from "@/app/dashboard/types"
import { Calendar, ArrowUpDown, ArrowUp, ArrowDown, Clapperboard, FileText } from "lucide-react"
import { getPeriodSchedule } from "@/lib/periods"

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

export const studentColumns: ColumnDef<IgazolasTableRow>[] = [
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
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 text-xs dark:border-blue-500">
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
    cell: ({ row }) => (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{row.getValue("date")}</span>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "hours",
    header: "Órarend",
    size: 400,
    cell: ({ row }) => {
      const hours = row.original.hours
      const correctedHours = row.original.correctedHours || []
      const allapot = row.original.allapot
      const fromFTV = row.original.fromFTV || false
      
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
    accessorKey: "reason",
    header: "Indoklás",
    cell: ({ row }) => {
      const reason = row.getValue("reason") as string
      const imageUrl = row.original.imageUrl || row.original.imgDriveURL
      
      const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (imageUrl) {
          window.open(imageUrl, '_blank', 'noopener,noreferrer')
        }
      }
      
      return (
        <div className="flex flex-col gap-2">
          <span className="text-sm">{reason}</span>
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
        </div>
      )
    },
  },
  {
    id: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wide"
        >
          Státusz
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
    accessorFn: (row) => row.allapot,
    cell: ({ row }) => {
      const allapot = row.original.allapot
      
      if (allapot === 'Függőben') {
        return (
          <Badge variant="pending">
            Függőben
          </Badge>
        )
      } else if (allapot === 'Elfogadva') {
        return (
          <Badge variant="approved">
            Elfogadva
          </Badge>
        )
      } else if (allapot === 'Elutasítva') {
        return (
          <Badge variant="rejected">
            Elutasítva
          </Badge>
        )
      }
      
      return (
        <Badge variant="secondary">
          Ismeretlen
        </Badge>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: "submittedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 hover:bg-transparent font-bold text-xs uppercase tracking-wide"
        >
          Beküldve
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
      const date = new Date(row.getValue("submittedAt"))
      return <div className="text-xs text-muted-foreground">{date.toLocaleDateString('hu-HU')}</div>
    },
    enableSorting: true,
  },
]
