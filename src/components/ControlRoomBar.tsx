'use client';

import { useEffect, useState } from 'react';

function formatWat(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

/** The persistent "control room" chrome — mirrors LIV DOT's REC + clock motif. */
export function ControlRoomBar({ isLive }: { isLive: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`control-room ${isLive ? 'is-live' : ''}`} data-guide={isLive ? 'On air — monitor below' : 'Control-room status'}>
      <span className="control-room__left">
        <span className={`rec-dot ${isLive ? 'rec-dot--live' : ''}`} aria-hidden />
        <span className="control-room__label">
          {isLive ? 'REC' : 'STBY'} · LIVDOT CONTROL ROOM
        </span>
      </span>
      <span className="control-room__right" suppressHydrationWarning>
        LAGOS {now ? formatWat(now) : '--:--:--'} WAT
      </span>
    </div>
  );
}
