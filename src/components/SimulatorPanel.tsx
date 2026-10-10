'use client';

import { useState } from 'react';
import type {
  EventState,
  HostEvent,
  RequirementId,
  RequirementStatus,
  StreamStatus,
} from '@/domain/types';
import { LIFECYCLE } from '@/domain/machine';

const REQUIREMENT_STATUSES: RequirementStatus[] = [
  'satisfied',
  'missing',
  'pending',
  'unknown',
];

const STREAM_STATUSES: StreamStatus[] = [
  'idle',
  'connecting',
  'healthy',
  'degraded',
  'failed',
];

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function SimulatorPanel({
  event,
  setRequirement,
  setStream,
  setSchedule,
  simulateState,
}: {
  event: HostEvent;
  setRequirement: (id: RequirementId, status: RequirementStatus) => void;
  setStream: (stream: HostEvent['stream']) => void;
  setSchedule: (startAt: string | null) => void;
  simulateState: (state: EventState) => void;
}) {
  const [when, setWhen] = useState(() => toLocalInput(event.details.scheduledStartAt));

  return (
    <section className="panel panel--sim">
      <header className="panel__header">
        <h2 className="panel__title">Backend simulator</h2>
        <span className="tag">mock</span>
      </header>
      <p className="muted">
        No real backend is wired up. Use these controls to reproduce readiness,
        state and stream scenarios.
      </p>

      <div className="sim-group">
        <span className="sim-group__label">Start time</span>
        <div className="sim-row">
          <input
            type="datetime-local"
            className="input"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
          <button
            className="btn btn--sm"
            onClick={() =>
              setSchedule(when ? new Date(when).toISOString() : null)
            }
          >
            Apply
          </button>
          <button
            className="btn btn--sm btn--ghost"
            onClick={() => {
              setWhen('');
              setSchedule(null);
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="sim-group">
        <span className="sim-group__label">Readiness requirements</span>
        {event.requirements.map((r) => (
          <div className="sim-row" key={r.id}>
            <span className="sim-row__name">{r.label}</span>
            <select
              className="input"
              value={r.status}
              onChange={(e) =>
                setRequirement(r.id, e.target.value as RequirementStatus)
              }
            >
              {REQUIREMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="sim-group">
        <span className="sim-group__label">Stream ingest</span>
        <div className="chip-row">
          {STREAM_STATUSES.map((s) => (
            <button
              key={s}
              className={`chip ${event.stream.status === s ? 'chip--on' : ''}`}
              onClick={() =>
                setStream({
                  status: s,
                  bitrateKbps: s === 'healthy' ? 4500 : undefined,
                  viewers: s === 'healthy' ? event.stream.viewers ?? 0 : undefined,
                })
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="sim-group">
        <span className="sim-group__label">Jump to state</span>
        <div className="chip-row">
          {LIFECYCLE.map((s) => (
            <button
              key={s}
              className={`chip ${event.state === s ? 'chip--on' : ''}`}
              onClick={() => simulateState(s)}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
