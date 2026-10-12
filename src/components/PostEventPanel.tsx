import type { HostEvent, ReplayAccess } from '@/domain/types';

const REPLAY_OPTIONS: ReplayAccess[] = ['INCLUDED', 'DISABLED', 'PAID_SEPARATELY'];

function revenue(event: HostEvent): string {
  const price = Number(event.details.ticketPrice ?? 0);
  const total = price * event.details.ticketsSold;
  if (!price) return '—';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: event.details.currency,
    maximumFractionDigits: 0,
  }).format(total);
}

export function PostEventPanel({
  event,
  onSetReplayAccess,
}: {
  event: HostEvent;
  onSetReplayAccess: (access: ReplayAccess) => void;
}) {
  return (
    <section className="panel">
      <header className="panel__header">
        <h2 className="panel__title">Post-event</h2>
        <span className="tag">{event.state.replace(/_/g, ' ')}</span>
      </header>

      <div className="live-grid">
        <div className="metric">
          <span className="metric__label">Tickets sold</span>
          <span className="metric__value mono">{event.details.ticketsSold}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Gross revenue</span>
          <span className="metric__value mono">{revenue(event)}</span>
        </div>
        <div className="metric">
          <span className="metric__label">Stream</span>
          <span className={`metric__value stream stream--${event.stream.status}`}>
            {event.stream.status}
          </span>
        </div>
      </div>

      <div className="sim-group">
        <span className="sim-group__label">Replay access</span>
        <div className="chip-row">
          {REPLAY_OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`chip ${event.details.replayAccess === opt ? 'chip--on' : ''}`}
              onClick={() => onSetReplayAccess(opt)}
            >
              {opt.replace(/_/g, ' ').toLowerCase()}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
