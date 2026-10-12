import type { TimelineStep } from '@/domain/selectors';

const MARK: Record<TimelineStep['status'], string> = {
  done: '✓',
  current: '●',
  upcoming: '○',
  unreachable: '✕',
};

export function StateTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="timeline">
      {steps.map((step) => (
        <li
          key={step.state}
          className={`timeline__step timeline__step--${step.status}`}
          data-guide={`Lifecycle: ${step.label} (${step.status})`}
        >
          <span className="timeline__mark" aria-hidden>
            {MARK[step.status]}
          </span>
          <span className="timeline__label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
