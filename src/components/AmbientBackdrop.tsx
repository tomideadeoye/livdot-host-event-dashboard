'use client';

import type { EventState } from '@/domain/types';

/**
 * Ambient "mood light" backdrop — soft, blurred colour orbs that drift and
 * shift, echoing moodlight.org's full-screen colour wash. The palette is keyed
 * to the event state so the room's mood reflects what the event is doing.
 */
const PALETTE: Record<EventState, string[]> = {
  draft: ['#1daf9c', '#35ade9'],
  scheduled: ['#35ade9', '#7d52f4'],
  ready_for_streaming: ['#1daf9c', '#1daf61'],
  live: ['#ff3f3f', '#e9358f', '#fa7319'],
  completed: ['#7d52f4', '#e6a819'],
  replay_available: ['#e6a819', '#1daf9c'],
};

export function AmbientBackdrop({ state }: { state: EventState }) {
  const colors = PALETTE[state];
  return (
    <div className={`ambient ambient--${state}`} aria-hidden>
      {colors.map((c, i) => (
        <span
          key={`${state}-${i}`}
          className={`ambient__orb ambient__orb--${i}`}
          style={{ backgroundImage: `radial-gradient(circle, ${c}, transparent 68%)` }}
        />
      ))}
      <span className="ambient__grain" />
    </div>
  );
}
