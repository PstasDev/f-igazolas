"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Igazolas, getIgazolasType } from "@/app/dashboard/mockData"
import { Calendar, FileText, Video, Check, X, Clock } from "lucide-react"

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

export const columns: ColumnDef<Igazolas>[] = [
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
    header: "Diák",
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
  },
  {
    accessorKey: "type",
    header: "Hiányzás típusa",
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
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 text-xs">
                <Video className="h-3 w-3 mr-1" />
                FTV
              </Badge>
              {hasCorrection && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  +Korrekció
                </Badge>
              )}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: "Dátum",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{row.getValue("date")}</span>
      </div>
    ),
  },
  {
    accessorKey: "hours",
    header: "Órarend",
    cell: ({ row }) => {
      const hours = row.original.hours
      const approved = row.original.approved
      const fromFTV = row.original.fromFTV || false
      const minutesBefore = row.original.minutesBefore || 0
      const minutesAfter = row.original.minutesAfter || 0
      
      // Calculate student correction hours (purple - unverified by teacher)
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
          <div className="flex gap-1 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => {
              const isFTVHour = fromFTV && hours.includes(h) // Media teacher verified
              const isCorrectionHour = correctionHours.includes(h) // Student correction
              const isRegularHour = !fromFTV && hours.includes(h) // Regular submission
              
              let bgColor = "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
              let tooltipText = "Nincs hiányzás"
              
              if (isCorrectionHour) {
                // Purple: Student correction (unverified by class teacher)
                if (approved === true) {
                  bgColor = "bg-green-500 hover:bg-green-600 text-white shadow-sm" // Approved by class teacher
                  tooltipText = "Diák korrekció - Osztályfőnök jóváhagyta"
                } else {
                  bgColor = "bg-purple-500 hover:bg-purple-600 text-white shadow-sm" // Waiting for class teacher approval
                  tooltipText = "Diák korrekció - Osztályfőnöki jóváhagyásra vár"
                }
              } else if (isFTVHour) {
                // Blue: Media teacher verified, waiting for class teacher approval
                if (approved === true) {
                  bgColor = "bg-green-500 hover:bg-green-600 text-white shadow-sm" // Approved by class teacher
                  tooltipText = "FTV importált - Osztályfőnök jóváhagyta"
                } else if (approved === false) {
                  bgColor = "bg-red-500 hover:bg-red-600 text-white shadow-sm" // Rejected by class teacher
                  tooltipText = "FTV importált - Osztályfőnök elutasította"
                } else {
                  bgColor = "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" // Verified by media teacher, pending class teacher
                  tooltipText = "FTV importált - Médiatanár igazolta, osztályfőnöki jóváhagyásra vár"
                }
              } else if (isRegularHour) {
                // Regular submission - follows normal approval flow
                if (approved === null) {
                  bgColor = "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" // Pending - BLUE not yellow
                  tooltipText = "Ellenőrzésre vár"
                } else if (approved === true) {
                  bgColor = "bg-green-500 hover:bg-green-600 text-white shadow-sm" // Approved
                  tooltipText = "Jóváhagyva"
                } else {
                  bgColor = "bg-red-500 hover:bg-red-600 text-white shadow-sm" // Rejected
                  tooltipText = "Elutasítva"
                }
              }
              
              const isActive = isFTVHour || isCorrectionHour || isRegularHour
              
              return (
                <Tooltip key={h}>
                  <TooltipTrigger asChild>
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 text-xs font-semibold rounded-md transition-all cursor-help ${bgColor} ${isActive ? 'ring-1 ring-offset-1 ring-gray-200 dark:ring-gray-700' : ''}`}
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
    },
  },
  {
    accessorKey: "status",
    header: "Indoklás",
    cell: ({ row }) => {
      const reason = row.getValue("status") as string
      const imageUrl = row.original.imageUrl
      
      return (
        <div className="flex flex-col gap-2">
          <span className="text-sm">{reason}</span>
          {imageUrl && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 w-fit">
              <GoogleDriveIcon className="h-3 w-3 mr-1" />
              Kép csatolva
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Műveletek",
    cell: ({ row }) => {
      const approved = row.original.approved
      
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={approved === true ? "default" : "outline"}
            className={approved === true ? "bg-green-600 hover:bg-green-700 text-white" : "hover:bg-green-50"}
            onClick={(e) => {
              e.stopPropagation()
              console.log("Approve", row.original.id)
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={approved === false ? "destructive" : "outline"}
            className={approved === false ? "" : "hover:bg-red-50"}
            onClick={(e) => {
              e.stopPropagation()
              console.log("Reject", row.original.id)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={approved === null ? "default" : "outline"}
            className={approved === null ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-blue-50"}
            onClick={(e) => {
              e.stopPropagation()
              console.log("Set to pending", row.original.id)
            }}
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]

export { GoogleDriveIcon }
