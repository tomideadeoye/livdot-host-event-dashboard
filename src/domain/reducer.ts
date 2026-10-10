import type { EventCommand, HostEvent } from './types';
import { transitionBlockers } from './machine';

/**
 * Pure reducer. Every state change funnels through here so the lifecycle is
 * auditable and testable without React. Guarded transitions that are blocked
 * are rejected at the reducer boundary too — the UI disabling a button is a
 * convenience, not the safety net.
 */
export function eventReducer(
  event: HostEvent | null,
  command: EventCommand,
): HostEvent | null {
  if (event === null) {
    return command.type === 'RESET' ? command.event : null;
  }

  switch (command.type) {
    case 'SET_REQUIREMENT':
      return {
        ...event,
        requirements: event.requirements.map((r) =>
          r.id === command.id ? { ...r, status: command.status } : r,
        ),
      };

    case 'SET_STREAM':
      return { ...event, stream: command.stream };

    case 'RESET':
      return command.event;

    case 'SET_SCHEDULE':
      return {
        ...event,
        details: { ...event.details, scheduledStartAt: command.startAt },
      };

    case 'SCHEDULE': {
      const next = {
        ...event,
        details: { ...event.details, scheduledStartAt: command.startAt },
      };
      return applyTransition(next, 'scheduled');
    }

    case 'MARK_READY':
      return applyTransition(event, 'ready_for_streaming');

    case 'GO_LIVE':
      return applyTransition(event, 'live');

    case 'END_STREAM':
      return applyTransition(event, 'completed');

    case 'PUBLISH_REPLAY':
      return applyTransition(event, 'replay_available');

    default:
      return event;
  }
}

function applyTransition(event: HostEvent, to: HostEvent['state']): HostEvent {
  if (transitionBlockers(event, to).length > 0) {
    return event; // blocked — no-op
  }
  if (to === 'live') {
    return { ...event, state: to, stream: { status: 'connecting' } };
  }
  if (to === 'completed') {
    return { ...event, state: to, stream: { ...event.stream, status: 'idle' } };
  }
  return { ...event, state: to };
}
