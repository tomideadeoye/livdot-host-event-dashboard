import type {
  Blocker,
  EventState,
  HostEvent,
  ReadinessRequirement,
} from './types';

/**
 * The lifecycle ordered as operators experience it. Used to render the
 * timeline and to reason about "done / current / upcoming" segments.
 */
export const LIFECYCLE: EventState[] = [
  'draft',
  'scheduled',
  'ready_for_streaming',
  'live',
  'completed',
  'replay_available',
];

export interface StateMeta {
  label: string;
  shortLabel: string;
  description: string;
  /** Semantic tone used by the UI to colour the state badge. */
  tone: 'neutral' | 'info' | 'ready' | 'live' | 'done' | 'muted';
}

export const STATE_META: Record<EventState, StateMeta> = {
  draft: {
    label: 'Draft',
    shortLabel: 'Draft',
    description: 'Event created but not yet scheduled.',
    tone: 'neutral',
  },
  scheduled: {
    label: 'Scheduled',
    shortLabel: 'Scheduled',
    description: 'Event scheduled but not ready to stream.',
    tone: 'info',
  },
  ready_for_streaming: {
    label: 'Ready for Streaming',
    shortLabel: 'Ready',
    description: 'All readiness requirements satisfied.',
    tone: 'ready',
  },
  live: {
    label: 'Live',
    shortLabel: 'Live',
    description: 'Event is currently broadcasting.',
    tone: 'live',
  },
  completed: {
    label: 'Completed',
    shortLabel: 'Completed',
    description: 'Event has ended.',
    tone: 'done',
  },
  replay_available: {
    label: 'Replay Available',
    shortLabel: 'Replay',
    description: 'Catch-up viewing is enabled.',
    tone: 'muted',
  },
};

/** Allowed forward transitions. Anything not listed here is invalid. */
const TRANSITIONS: Record<EventState, EventState[]> = {
  draft: ['scheduled'],
  scheduled: ['ready_for_streaming'],
  ready_for_streaming: ['live'],
  live: ['completed'],
  completed: ['replay_available'],
  replay_available: [],
};

export function isTransitionAllowed(from: EventState, to: EventState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getRequirement(
  event: HostEvent,
  id: string,
): ReadinessRequirement | undefined {
  return event.requirements.find((r) => r.id === id);
}

/** Blocking requirements that are not yet satisfied, expressed as blockers. */
export function unmetReadinessBlockers(event: HostEvent): Blocker[] {
  return event.requirements
    .filter((r) => r.blocking && r.status !== 'satisfied')
    .map((r) => ({
      code: `requirement:${r.id}:${r.status}`,
      requirementId: r.id,
      message:
        r.status === 'missing'
          ? `${r.label} is not configured yet.`
          : r.status === 'pending'
            ? `${r.label} is still being verified.`
            : `${r.label} status is unknown — recheck readiness.`,
    }));
}

/**
 * Guards for a requested transition. Returns the structured blockers that
 * explain why the transition may not proceed. Empty array == allowed.
 *
 * This is the single source of truth for "why is this action blocked" — the
 * UI never hard-codes blockers; it renders whatever the machine returns.
 */
export function transitionBlockers(
  event: HostEvent,
  to: EventState,
): Blocker[] {
  if (!isTransitionAllowed(event.state, to)) {
    return [
      {
        code: 'invalid-transition',
        message: `Cannot move from “${STATE_META[event.state].label}” to “${STATE_META[to].label}”.`,
      },
    ];
  }

  const blockers: Blocker[] = [];

  if (to === 'scheduled' && !event.details.scheduledStartAt) {
    blockers.push({
      code: 'missing-schedule',
      message: 'Set a start date and time before scheduling the event.',
    });
  }

  if (to === 'ready_for_streaming') {
    blockers.push(...unmetReadinessBlockers(event));
  }

  if (to === 'live') {
    // Defensive re-check: readiness can regress while waiting.
    blockers.push(...unmetReadinessBlockers(event));
    if (event.stream.status === 'error') {
      blockers.push({
        code: 'stream-ingest-error',
        message: 'Ingest is in an error state — resolve the stream before going live.',
      });
    }
  }

  return blockers;
}

export function canTransition(event: HostEvent, to: EventState): boolean {
  return transitionBlockers(event, to).length === 0;
}
