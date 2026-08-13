import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  /** Duration in ms before the long press fires (default: 500) */
  threshold?: number;
  onLongPress: () => void;
  onClick?: () => void;
}

/**
 * Returns event handler props to attach to a DOM element so that
 * a long press (touch or mouse) calls `onLongPress` and a normal
 * tap/click calls `onClick`.
 *
 * Works on both pointer/touch devices and desktop mice.
 */
export function useLongPress({ threshold = 500, onLongPress, onClick }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, threshold);
  }, [threshold, onLongPress]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isLongPress.current = false;
  }, []);

  const handleClick = useCallback(() => {
    // Only fire the click handler if this was NOT a long press
    if (!isLongPress.current) {
      onClick?.();
    }
  }, [onClick]);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onClick: handleClick,
    // Prevent the browser context menu from interfering with long-press on mobile
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  };
}
