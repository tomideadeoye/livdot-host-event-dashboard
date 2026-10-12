'use client';

import { useState } from 'react';
import type {
  EventState,
  HostEvent,
  ProductionMode,
  RequirementId,
  RequirementStatus,
  StreamStatus,
} from '@/domain/types';
import { LIFECYCLE } from '@/domain/machine';

const REQUIREMENT_STATUSES: RequirementStatus[] = ['satisfied', 'missing', 'pending', 'unknown'];
const STREAM_STATUSES: StreamStatus[] = ['idle', 'pending', 'active', 'error', 'ended'];
const PRODUCTION_MODES: ProductionMode[] = ['SELF', 'HIRE'];

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SimulatorPanel({
  event,
  setRequirement,
  setStream,
  setSchedule,
  setProductionMode,
  simulateState,
}: {
  event: HostEvent;
  setRequirement: (id: RequirementId, status: RequirementStatus) => void;
  setStream: (stream: HostEvent['stream']) => void;
  setSchedule: (startAt: string | null) => void;
  setProductionMode: (mode: ProductionMode) => void;
  simulateState: (state: EventState) => void;
}) {
  const [when, setWhen] = useState(() => toLocalInput(event.details.scheduledStartAt));

  return (
    <section className="panel panel--sim" data-tour="simulator">
      <header className="panel__header">
        <h2 className="panel__title">Backend simulator</h2>
        <span className="tag">mock</span>
      </header>
      <p className="muted">
        No real backend is wired up. Use these controls to reproduce readiness, state and stream
        scenarios.
      </p>

      <div className="sim-group" data-guide="Simulate backend state">
        <span className="sim-group__label">Start time</span>
        <div className="sim-row">
          <input
            type="datetime-local"
            className="input"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
          <button className="btn btn--sm" onClick={() => setSchedule(when ? new Date(when).toISOString() : null)}>
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

      <div className="sim-group" data-guide="Simulate backend state">
        <span className="sim-group__label">Production crew</span>
        <div className="chip-row">
          {PRODUCTION_MODES.map((m) => (
            <button
              key={m}
              className={`chip ${event.details.productionMode === m ? 'chip--on' : ''}`}
              onClick={() => setProductionMode(m)}
            >
              {m.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="sim-group" data-guide="Simulate backend state">
        <span className="sim-group__label">Readiness requirements</span>
        {event.requirements.map((r) => (
          <div className="sim-row" key={r.id}>
            <span className="sim-row__name">{r.label}</span>
            <select
              className="input"
              value={r.status}
              onChange={(e) => setRequirement(r.id, e.target.value as RequirementStatus)}
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

      <div className="sim-group" data-guide="Simulate backend state">
        <span className="sim-group__label">Stream ingest</span>
        <div className="chip-row">
          {STREAM_STATUSES.map((s) => (
            <button
              key={s}
              className={`chip ${event.stream.status === s ? 'chip--on' : ''}`}
              onClick={() =>
                setStream({
                  status: s,
                  quality: event.stream.quality,
                  bitrateKbps: s === 'active' ? 4500 : undefined,
                  viewers: s === 'active' ? event.stream.viewers ?? 0 : undefined,
                })
              }
            >
              {s}
            </button>
          ))}
        </div>
        <div className="chip-row" style={{ marginTop: 8 }}>
          <button
            className={`chip ${event.stream.quality === 'good' ? 'chip--on' : ''}`}
            onClick={() => setStream({ ...event.stream, quality: 'good' })}
          >
            quality: good
          </button>
          <button
            className={`chip ${event.stream.quality === 'low' ? 'chip--on' : ''}`}
            onClick={() => setStream({ ...event.stream, quality: 'low', message: 'Bitrate below target.' })}
          >
            quality: low
          </button>
        </div>
      </div>

      <div className="sim-group" data-guide="Simulate backend state">
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
