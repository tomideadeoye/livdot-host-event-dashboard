import type { ActionDescriptor } from '@/domain/selectors';

export function ActionsPanel({
  actions,
  onAction,
  busy,
}: {
  actions: ActionDescriptor[];
  onAction: (id: string) => void;
  busy?: boolean;
}) {
  if (actions.length === 0) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h2 className="panel__title">Actions</h2>
        </header>
        <p className="muted">No further actions — the event is complete.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <h2 className="panel__title">Actions</h2>
      </header>
      {actions.map((action) => (
        <div key={action.id} className="action">
          <button
            className="btn btn--primary"
            onClick={() => onAction(action.id)}
            disabled={!action.enabled || busy}
            aria-disabled={!action.enabled}
          >
            {action.label}
          </button>
          <p className="action__desc">{action.description}</p>

          {!action.enabled && action.blockers.length > 0 && (
            <div className="blockers" role="note">
              <span className="blockers__title">Blocked because:</span>
              <ul>
                {action.blockers.map((b) => (
                  <li key={b.code}>{b.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
