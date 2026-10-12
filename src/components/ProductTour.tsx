'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface TourStep {
  target: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="control-room"]',
    title: 'Control room',
    body: 'Live status for this event and the current Lagos time. It switches to REC · ON AIR when you go live.',
  },
  {
    target: '[data-tour="ticker"]',
    title: 'Live feeds',
    body: 'What is streaming across LivDot right now. Hover to pause the rail.',
  },
  {
    target: '[data-tour="lifecycle"]',
    title: 'Lifecycle',
    body: 'The event moves Draft → Scheduled → Ready → Live → Completed → Replay. Only valid forward steps are allowed.',
  },
  {
    target: '[data-tour="readiness"]',
    title: 'Operational readiness',
    body: 'What must be true before you can go live. Each requirement is satisfied, missing, checking, or unknown — and gaps explain why actions are blocked.',
  },
  {
    target: '[data-tour="actions"]',
    title: 'Actions',
    body: 'The one action valid for the current state. When it is disabled, it tells you exactly what is preventing it.',
  },
  {
    target: '[data-tour="event"]',
    title: 'Event details',
    body: 'Title, schedule, access, tickets and production crew at a glance.',
  },
  {
    target: '[data-tour="simulator"]',
    title: 'Backend simulator',
    body: 'No real backend here — use these controls to reproduce readiness, stream and state scenarios.',
  },
];

const SEEN_KEY = 'livdot.control-room.tourSeen';

export function ProductTour({ onDone }: { onDone: () => void }) {
  // Steps whose targets are actually present (retry briefly — panels mount async).
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    let tries = 0;
    let cancelled = false;
    const find = () => {
      if (cancelled) return;
      const available = STEPS.filter((s) => document.querySelector(s.target));
      if (available.length > 0 || tries >= 8) {
        setSteps(available);
        return;
      }
      tries += 1;
      window.setTimeout(find, 100);
    };
    find();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to show for this state — close without marking as seen.
  useEffect(() => {
    if (steps && steps.length === 0) onDone();
  }, [steps, onDone]);

  // Mark-as-seen happens ONLY on an explicit user action.
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    onDone();
  }, [onDone]);

  const step = steps && steps.length > 0 ? steps[Math.min(i, steps.length - 1)] : null;

  useLayoutEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const measure = () => setRect(el.getBoundingClientRect());
    measure();
    const t = window.setTimeout(measure, 380);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (!steps) return;
      if (e.key === 'ArrowRight') setI((v) => Math.min(v + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setI((v) => Math.max(v - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismiss, steps]);

  const total = steps?.length ?? 0;
  const ui = useMemo(() => {
    if (!rect) return { top: 0, left: 0 };
    return {
      top: Math.min(rect.bottom + 14, window.innerHeight - 210),
      left: Math.min(Math.max(rect.left, 16), Math.max(window.innerWidth - 356, 16)),
    };
  }, [rect]);

  if (!step || total === 0) return null;
  const last = i >= total - 1;

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="Product tour">
      {rect && (
        <div
          className="tour__spotlight"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}
      <AnimatePresence>
        {rect && (
          <motion.div
            className="tour__card"
            key={i}
            style={{ top: ui.top, left: ui.left }}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="tour__count">
              {i + 1} / {total}
            </span>
            <h3 className="tour__title">{step.title}</h3>
            <p className="tour__body">{step.body}</p>
            <div className="tour__foot">
              <div className="tour__dots" aria-hidden>
                {steps!.map((_, d) => (
                  <span key={d} className={`tour__dot ${d === i ? 'is-on' : ''}`} />
                ))}
              </div>
              <div className="tour__buttons">
                <button className="btn btn--sm btn--ghost" onClick={dismiss}>
                  Skip
                </button>
                <button
                  className="btn btn--sm btn--ghost"
                  onClick={() => setI((v) => Math.max(v - 1, 0))}
                  disabled={i === 0}
                >
                  Back
                </button>
                <button
                  className="btn btn--sm btn--primary"
                  onClick={() => (last ? dismiss() : setI(i + 1))}
                >
                  {last ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function shouldShowTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== '1';
  } catch {
    return false;
  }
}
