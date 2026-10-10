import type { StateMeta } from '@/domain/machine';
import type { RequirementStatus } from '@/domain/types';

export function StatusBadge({ meta }: { meta: StateMeta }) {
  return (
    <span className={`badge badge--${meta.tone}`}>
      <span className="badge__dot" aria-hidden />
      {meta.label}
    </span>
  );
}

const REQUIREMENT_LABEL: Record<RequirementStatus, string> = {
  satisfied: 'Satisfied',
  missing: 'Missing',
  pending: 'Checking',
  unknown: 'Unknown',
};

export function RequirementBadge({ status }: { status: RequirementStatus }) {
  return (
    <span className={`req-badge req-badge--${status}`}>
      {REQUIREMENT_LABEL[status]}
    </span>
  );
}
