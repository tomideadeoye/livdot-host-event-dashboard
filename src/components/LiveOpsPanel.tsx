'use client';

import { useEffect, useState } from 'react';
import type { HostEvent, IssueType } from '@/domain/types';

const ISSUE_TYPES: { id: IssueType; label: string }[] = [
  { id: 'SERVICE_NOT_DELIVERED', label: 'Not delivered' },
  { id: 'QUALITY_ISSUE', label: 'Quality' },
  { id: 'PAYMENT_DISPUTE', label: 'Payment' },
  { id: 'OTHER', label: 'Other' },
];

function uptime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function LiveOpsPanel({
  event,
  liveSince,
  onReportIssue,
  onResolveIssue,
  onToggleBackup,
}: {
  event: HostEvent;
  liveSince: number | null;
  onReportIssue: (type: IssueType) => void;
  onResolveIssue: (id: string) => void;
  onToggleBackup: () => void;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { stream } = event;
  const elapsed = liveSince ? uptime(Date.now() - liveSince) : '00:00:00';
  void tick; // ensure re-render each second

  return (
    <section className="panel panel--live">
      <header className="panel__header">
        <h2 className="panel__title">
          <span className={`rec-dot rec-dot--live`} aria-hidden /> Live operations
        </h2>
        <span className="tag tag--live">on air</span>
      </header>

      <div className="live-grid">
        <div className="metric">
          <span className="metric__label">Uptime</span>
          <span className="metric__value mono">{elapsed}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Viewers</span>
          <span className="metric__value mono">{stream.viewers ?? 0}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Bitrate</span>
          <span className="metric__value mono">
            {stream.bitrateKbps ? `${stream.bitrateKbps} kbps` : '—'}
          </span>
        </div>
        <div className="metric">
          <span className="metric__label">Ingest</span>
          <span className={`metric__value stream stream--${stream.status}`}>
            {stream.status}
          </span>
        </div>
      </div>

      <div className="live-row">
        <span className="muted">Backup ingest</span>
        <button className="btn btn--sm" onClick={onToggleBackup}>
          {event.details.backupStreamEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="sim-group">
        <span className="sim-group__label">Report an issue (refund / dispute path)</span>
        <div className="chip-row">
          {ISSUE_TYPES.map((t) => (
            <button key={t.id} className="chip" onClick={() => onReportIssue(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {event.issues.length > 0 && (
        <ul className="issue-list">
          {event.issues.map((issue) => (
            <li key={issue.id} className={`issue issue--${issue.status.toLowerCase()}`}>
              <span className="issue__type">{issue.type.replace(/_/g, ' ')}</span>
              <span className="issue__status">{issue.status.replace(/_/g, ' ')}</span>
              {issue.status !== 'RESOLVED' && (
                <button className="btn btn--sm btn--ghost" onClick={() => onResolveIssue(issue.id)}>
                  Resolve
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
