'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Client-side access gate. Cosmetic: it hides the UI, not the bundle.
 *
 * Enabled via the build-time flag `ACCESS_GATE` (see next.config.mjs):
 *   ACCESS_GATE=off  → ungated (the public submission build)
 *   default / on      → gated private demo ("type tomide")
 */
const ACCESS_CODE = (process.env.NEXT_PUBLIC_ACCESS_CODE ?? 'tomide').toLowerCase();
const GATE_ENABLED = process.env.NEXT_PUBLIC_ACCESS_GATE !== 'off';
const STORAGE_KEY = 'livdot.control-room.unlocked';

export function AccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(!GATE_ENABLED);
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(0);

  useEffect(() => {
    if (!GATE_ENABLED) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setUnlocked(true);
    } catch {
      /* ignore */
    }
  }, []);

  const onChange = (next: string) => {
    setValue(next);
    if (next.trim().toLowerCase() === ACCESS_CODE) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
      setUnlocked(true);
    } else if (next.trim().length >= ACCESS_CODE.length) {
      setShake((s) => s + 1);
    }
  };

  const wrong = value.trim().length >= ACCESS_CODE.length;

  if (!GATE_ENABLED) return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      {unlocked ? (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="gate"
          className="gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            key={shake}
            className="gate__card"
            initial={{ y: 14, opacity: 0 }}
            animate={wrong ? { x: [0, -8, 8, -5, 5, 0] } : { y: 0, opacity: 1 }}
            transition={{ duration: wrong ? 0.4 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="gate__eyebrow">
              <span className="rec-dot rec-dot--live" aria-hidden /> RESTRICTED · LIVDOT CONTROL ROOM
            </span>
            <h1 className="gate__title">Private feed</h1>
            <p className="gate__sub">
              This control room is access-restricted. Type{' '}
              <strong className="gate__code">tomide</strong> to enter.
            </p>
            <input
              className={`gate__input ${wrong ? 'gate__input--err' : ''}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="type tomide"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              aria-label="Access phrase"
            />
            <span className="gate__caret-hint">
              {wrong ? 'Incorrect — type tomide' : 'Awaiting input'}
              <span className="gate__caret" aria-hidden />
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
