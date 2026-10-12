import type { ReadinessView } from '@/domain/selectors';
import type { RequirementStatus } from '@/domain/types';
import { RequirementBadge } from './StatusBadge';

const REASON: Record<RequirementStatus, string> = {
  satisfied: 'Confirmed by the platform.',
  missing: 'Not yet configured — blocks going live.',
  pending: 'Verification in progress.',
  unknown: 'Status could not be determined yet.',
};

export function ReadinessPanel({
  readiness,
  onRecheck,
  rechecking,
}: {
  readiness: ReadinessView;
  onRecheck: () => void;
  rechecking: boolean;
}) {
  const { blocking, blockingSatisfied, isReady } = readiness;
  return (
    <section className="panel" data-guide="Readiness — the gate to going live">
      <header className="panel__header">
        <h2 className="panel__title">Operational readiness</h2>
        <button
          className="btn btn--ghost"
          onClick={onRecheck}
          disabled={rechecking}
        >
          {rechecking ? 'Rechecking…' : 'Recheck'}
        </button>
      </header>

      <p className={`readiness__summary ${isReady ? 'is-ready' : 'is-blocked'}`}>
        {blockingSatisfied} of {blocking} blocking requirements satisfied
        {isReady ? ' — ready to stream' : ' — not ready'}
      </p>

      <ul className="req-list">
        {readiness.requirements.map((r) => (
          <li
            key={r.id}
            className={`req req--${r.status}`}
            data-guide={
              r.status === 'satisfied'
                ? `${r.label} — satisfied`
                : `${r.label} — fix in the simulator below`
            }
          >
            <div className="req__main">
              <span className="req__label">
                {r.label}
                {r.blocking && <span className="req__gate">blocking</span>}
              </span>
              {r.description && (
                <span className="req__desc">{r.description}</span>
              )}
              <span className="req__reason">{REASON[r.status]}</span>
            </div>
            <RequirementBadge status={r.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}
