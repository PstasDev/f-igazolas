// Types for table display (mapped from API types)

export interface IgazolasTableRow {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  type: string;
  date: string;
  hours: number[];
  correctedHours?: number[]; // Added for student corrections
  status: string;
  reason?: string; // Student's reason/note - separate from status
  imageUrl?: string;
  imgDriveURL?: string; // Added to match API response
  bkk_verification?: string | object; // BKKVerification data (can be string or object)
  teacherNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  allapot: 'Függőben' | 'Elfogadva' | 'Elutasítva'; // Updated to match Django model
  fromFTV?: boolean;
  minutesBefore?: number;
  minutesAfter?: number;
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
    description: 'A tanuló orvosi ellátásban részesült'
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
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500',
    category: 'Közlekedési probléma',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló közlekedési problémák miatt nem tudott részt venni az órán'
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
