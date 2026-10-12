'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Hover guidance.
 *
 * Any element carrying a `data-guide` attribute, when hovered, raises a
 * cursor-following tip AND spotlights the single primary action
 * (`[data-primary-action]`). The effect: whatever a person idly hovers, the
 * UI redirects their attention to the one thing they should click next.
 */
export function NextActionGuide({
  nextAction,
  enabled,
  blockedReason,
}: {
  nextAction: string | null;
  enabled: boolean;
  blockedReason: string | null;
}) {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const el = (e.target as HTMLElement)?.closest?.('[data-guide]') as HTMLElement | null;
        if (el) {
          setTip({ text: el.getAttribute('data-guide') || '', x: e.clientX, y: e.clientY });
        } else {
          setTip((prev) => (prev ? null : prev));
        }
      });
    };
    document.addEventListener('mousemove', onMove);
    return () => {
      document.removeEventListener('mousemove', onMove);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    const el = document.querySelector('[data-primary-action]') as HTMLElement | null;
    if (!el) return;
    if (tip) el.classList.add('guide-spotlight');
    else el.classList.remove('guide-spotlight');
    return () => el.classList.remove('guide-spotlight');
  }, [tip]);

  const nudge = nextAction
    ? enabled
      ? `→ Click: ${nextAction}`
      : `→ Unblock: ${blockedReason ?? nextAction}`
    : '→ Event complete';

  return (
    <AnimatePresence>
      {tip && (
        <motion.div
          className="guide-tip"
          style={{ left: tip.x + 16, top: tip.y + 18 }}
          initial={{ opacity: 0, y: 5, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="guide-tip__what">{tip.text}</span>
          <span className={`guide-tip__next ${enabled ? '' : 'is-blocked'}`}>{nudge}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
