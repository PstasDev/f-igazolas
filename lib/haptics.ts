// Tiny haptics helper. Safe no-op when `navigator.vibrate` is unavailable.

function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}

export const haptics = {
  tap: () => vibrate(10),
  thud: () => vibrate([20, 30, 60]),
  success: () => vibrate([15, 40, 15]),
  warn: () => vibrate([40, 30, 40]),
};
