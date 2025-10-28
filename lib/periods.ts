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
 * Enhanced function to map API response to periods using the corrected logic
 */
export function mapApiResponseToPeriods(
  startTime: string,
  endTime: string,
  minutesBefore?: number | null,
  minutesAfter?: number | null
): { originalPeriods: number[]; correctedPeriods: number[] } {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Get the original impacted periods based on start/end times
  const originalPeriods = getImpactedPeriods(start, end);
  
  // Calculate corrected periods based on student's extra time
  const correctedPeriods = getCorrectedPeriods(
    originalPeriods,
    minutesBefore || 0,
    minutesAfter || 0
  );
  
  return { originalPeriods, correctedPeriods };
}