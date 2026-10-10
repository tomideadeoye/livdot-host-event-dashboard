import type { Alert } from '@/domain/selectors';

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="alerts">
      {alerts.map((a) => (
        <div key={a.id} className={`alert alert--${a.severity}`} role="status">
          <span className="alert__tag">{a.severity}</span>
          <div>
            <strong className="alert__title">{a.title}</strong>
            <p className="alert__msg">{a.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
