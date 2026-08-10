import type { OnboardingTourStep } from '@/components/onboarding/OnboardingTour';

/**
 * Stable ids for each onboarding tour, persisted in
 * profile.frontendConfig.onboarding.completedTours.
 */
export const TOUR_IDS = {
  IGAZOLASOK_TEACHER: 'igazolasok-teacher',
  IGAZOLASOK_STUDENT: 'igazolasok-student',
  MULASZTASOK: 'mulasztasok',
  NEW_IGAZOLAS: 'new-igazolas',
} as const;

export const igazolasokTeacherTourSteps: OnboardingTourStep[] = [
  {
    target: '[data-tour="igazolasok-teacher-header"]',
    title: 'Igazolások áttekintése',
    content: 'Itt látod az osztályod diákjai által beküldött összes igazolást, egy helyen.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="igazolasok-teacher-table"]',
    title: 'Igazolások táblázata',
    content: 'A táblázatban soronként jóváhagyhatod vagy elutasíthatod a beküldött igazolásokat, és megnézheted a részleteiket.',
    placement: 'top',
  },
];

export const igazolasokStudentTourSteps: OnboardingTourStep[] = [
  {
    target: '[data-tour="igazolasok-student-header"]',
    title: 'Igazolásaim',
    content: 'Itt látod az általad beküldött összes igazolást és azok elbírálási állapotát.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="igazolasok-student-new-button"]',
    title: 'Új igazolás beküldése',
    content: 'Erre a gombra kattintva küldhetsz be egy új igazolást hiányzás vagy késés esetén.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="igazolasok-student-table"]',
    title: 'Igazolások táblázata',
    content: 'Itt követheted nyomon a beküldött igazolásaid állapotát: függőben, elfogadva vagy elutasítva.',
    placement: 'top',
  },
];

export const mulasztasokTourSteps: OnboardingTourStep[] = [
  {
    target: '[data-tour="mulasztasok-header"]',
    title: 'Mulasztások eKrétából',
    content: 'Ezen az oldalon feltöltheted az eKrétából exportált mulasztásaidat, és megnézheted, mennyi van közülük igazolással lefedve.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="mulasztasok-goto"]',
    title: 'Irány a Kréta!',
    content: 'Ha még nem exportáltad a mulasztásaidat, kattints erre a gombra, hogy a Kréta felületére juss. A Mulasztások menüpontban az "EXPORT" gombbal tudod letölteni a mulasztásaidat, majd visszatérve ide feltöltheted a fájlt.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="mulasztasok-upload"]',
    title: 'Fájl feltöltése',
    content: 'Töltsd fel az eKrétából exportált .xlsx fájlt, hogy elemezhessük a mulasztásaidat.',
    placement: 'top',
  },
  {
    target: '[data-tour="mulasztasok-quick-create"]',
    title: 'Gyors igazolás létrehozása',
    content: 'Jelöld ki a lefedetlen mulasztásaidat a táblázatban, majd a megjelenő "Igazolás létrehozása" gombbal automatikusan kitöltött igazolás űrlapot nyithatsz meg hozzájuk. Itt olvashatod el a részletes útmutatót is.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="mulasztasok-filters"]',
    title: 'Szűrés állapot szerint',
    content: 'Fájl feltöltése után ezekkel a gombokkal szűrhetsz az összes, a lefedetlen vagy a már lefedett mulasztásaid között.',
    placement: 'top',
  },
];

export const newIgazolasTourSteps: OnboardingTourStep[] = [
  {
    target: '[data-tour="new-igazolas-header"]',
    title: 'Új igazolás beküldése',
    content: 'Ezen az űrlapon küldheted be a hiányzásod vagy késésed igazolását, néhány lépésben.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="new-igazolas-date"]',
    title: 'Dátum megadása',
    content: 'Add meg, mikor történt a hiányzás. Ha több napot érint, kapcsold be a "Több napos hiányzás" opciót.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="new-igazolas-periods"]',
    title: 'Tanórák kiválasztása',
    content: 'Koppintással vagy húzással jelöld ki, mely tanórákra vonatkozik az igazolás.',
    placement: 'top',
  },
  {
    target: '[data-tour="new-igazolas-type"]',
    title: 'Igazolás típusa',
    content: 'Válaszd ki a hiányzás okát a listából, vagy a gyakran használt típusok közül.',
    placement: 'top',
  },
  {
    target: '[data-tour="new-igazolas-description"]',
    title: 'Részletes leírás',
    content: 'Írj egy rövid indoklást a hiányzásról.',
    placement: 'top',
  },
  {
    target: '[data-tour="new-igazolas-image"]',
    title: 'Kép csatolása',
    content: 'Opcionálisan csatolhatsz egy igazoló dokumentumról készült képet is.',
    placement: 'top',
  },
  {
    target: '[data-tour="new-igazolas-submit"]',
    title: 'Beküldés',
    content: 'Ha mindent kitöltöttél, itt küldheted be az igazolást elbírálásra.',
    placement: 'top',
  },
];
