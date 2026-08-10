'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useFrontendConfig } from '@/app/context/FrontendConfigContext';

export interface OnboardingTourStep {
  /** CSS selector for the element this step points at. */
  target: string;
  title: string;
  content: string;
  /** Preferred side of the target to place the tooltip. Falls back automatically if it doesn't fit. @default 'bottom' */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  /** Stable id used to persist completion in the profile's frontendConfig (onboarding.completedTours). */
  tourId: string;
  steps: OnboardingTourStep[];
  /** Only allow the tour to auto-start once its target elements are actually in the DOM (e.g. after data has loaded). */
  ready?: boolean;
}

const SPOTLIGHT_PADDING = 8;

export function OnboardingTour({ tourId, steps, ready = true }: OnboardingTourProps) {
  const { config, loading, updateConfig } = useFrontendConfig();
  const [stepIndex, setStepIndex] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const alreadyDone = !!config.onboarding?.completedTours?.[tourId];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-start the tour once ready, config has loaded, and it hasn't been seen yet.
  useEffect(() => {
    if (!ready || loading || alreadyDone || stepIndex !== -1) return;
    const timer = setTimeout(() => setStepIndex(0), 500);
    return () => clearTimeout(timer);
  }, [ready, loading, alreadyDone, stepIndex]);

  const finish = useCallback((completed: boolean) => {
    setStepIndex(-1);
    setRect(null);
    if (completed) {
      updateConfig({ onboarding: { completedTours: { [tourId]: true } } }).catch(() => {
        // Failure to persist just means the tour may show again next visit; not critical.
      });
    }
  }, [tourId, updateConfig]);

  // Locate the target element and measure it whenever the step changes.
  useEffect(() => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    let cancelled = false;
    let attempt = 0;

    const locate = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(steps[stepIndex].target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        window.setTimeout(() => {
          if (!cancelled) setRect(el.getBoundingClientRect());
        }, 300);
        return;
      }
      // Element not mounted yet (e.g. conditional section) - retry briefly, then skip the step.
      if (attempt < 4) {
        attempt += 1;
        window.setTimeout(locate, 250);
      } else if (!cancelled) {
        if (stepIndex === steps.length - 1) {
          finish(true);
        } else {
          setStepIndex((i) => i + 1);
        }
      }
    };

    locate();
    return () => {
      cancelled = true;
    };
  }, [stepIndex, steps, finish]);

  // Keep the highlighted rect in sync with scrolling/resizing while a step is shown.
  useEffect(() => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(steps[stepIndex].target);
        if (el) setRect(el.getBoundingClientRect());
      });
    };

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [stepIndex, steps]);

  const tooltipStyle = useMemo(() => {
    if (!rect) return null;
    const placement = steps[stepIndex]?.placement ?? 'bottom';
    const margin = 16;
    const tooltipWidth = 320;
    const tooltipHeightEstimate = 160;

    let top = rect.bottom + margin;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    if (placement === 'top') {
      top = rect.top - tooltipHeightEstimate - margin;
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2 - tooltipHeightEstimate / 2;
      left = rect.left - tooltipWidth - margin;
    } else if (placement === 'right') {
      top = rect.top + rect.height / 2 - tooltipHeightEstimate / 2;
      left = rect.right + margin;
    } else if (placement === 'bottom' && rect.bottom + tooltipHeightEstimate + margin > window.innerHeight) {
      // Not enough room below - flip above.
      top = rect.top - tooltipHeightEstimate - margin;
    }

    // Clamp within viewport.
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - tooltipHeightEstimate - 12));

    return { top, left, width: tooltipWidth };
  }, [rect, stepIndex, steps]);

  if (!mounted || stepIndex < 0 || stepIndex >= steps.length || !rect || !tooltipStyle) {
    return null;
  }

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label={step.title}>
      {/* Darkened backdrop with a spotlight cutout around the target element. */}
      <div
        className="absolute rounded-md transition-all duration-200 ease-out pointer-events-none"
        style={{
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        }}
      />
      <div
        className="absolute rounded-md ring-2 ring-primary pointer-events-none"
        style={{
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
        }}
      />

      {/* Tooltip card */}
      <div
        className="absolute bg-popover text-popover-foreground border rounded-lg shadow-xl p-4 pointer-events-auto"
        style={{ top: tooltipStyle.top, left: tooltipStyle.left, width: tooltipStyle.width }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-sm">{step.title}</h3>
          <button
            type="button"
            onClick={() => finish(true)}
            aria-label="Bezárás"
            className="text-muted-foreground hover:text-foreground shrink-0 -mt-0.5 -mr-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{step.content}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {stepIndex + 1} / {steps.length}
          </span>
          <div className="flex items-center gap-2">
            {!isLast && (
              <Button type="button" variant="ghost" size="sm" onClick={() => finish(true)}>
                Kihagyás
              </Button>
            )}
            {stepIndex > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setStepIndex((i) => i - 1)}>
                Vissza
              </Button>
            )}
            <Button type="button" size="sm" onClick={() => (isLast ? finish(true) : setStepIndex((i) => i + 1))}>
              {isLast ? 'Befejezés' : 'Tovább'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
