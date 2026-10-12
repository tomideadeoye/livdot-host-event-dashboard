import type { EventCategory, HostEvent } from '@/domain/types';
import type { StateMeta } from '@/domain/machine';

export const CATEGORY_COLOR: Record<EventCategory, string> = {
  CONCERT: 'var(--pink)',
  FESTIVAL: 'var(--orange)',
  WEDDING: 'var(--teal)',
  CORPORATE: 'var(--blue)',
  RELIGIOUS: 'var(--purple)',
  COMEDY: 'var(--gold)',
  SPORTS: 'var(--green)',
  CONFERENCE: 'var(--blue)',
};

function formatWhen(iso: string | null): string {
  if (!iso) return 'Not scheduled';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not scheduled';
  return `${new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(d)} WAT`;
}

function priceLine(event: HostEvent): string {
  const { accessModel, ticketPrice, currency } = event.details;
  if (accessModel === 'FREE') return 'Free';
  if (!ticketPrice) return accessModel;
  return `${new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(ticketPrice))} · ${accessModel}`;
}

export function EventSummary({ event, meta }: { event: HostEvent; meta: StateMeta }) {
  const { details, stream } = event;
  return (
    <section className="panel" data-tour="event" data-guide="Event details">
      <header className="panel__header">
        <h2 className="panel__title">Event</h2>
        <span className="cat-tag">
          <span className="cat-tag__dot" style={{ background: CATEGORY_COLOR[details.category] }} />
          {details.category} · {details.city}
        </span>
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
            <span className="muted"> · {details.plannedDurationMinutes} min</span>
          </span>
        </div>
        <div className="summary__row">
          <span className="summary__key">Access</span>
          <span className="summary__val">{priceLine(event)}</span>
        </div>
        <div className="summary__row">
          <span className="summary__key">Tickets</span>
          <span className="summary__val">
            {details.ticketsSold} sold
            {details.ticketCapacity != null ? ` / ${details.ticketCapacity} capacity` : ''}
          </span>
        </div>
        <div className="summary__row">
          <span className="summary__key">Production</span>
          <span className="summary__val">
            {details.productionMode === 'HIRE'
              ? `Hired crew · ${details.crewCount} assigned`
              : 'Self-produced'}
          </span>
        </div>
        <div className="summary__row">
          <span className="summary__key">Stream</span>
          <span className="summary__val">
            <span className={`stream stream--${stream.status}`}>{stream.status}</span>
            {stream.status === 'active' && stream.bitrateKbps
              ? ` · ${stream.bitrateKbps} kbps · ${stream.viewers ?? 0} watching`
              : ''}
          </span>
        </div>
        <p className="summary__hint">{meta.description}</p>
      </div>
    </section>
  );
}
