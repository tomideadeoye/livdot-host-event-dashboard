export function ActivityLog({ entries }: { entries: string[] }) {
  return (
    <section className="panel" data-guide="Operator activity log">
      <header className="panel__header">
        <h2 className="panel__title">Operator activity</h2>
      </header>
      {entries.length === 0 ? (
        <p className="muted">No activity yet.</p>
      ) : (
        <ul className="activity">
          {entries.map((entry, i) => (
            <li key={`${entry}-${i}`} className="activity__item">
              {entry}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
