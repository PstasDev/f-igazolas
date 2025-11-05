// Utility functions for calculating attendance requirements
// based on Tanév Rendje (School Year Schedule) system

import type { TanevRendje, OsztalySimple } from './types';

/**
 * Calculate if attendance is required for a specific date and class
 * 
 * Priority Order (Highest to Lowest):
 * 1. Class-Specific Override - Applies only to one class
 * 2. Global Override - Applies to all classes
 * 3. School Break - Attendance not required for all
 * 4. Default Rule - Weekday=required, Weekend=not required
 * 
 * @param date - ISO date string (YYYY-MM-DD)
 * @param studentClass - The student's class (optional for checking global rules only)
 * @param schedule - The Tanév Rendje schedule containing breaks and overrides
 * @returns true if attendance is required, false otherwise
 */
export function isAttendanceRequired(
  date: string,
  studentClass: OsztalySimple | null | undefined,
  schedule: TanevRendje
): boolean {
  const { tanitasi_szunetek, overrides } = schedule;

  // 1. Check class-specific override (highest priority)
  if (studentClass) {
    const classOverride = overrides.find(
      (o) => o.date === date && o.class_id === studentClass.id
    );
    if (classOverride !== undefined) {
      return classOverride.is_required;
    }
  }

  // 2. Check global override
  const globalOverride = overrides.find(
    (o) => o.date === date && o.class_id === null
  );
  if (globalOverride !== undefined) {
    return globalOverride.is_required;
  }

  // 3. Check school break
  const inBreak = tanitasi_szunetek.some(
    (szunet) => date >= szunet.from_date && date <= szunet.to_date
  );
  if (inBreak) {
    return false; // No attendance during breaks
  }

  // 4. Apply default rule
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri = required
}

/**
 * Check if a date range contains only non-attendance dates
 * Used to warn users when submitting igazolás for dates that don't require attendance
 * 
 * @param fromDate - ISO date string (YYYY-MM-DD)
 * @param toDate - ISO date string (YYYY-MM-DD)
 * @param studentClass - The student's class
 * @param schedule - The Tanév Rendje schedule containing breaks and overrides
 * @returns true if ALL dates in range are non-attendance dates
 */
export function isFullyNonAttendancePeriod(
  fromDate: string,
  toDate: string,
  studentClass: OsztalySimple | null | undefined,
  schedule: TanevRendje
): boolean {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  
  // Check each day in the range
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (isAttendanceRequired(dateStr, studentClass, schedule)) {
      return false; // Found at least one attendance-required date
    }
  }
  
  return true; // All dates are non-attendance dates
}

/**
 * Get a list of dates in a range that require attendance
 * 
 * @param fromDate - ISO date string (YYYY-MM-DD)
 * @param toDate - ISO date string (YYYY-MM-DD)
 * @param studentClass - The student's class
 * @param schedule - The Tanév Rendje schedule containing breaks and overrides
 * @returns Array of ISO date strings that require attendance
 */
export function getAttendanceRequiredDates(
  fromDate: string,
  toDate: string,
  studentClass: OsztalySimple | null | undefined,
  schedule: TanevRendje
): string[] {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const requiredDates: string[] = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (isAttendanceRequired(dateStr, studentClass, schedule)) {
      requiredDates.push(dateStr);
    }
  }
  
  return requiredDates;
}

/**
 * Get a human-readable reason for why attendance is/isn't required on a date
 * Useful for UI tooltips and explanations
 * 
 * @param date - ISO date string (YYYY-MM-DD)
 * @param studentClass - The student's class
 * @param schedule - The Tanév Rendje schedule containing breaks and overrides
 * @returns Object with required status and reason
 */
export function getAttendanceReason(
  date: string,
  studentClass: OsztalySimple | null | undefined,
  schedule: TanevRendje
): { required: boolean; reason: string } {
  const { tanitasi_szunetek, overrides } = schedule;

  // 1. Check class-specific override
  if (studentClass) {
    const classOverride = overrides.find(
      (o) => o.date === date && o.class_id === studentClass.id
    );
    if (classOverride !== undefined) {
      return {
        required: classOverride.is_required,
        reason: `Osztály-specifikus kivétel: ${classOverride.reason}`,
      };
    }
  }

  // 2. Check global override
  const globalOverride = overrides.find(
    (o) => o.date === date && o.class_id === null
  );
  if (globalOverride !== undefined) {
    return {
      required: globalOverride.is_required,
      reason: `Általános kivétel: ${globalOverride.reason}`,
    };
  }

  // 3. Check school break
  const breakPeriod = tanitasi_szunetek.find(
    (szunet) => date >= szunet.from_date && date <= szunet.to_date
  );
  if (breakPeriod) {
    return {
      required: false,
      reason: `Szünet: ${breakPeriod.name}`,
    };
  }

  // 4. Default rule
  const dayOfWeek = new Date(date).getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  return {
    required: isWeekday,
    reason: isWeekday ? 'Tanítási nap (hétköznap)' : 'Hétvége',
  };
}
