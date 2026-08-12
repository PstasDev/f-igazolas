// Types for table display (mapped from API types)

import type { IgazolasAllapot } from '@/lib/types';

export interface IgazolasTableRow {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  type: string;
  date: string;
  startDate: string; // ISO date string for multi-day support
  endDate: string;   // ISO date string for multi-day support
  hours: number[];
  correctedHours?: number[]; // Added for student corrections
  status: string;
  reason?: string; // Student's reason/note - separate from status
  imageUrl?: string;
  imgDriveURL?: string; // Added to match API response
  image_url?: string | null; // Server-stored image (new); null = no image
  bkk_verification?: string | object; // BKKVerification data (can be string or object)
  teacherNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  allapot: IgazolasAllapot; // Updated to match Django model
  fromFTV?: boolean;
  minutesBefore?: number;
  minutesAfter?: number;
  undoed?: boolean; // Student withdrew this record; teachers must never see it
}

export interface IgazolasType {
  name: string;
  emoji: string;
  color: string;
  category: string;
  beleszamit: boolean;
  iskolaerdeku: boolean;
  description: string;
}

export const igazolasTypes: Record<string, IgazolasType> = {
  'stúdiós távollét': {
    name: 'Studiós Távollét',
    emoji: '🎬',
    color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-500',
    category: 'Iskolaérdekű Távollét',
    beleszamit: false,
    iskolaerdeku: true,
    description: 'Ezen időpontban a tanuló iskolaérdekű tevékenységet végzett a Stúdió keretein belül'
  },  
  'médiás távollét': {
    name: 'Médiás Távollét',
    emoji: '📺',
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500',
    category: 'Iskolaérdekű Távollét',
    beleszamit: false,
    iskolaerdeku: true,
    description: 'Ezen időpontban a tanuló iskolaérdekű, Média tagozattal kapcsolatos tevékenységet végzett'
  },
  'orvosi igazolás': {
    name: 'Orvosi Igazolás',
    emoji: '🏥',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-500',
    category: 'Orvosi igazolás',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló orvosi kezelés alatt állt'
  },
  'rosszullet': {
    name: 'Rosszullét',
    emoji: '🤢',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-500',
    category: 'Orvosi igazolás',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló a tanítási idő alatt lett rosszul, ezért elhagyta az intézményt'
  },
  'családi okok': {
    name: 'Családi Okok',
    emoji: '👨‍👩‍👧‍👦',
    color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-500',
    category: 'Szülői igazolás',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló családi okok miatt volt távol'
  },
  'közlekedés': {
    name: 'Közlekedés',
    emoji: '🚇',
    color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500',
    category: 'Közlekedési probléma',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló közlekedési problémák miatt nem tudott részt venni az órán'
  },
  'oktv': {
    name: 'OKTV',
    emoji: '🎓',
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500',
    category: 'Verseny',
    beleszamit: false,
    iskolaerdeku: true,
    description: 'A tanuló Országos Középiskolai Tanulmányi Versenyen vett részt'
  },
  'verseny': {
    name: 'Verseny',
    emoji: '🎓',
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500',
    category: 'Verseny',
    beleszamit: false,
    iskolaerdeku: true,
    description: 'A tanuló egyéb tanulmányi vagy sportversenyen vett részt'
  },
  'sitabor': {
    name: 'Sítábor',
    emoji: '⛷️',
    color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-500',
    category: 'Sítábor',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló iskolai szervezésű sítáborban volt'
  },
  'utazas': {
    name: 'Utazás',
    emoji: '🏖️',
    color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-500',
    category: 'Utazás',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló a jelzett időpontban elutazott'
  },
  'igazgatoi': {
    name: 'Egyéb Igazgatói Engedély',
    emoji: '📝',
    color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-500',
    category: 'Egyéb',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'Igazgatói engedéllyel volt távol a tanuló'
  },
  'egyéb': {
    name: 'Egyéb',
    emoji: '📝',
    color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-500',
    category: 'Egyéb',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'Egyéb okok miatt volt távol a tanuló'
  }
};

const typeMappings: Record<string, string> = {
  'szülői igazolás': 'családi okok',
  'beteg': 'orvosi igazolás',
  'studiós távollét': 'stúdiós távollét', // Handle version without accent
};

// Helper function to normalize Hungarian accented characters
function normalizeHungarianText(text: string): string {
  return text
    .toLowerCase()
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/ő/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/ű/g, 'u');
}

export function getIgazolasType(typeName: string): IgazolasType {
  const normalized = typeName.toLowerCase();
  
  // Try exact match first
  let mapped = typeMappings[normalized] || normalized;
  
  // If no exact match, try with normalized Hungarian characters
  if (!igazolasTypes[mapped]) {
    const normalizedAccents = normalizeHungarianText(normalized);
    mapped = typeMappings[normalizedAccents] || normalizedAccents;
    
    // Also check if we have a match when normalizing the keys
    if (!igazolasTypes[mapped]) {
      for (const key of Object.keys(igazolasTypes)) {
        if (normalizeHungarianText(key) === normalizedAccents) {
          mapped = key;
          break;
        }
      }
    }
  }
  
  return igazolasTypes[mapped] || igazolasTypes['egyéb'];
}

// Helper function to check if an igazolás spans multiple days
export function isMultiDayAbsence(eleje: string, vege: string): boolean {
  const start = new Date(eleje);
  const end = new Date(vege);
  
  // Set both to midnight for comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  return start.getTime() !== end.getTime();
}

// Get all dates between start and end (inclusive)
export function getDateRange(eleje: string, vege: string): Date[] {
  const start = new Date(eleje);
  const end = new Date(vege);
  const dates: Date[] = [];
  
  const currentDate = new Date(start);
  currentDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// Get day of week letter in Hungarian
export function getDayOfWeekLetter(date: Date): string {
  const days = ['V', 'H', 'K', 'Sz', 'Cs', 'P', 'Szo'];
  return days[date.getDay()];
}

// Get day of week name in Hungarian (short form)
export function getDayOfWeekShort(dayIndex: number): string {
  const days = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];
  return days[dayIndex];
}

// Build calendar grid for date range
export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isInRange: boolean;
  isDisabled: boolean;
}

export function buildCalendarGrid(startDate: string, endDate: string): CalendarDay[][] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set to start of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Find the Monday of the week containing start date
  const firstDay = new Date(start);
  const dayOfWeek = firstDay.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
  firstDay.setDate(firstDay.getDate() + diff);
  
  // Find the Sunday of the week containing end date
  const lastDay = new Date(end);
  const lastDayOfWeek = lastDay.getDay();
  const lastDiff = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
  lastDay.setDate(lastDay.getDate() + lastDiff);
  
  const weeks: CalendarDay[][] = [];
  const currentDate = new Date(firstDay);
  
  while (currentDate <= lastDay) {
    const week: CalendarDay[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      const isInRange = date >= start && date <= end;
      const isDisabled = !isInRange;
      
      week.push({
        date: new Date(date),
        dayOfMonth: date.getDate(),
        isInRange,
        isDisabled
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push(week);
  }
  
  return weeks;
}
