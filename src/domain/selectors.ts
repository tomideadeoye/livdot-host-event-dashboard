import type { Blocker, EventState, HostEvent } from './types';
import {
  LIFECYCLE,
  STATE_META,
  transitionBlockers,
  type StateMeta,
} from './machine';

export type TimelineStatus = 'done' | 'current' | 'upcoming' | 'unreachable';

export interface TimelineStep {
  state: EventState;
  label: string;
  status: TimelineStatus;
}

export interface ReadinessView {
  requirements: HostEvent['requirements'];
  satisfied: number;
  blocking: number;
  blockingSatisfied: number;
  isReady: boolean;
  hasIndeterminate: boolean;
}

export interface ActionDescriptor {
  id: string;
  label: string;
  description: string;
  to: EventState;
  enabled: boolean;
  blockers: Blocker[];
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
}

export interface DashboardView {
  stateMeta: StateMeta;
  timeline: TimelineStep[];
  readiness: ReadinessView;
  actions: ActionDescriptor[];
  alerts: Alert[];
  openIssues: number;
}

const ACTION_FOR_STATE: Record<
  EventState,
  { id: string; label: string; description: string; to: EventState } | null
> = {
  draft: {
    id: 'schedule',
    label: 'Schedule event',
    description: 'Lock in the broadcast start time and move to Scheduled.',
    to: 'scheduled',
  },
  scheduled: {
    id: 'mark_ready',
    label: 'Mark ready for streaming',
    description: 'Confirm every readiness requirement and arm the event.',
    to: 'ready_for_streaming',
  },
  ready_for_streaming: {
    id: 'go_live',
    label: 'Go live',
    description: 'Start broadcasting to ticketed viewers.',
    to: 'live',
  },
  live: {
    id: 'end_stream',
    label: 'End stream',
    description: 'Stop the broadcast and finalise the event.',
    to: 'completed',
  },
  completed: {
    id: 'publish_replay',
    label: 'Publish replay',
    description: 'Enable catch-up viewing for ticket holders.',
    to: 'replay_available',
  },
  replay_available: null,
};

function buildTimeline(current: EventState): TimelineStep[] {
  const currentIndex = LIFECYCLE.indexOf(current);
  return LIFECYCLE.map((state, index) => {
    const status: TimelineStatus =
      index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
    return { state, label: STATE_META[state].label, status };
  });
}

function buildReadiness(event: HostEvent): ReadinessView {
  const blockingReqs = event.requirements.filter((r) => r.blocking);
  const blockingSatisfied = blockingReqs.filter((r) => r.status === 'satisfied').length;
  return {
    requirements: event.requirements,
    satisfied: event.requirements.filter((r) => r.status === 'satisfied').length,
    blocking: blockingReqs.length,
    blockingSatisfied,
    isReady: blockingReqs.length > 0 && blockingSatisfied === blockingReqs.length,
    hasIndeterminate: event.requirements.some(
      (r) => r.status === 'pending' || r.status === 'unknown',
    ),
  };
}

function buildActions(event: HostEvent): ActionDescriptor[] {
  const spec = ACTION_FOR_STATE[event.state];
  if (!spec) return [];
  const blockers = transitionBlockers(event, spec.to);
  return [
    {
      id: spec.id,
      label: spec.label,
      description: spec.description,
      to: spec.to,
      enabled: blockers.length === 0,
      blockers,
    },
  ];
}

function buildAlerts(event: HostEvent, readiness: ReadinessView): Alert[] {
  const alerts: Alert[] = [];
  const openIssues = event.issues.filter((i) => i.status !== 'RESOLVED').length;

  if (event.stream.status === 'error') {
    alerts.push({
      id: 'stream-error',
      severity: 'critical',
      title: 'Stream ingest error',
      message:
        event.stream.message ??
        'The broadcast ingest reports an error. Viewers cannot receive the stream until it is restored.',
    });
  } else if (event.stream.status === 'active' && event.stream.quality === 'low') {
    alerts.push({
      id: 'stream-degraded',
      severity: 'warning',
      title: 'Stream quality degraded',
      message:
        event.stream.message ??
        'Bitrate has dropped below the target. Check the production crew and network.',
    });
  }

  if (
    (event.state === 'scheduled' || event.state === 'ready_for_streaming') &&
    !readiness.isReady
  ) {
    const remaining = readiness.blocking - readiness.blockingSatisfied;
    alerts.push({
      id: 'readiness-incomplete',
      severity: 'warning',
      title: 'Not ready to stream',
      message: `${remaining} of ${readiness.blocking} blocking requirement${
        remaining === 1 ? '' : 's'
      } still need attention before the event can go live.`,
    });
  }

  if (readiness.hasIndeterminate) {
    alerts.push({
      id: 'readiness-indeterminate',
      severity: 'info',
      title: 'Readiness check incomplete',
      message:
        'Some requirements are still being verified. Recheck readiness to refresh their status.',
    });
  }

  if (openIssues > 0) {
    alerts.push({
      id: 'open-issues',
      severity: 'warning',
      title: `${openIssues} open issue${openIssues === 1 ? '' : 's'}`,
      message: 'Viewer-reported issues are open. Review and resolve them below.',
    });
  }

  return alerts;
}

/**
 * The single derivation point: raw event state in, everything the UI renders
 * out. Components stay dumb; business rules live here and in the machine.
 */
export function deriveDashboard(event: HostEvent): DashboardView {
  const readiness = buildReadiness(event);
  return {
    stateMeta: STATE_META[event.state],
    timeline: buildTimeline(event.state),
    readiness,
    actions: buildActions(event),
    alerts: buildAlerts(event, readiness),
    openIssues: event.issues.filter((i) => i.status !== 'RESOLVED').length,
  };
}
