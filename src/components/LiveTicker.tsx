'use client';

import { useState } from 'react';

interface Feed {
  category: string;
  city: string;
  duration: string;
}

const FEEDS: Feed[] = [
  { category: 'Concerts', city: 'Lagos', duration: '01:30:53' },
  { category: 'Nightlife', city: 'Lagos', duration: '02:14:31' },
  { category: 'Fashion', city: 'Lagos', duration: '00:25:18' },
  { category: 'Weddings', city: 'Abuja', duration: '03:46:55' },
  { category: 'Worship', city: 'Ibadan', duration: '01:12:06' },
  { category: 'Conferences', city: 'Abuja', duration: '00:51:44' },
  { category: 'Comedy', city: 'Lagos', duration: '01:18:49' },
  { category: 'Sports', city: 'Abuja', duration: '01:01:47' },
];

/** Auto-scrolling "live feeds" strip — mirrors LIV DOT's feeds rail + pause control. */
export function LiveTicker() {
  const [paused, setPaused] = useState(false);
  return (
    <div className={`ticker ${paused ? 'is-paused' : ''}`} data-guide="Live feeds — hover to pause">
      <span className="ticker__label">
        <span className="rec-dot rec-dot--live" aria-hidden />
        Live now
      </span>
      <div className="ticker__viewport">
        <div className="ticker__track">
          {[...FEEDS, ...FEEDS].map((f, i) => (
            <span className="feed" key={`${f.category}-${i}`}>
              <span className="feed__dot" aria-hidden />
              <span className="feed__live">Live</span>
              <span className="feed__cat">{f.category}</span>
              <span className="feed__meta">
                {f.city} · {f.duration}
              </span>
            </span>
          ))}
        </div>
      </div>
      <button
        className="btn btn--sm btn--ghost"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
      >
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
}
