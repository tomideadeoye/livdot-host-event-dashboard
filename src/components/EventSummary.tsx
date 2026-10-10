import type { HostEvent } from '@/domain/types';
import type { StateMeta } from '@/domain/machine';

function formatWhen(iso: string | null): string {
  if (!iso) return 'Not scheduled';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not scheduled';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function EventSummary({
  event,
  meta,
}: {
  event: HostEvent;
  meta: StateMeta;
}) {
  const { details, stream } = event;
  return (
    <section className="panel">
      <header className="panel__header">
        <h2 className="panel__title">Event</h2>
      </header>
      <div className="summary">
        <div className="summary__row">
          <span className="summary__key">Title</span>
          <span className="summary__val">{details.title}</span>
        </div>
        <div className="summary__row">
          <span className="summary__key">Host</span>
          <span className="summary__val">{details.host}</span>
        </div>
        <div className="summary__row">
          <span className="summary__key">Starts</span>
          <span className="summary__val">
            {formatWhen(details.scheduledStartAt)}
            <span className="muted"> · {details.timezone}</span>
          </span>
        </div>
        <div className="summary__row">
          <span className="summary__key">Tickets</span>
          <span className="summary__val">
            {details.ticketsSold} sold
            {details.ticketCapacity != null ? ` / ${details.ticketCapacity} capacity` : ''}
          </span>
        </div>
        <div className="summary__row">
          <span className="summary__key">Stream</span>
          <span className="summary__val">
            <span className={`stream stream--${stream.status}`}>{stream.status}</span>
            {stream.status === 'healthy' && stream.bitrateKbps
              ? ` · ${stream.bitrateKbps} kbps · ${stream.viewers ?? 0} watching`
              : ''}
          </span>
        </div>
        <p className="summary__hint">{meta.description}</p>
      </div>
    </section>
  );
}
