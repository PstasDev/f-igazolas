// Types for table display (mapped from API types)

export interface IgazolasTableRow {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  type: string;
  date: string;
  hours: number[];
  status: string;
  imageUrl?: string;
  teacherNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approved: boolean | null;
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
  'studiós távollét': {
    name: 'Studiós Távollét',
    emoji: '🎬',
    color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300',
    category: 'Iskolaérdekű Távollét',
    beleszamit: false,
    iskolaerdeku: true,
    description: 'Ezen időpontban a tanuló iskolaérdekű tevékenységet végzett a Stúdió keretein belül'
  },
  'médiás távollét': {
    name: 'Médiás Távollét',
    emoji: '📺',
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300',
    category: 'Iskolaérdekű Távollét',
    beleszamit: false,
    iskolaerdeku: true,
    description: 'Ezen időpontban a tanuló iskolaérdekű, Média tagozattal kapcsolatos tevékenységet végzett'
  },
  'orvosi igazolás': {
    name: 'Orvosi Igazolás',
    emoji: '🏥',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300',
    category: 'Orvosi igazolás',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló orvosi ellátásban részesült'
  },
  'családi okok': {
    name: 'Családi Okok',
    emoji: '👨‍👩‍👧‍👦',
    color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300',
    category: 'Szülői igazolás',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló családi okok miatt volt távol'
  },
  'közlekedés': {
    name: 'Közlekedés',
    emoji: '🚇',
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300',
    category: 'Közlekedési probléma',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'A tanuló közlekedési problémák miatt nem tudott részt venni az órán'
  },
  'egyéb': {
    name: 'Egyéb',
    emoji: '📝',
    color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300',
    category: 'Egyéb',
    beleszamit: true,
    iskolaerdeku: false,
    description: 'Egyéb okok miatt volt távol a tanuló'
  }
};

const typeMappings: Record<string, string> = {
  'szülői igazolás': 'családi okok',
  'beteg': 'orvosi igazolás',
};

export function getIgazolasType(typeName: string): IgazolasType {
  const normalized = typeName.toLowerCase();
  const mapped = typeMappings[normalized] || normalized;
  return igazolasTypes[mapped] || igazolasTypes['egyéb'];
}
