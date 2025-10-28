"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IgazolasTableRow, getIgazolasType } from "@/app/dashboard/types"

export const studentColumns: ColumnDef<IgazolasTableRow>[] = [
  {
    accessorKey: "type",
    header: "Hiányzás oka",
    cell: ({ row }) => {
      const typeInfo = getIgazolasType(row.getValue("type") as string)
      return (
        <div className="max-w-[140px]">
          <Badge 
            variant="outline" 
            className={`${typeInfo.color} inline-flex items-center gap-1.5 font-medium text-xs`}
          >
            <span className="text-xs">{typeInfo.emoji}</span>
            {typeInfo.name}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: "Dátum",
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("date")}</div>,
  },
  {
    accessorKey: "hours",
    header: "Órák",
    cell: ({ row }) => {
      const hours = row.original.hours
      const allapot = row.original.allapot
      const fromFTV = row.original.fromFTV || false
      const minutesBefore = row.original.minutesBefore || 0
      const minutesAfter = row.original.minutesAfter || 0
      
      // Calculate which hours are affected by FTV corrections
      const ftvCorrectionHours: number[] = []
      if (fromFTV && (minutesBefore > 0 || minutesAfter > 0)) {
        if (minutesBefore >= 45 && hours.length > 0) {
          const firstHour = Math.min(...hours)
          if (firstHour > 0) ftvCorrectionHours.push(firstHour - 1)
        }
        if (minutesAfter >= 45 && hours.length > 0) {
          const lastHour = Math.max(...hours)
          if (lastHour < 8) ftvCorrectionHours.push(lastHour + 1)
        }
      }
      
      return (
        <div className="flex gap-1 flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => {
            const isImpacted = hours.includes(h)
            const isFTVCorrection = ftvCorrectionHours.includes(h)
            
            let bgColor = "bg-gray-200 dark:bg-gray-700 text-gray-400"
            
            if (isFTVCorrection) {
              bgColor = "bg-purple-500 text-white"
            } else if (isImpacted) {
              if (allapot === 'Függőben') {
                bgColor = "bg-blue-500 text-white"
              } else if (allapot === 'Elfogadva') {
                bgColor = "bg-green-500 text-white"
              } else if (allapot === 'Elutasítva') {
                bgColor = "bg-red-500 text-white"
              }
            }
            
            return (
              <span
                key={h}
                className={`inline-flex items-center justify-center w-7 h-7 text-xs font-medium rounded ${bgColor}`}
              >
                {h}
              </span>
            )
          })}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Megjegyzéseim",
    cell: ({ row }) => (
      <div className="max-w-[180px] truncate text-sm">{row.getValue("status")}</div>
    ),
  },
  {
    accessorKey: "imageUrl",
    header: "Melléklet",
    cell: ({ row }) => {
      const imageUrl = row.getValue("imageUrl") as string
      return imageUrl ? (
        <Button variant="ghost" size="sm" className="h-7 px-2">
          kép
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )
    },
  },
  {
    id: "status",
    header: "Státusz",
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
  },
  {
    accessorKey: "submittedAt",
    header: "Beküldve",
    cell: ({ row }) => {
      const date = new Date(row.getValue("submittedAt"))
      return <div className="text-xs text-muted-foreground">{date.toLocaleDateString('hu-HU')}</div>
    },
  },
]
