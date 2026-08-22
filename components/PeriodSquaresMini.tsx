import type { IgazolasAllapot } from '@/lib/types'
import { getDateRange, isMultiDayAbsence } from '@/app/dashboard/types'

const PERIODS = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const MAX_VISIBLE_DAYS = 6

interface PeriodSquaresMiniProps {
  hours: number[]
  correctedHours?: number[]
  fromFTV?: boolean
  allapot: IgazolasAllapot
  /** ISO start/end - when present and spanning multiple calendar days, a
   * compact day strip is rendered instead of the single-day period grid
   * (a multi-day absence would otherwise show every period as "active"). */
  startDate?: string
  endDate?: string
  className?: string
}

// High-contrast, glowing square used for an "active" period/day - colour
// depends on the record's status (student correction / FTV-imported hours
// take priority over the plain status colour).
function getActiveStyle(allapot: IgazolasAllapot, isCorrection: boolean, isFTV: boolean): string {
  if (isCorrection) {
    if (allapot === 'Elfogadva') return 'bg-green-500 text-white ring-1 ring-green-300/50 shadow-[0_0_6px_1px_rgba(34,197,94,0.6)]'
    if (allapot === 'Elutasítva') return 'bg-red-500 text-white ring-1 ring-red-300/50 shadow-[0_0_6px_1px_rgba(239,68,68,0.6)]'
    return 'bg-purple-500 text-white ring-1 ring-purple-300/50 shadow-[0_0_6px_1px_rgba(168,85,247,0.6)]'
  }
  if (isFTV) {
    if (allapot === 'Elfogadva') return 'bg-green-500 text-white ring-1 ring-green-300/50 shadow-[0_0_6px_1px_rgba(34,197,94,0.6)]'
    if (allapot === 'Elutasítva') return 'bg-red-500 text-white ring-1 ring-red-300/50 shadow-[0_0_6px_1px_rgba(239,68,68,0.6)]'
    return 'bg-blue-500 text-white ring-1 ring-blue-300/50 shadow-[0_0_6px_1px_rgba(59,130,246,0.6)]'
  }
  if (allapot === 'Elfogadva') return 'bg-green-500 text-white ring-1 ring-green-300/50 shadow-[0_0_6px_1px_rgba(34,197,94,0.6)]'
  if (allapot === 'Elutasítva') return 'bg-red-500 text-white ring-1 ring-red-300/50 shadow-[0_0_6px_1px_rgba(239,68,68,0.6)]'
  if (allapot === 'Hiánypótlásra visszaküldve') return 'bg-orange-500 text-white ring-1 ring-orange-300/50 shadow-[0_0_6px_1px_rgba(249,115,22,0.6)]'
  return 'bg-blue-500 text-white ring-1 ring-blue-300/50 shadow-[0_0_6px_1px_rgba(59,130,246,0.6)]' // Függőben
}

// Dark, low-contrast square used for an inactive period/day slot.
const INACTIVE_STYLE = 'bg-neutral-950 text-neutral-700 border border-neutral-800/80'

/**
 * Compact read-only period/day grid for card/list rows. For single-day
 * igazolások it shows the 0-8 period grid; for multi-day igazolások (where
 * every period would otherwise appear "active") it shows a compact strip of
 * the affected calendar days instead.
 */
export function PeriodSquaresMini({
  hours,
  correctedHours = [],
  fromFTV = false,
  allapot,
  startDate,
  endDate,
  className = '',
}: PeriodSquaresMiniProps) {
  if (startDate && endDate && isMultiDayAbsence(startDate, endDate)) {
    const days = getDateRange(startDate, endDate)
    const visibleDays = days.slice(0, MAX_VISIBLE_DAYS)
    const extraCount = days.length - visibleDays.length
    const activeStyle = getActiveStyle(allapot, false, false)

    return (
      <div className={`flex items-center gap-0.5 ${className}`} aria-label="Érintett napok">
        {visibleDays.map((day, i) => (
          <span
            key={i}
            title={day.toLocaleDateString('hu-HU')}
            className={`inline-flex items-center justify-center w-4 h-4 rounded-[4px] text-[9px] font-bold leading-none shrink-0 ${activeStyle}`}
          >
            {day.getDate()}
          </span>
        ))}
        {extraCount > 0 && (
          <span className="inline-flex items-center justify-center h-4 px-1 rounded-[4px] text-[9px] font-bold leading-none shrink-0 bg-neutral-800 text-neutral-400 border border-neutral-700/60">
            +{extraCount}
          </span>
        )}
      </div>
    )
  }

  if (!hours || hours.length === 0) return null

  return (
    <div className={`flex gap-0.5 ${className}`} aria-label="Érintett órák">
      {PERIODS.map((h) => {
        const isCorrectionHour = correctedHours.includes(h)
        const isFTVHour = fromFTV && hours.includes(h)
        const isRegularHour = !fromFTV && hours.includes(h)
        const isActive = isCorrectionHour || isFTVHour || isRegularHour

        return (
          <span
            key={h}
            title={`${h}. óra`}
            className={`inline-flex items-center justify-center w-4 h-4 rounded-[4px] text-[9px] font-bold leading-none shrink-0 ${
              isActive ? getActiveStyle(allapot, isCorrectionHour, isFTVHour) : INACTIVE_STYLE
            }`}
          >
            {isActive ? h : ''}
          </span>
        )
      })}
    </div>
  )
}
