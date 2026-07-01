// Utility functions for calculating impacted periods and bell schedule

export interface Period {
  start: string;
  end: string;
  name: string;
}

// Hungarian bell schedule (csengetési rend)
export const BELL_SCHEDULE: Period[] = [
  { start: "07:30", end: "08:15", name: "0. óra" },
  { start: "08:25", end: "09:10", name: "1. óra" },
  { start: "09:20", end: "10:05", name: "2. óra" },
  { start: "10:20", end: "11:05", name: "3. óra" },
  { start: "11:15", end: "12:00", name: "4. óra" },
  { start: "12:20", end: "13:05", name: "5. óra" },
  { start: "13:25", end: "14:10", name: "6. óra" },
  { start: "14:20", end: "15:05", name: "7. óra" },
  { start: "15:15", end: "16:00", name: "8. óra" },
];

/**
 * Calculate which periods are impacted between two datetime points
 * Based on the Python function: erintett_tanorak
 */
export function getImpactedPeriods(start: Date, end: Date): number[] {
  const impacted: number[] = [];
  
  BELL_SCHEDULE.forEach((period, index) => {
    // Parse period times for the same date as start
    const [startHour, startMin] = period.start.split(':').map(Number);
    const [endHour, endMin] = period.end.split(':').map(Number);
    
    const periodStart = new Date(start);
    periodStart.setHours(startHour, startMin, 0, 0);
    
    const periodEnd = new Date(start);
    periodEnd.setHours(endHour, endMin, 0, 0);
    
    // Check if the absence period overlaps with this school period
    // Logic: start < periodEnd && end > periodStart
    if (start < periodEnd && end > periodStart) {
      impacted.push(index);
    }
  });
  
  return impacted;
}

/**
 * Calculate corrected periods based on diak_extra_ido_elotte and diak_extra_ido_utana
 * These are the purple periods that need teacher approval
 */
export function getCorrectedPeriods(
  originalPeriods: number[],
  minutesBefore: number,
  minutesAfter: number
): number[] {
  const corrected: number[] = [];
  
  if (originalPeriods.length === 0) return corrected;
  
  // If student added time before (at least 45 minutes = 1 school period)
  if (minutesBefore >= 45) {
    const firstPeriod = Math.min(...originalPeriods);
    if (firstPeriod > 0) {
      corrected.push(firstPeriod - 1);
    }
  }
  
  // If student added time after (at least 45 minutes = 1 school period)
  if (minutesAfter >= 45) {
    const lastPeriod = Math.max(...originalPeriods);
    if (lastPeriod < 8) {
      corrected.push(lastPeriod + 1);
    }
  }
  
  return corrected;
}

/**
 * Get formatted bell schedule for a specific period
 */
export function getPeriodSchedule(periodIndex: number): string {
  if (periodIndex < 0 || periodIndex >= BELL_SCHEDULE.length) {
    return "Érvénytelen óra";
  }
  
  const period = BELL_SCHEDULE[periodIndex];
  return `${period.name}: ${period.start} - ${period.end}`;
}

/**
 * Calculate impacted periods from a list of sub-intervals (reszletes_idopontok).
 * Returns the sorted union of periods impacted by any of the intervals.
 */
export function getImpactedPeriodsFromIntervals(
  intervals: Array<{ eleje: string; vege: string }>
): number[] {
  const impacted = new Set<number>();
  intervals.forEach(({ eleje, vege }) => {
    const s = new Date(eleje);
    const e = new Date(vege);
    getImpactedPeriods(s, e).forEach((p) => impacted.add(p));
  });
  return Array.from(impacted).sort((a, b) => a - b);
}

/**
 * Group a set of selected period indices into consecutive runs.
 * Example: [0, 2, 3, 4, 6] → [[0], [2, 3, 4], [6]]
 */
export function groupConsecutivePeriods(periods: number[]): number[][] {
  if (periods.length === 0) return [];
  const sorted = [...new Set(periods)].sort((a, b) => a - b);
  const runs: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      runs[runs.length - 1].push(sorted[i]);
    } else {
      runs.push([sorted[i]]);
    }
  }
  return runs;
}

/**
 * Convert a list of selected period indices for a given date into
 * `reszletes_idopontok` (an array of {eleje, vege} datetime strings).
 *
 * - If the selection is empty or forms a single consecutive run, returns
 *   `null` (the outer eleje/vege already fully describes the absence).
 * - Otherwise, returns one interval per consecutive run.
 *
 * Datetimes are emitted in the same "YYYY-MM-DDTHH:mm" local form used
 * elsewhere in the form so the backend receives values consistent with the
 * outer `eleje`/`vege`.
 */
export function buildReszletesIdopontok(
  dateStr: string,
  periods: number[]
): Array<{ eleje: string; vege: string }> | null {
  const runs = groupConsecutivePeriods(periods);
  if (runs.length <= 1) return null;
  return runs.map((run) => {
    const first = BELL_SCHEDULE[run[0]];
    const last = BELL_SCHEDULE[run[run.length - 1]];
    return {
      eleje: `${dateStr}T${first.start}`,
      vege: `${dateStr}T${last.end}`,
    };
  });
}

/**
 * Enhanced function to map API response to periods using the corrected logic
 */
export function mapApiResponseToPeriods(
  startTime: string,
  endTime: string,
  minutesBefore?: number | null,
  minutesAfter?: number | null,
  reszletesIdopontok?: Array<{ eleje: string; vege: string }> | null
): { originalPeriods: number[]; correctedPeriods: number[] } {
  // If detailed sub-intervals are provided, use them to compute the impacted
  // periods so any "gap" periods (e.g. period 2 between 1 and 3) remain gray.
  const originalPeriods =
    reszletesIdopontok && reszletesIdopontok.length > 0
      ? getImpactedPeriodsFromIntervals(reszletesIdopontok)
      : getImpactedPeriods(new Date(startTime), new Date(endTime));

  // Calculate corrected periods based on student's extra time
  const correctedPeriods = getCorrectedPeriods(
    originalPeriods,
    minutesBefore || 0,
    minutesAfter || 0
  );

  return { originalPeriods, correctedPeriods };
}