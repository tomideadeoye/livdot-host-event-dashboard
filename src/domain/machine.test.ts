import { describe, expect, test } from 'bun:test';
import type { HostEvent, ReadinessRequirement } from './types';
import {
  canTransition,
  isTransitionAllowed,
  transitionBlockers,
} from './machine';
import { eventReducer } from './reducer';

function req(
  id: ReadinessRequirement['id'],
  status: ReadinessRequirement['status'],
): ReadinessRequirement {
  return { id, label: id, description: '', status, blocking: true };
}

function makeEvent(overrides: Partial<HostEvent> = {}): HostEvent {
  return {
    details: {
      id: 'evt_1',
      title: 'Test Event',
      host: 'Tester',
      scheduledStartAt: '2026-10-18T19:00:00.000Z',
      timezone: 'UTC',
      ticketCapacity: 100,
      ticketsSold: 0,
    },
    state: 'scheduled',
    requirements: [
      req('crew_assigned', 'satisfied'),
      req('ingest_configured', 'satisfied'),
      req('ticket_pricing', 'satisfied'),
    ],
    stream: { status: 'idle' },
    ...overrides,
  };
}

describe('lifecycle guards', () => {
  test('only forward transitions are allowed', () => {
    expect(isTransitionAllowed('draft', 'scheduled')).toBe(true);
    expect(isTransitionAllowed('draft', 'live')).toBe(false);
    expect(isTransitionAllowed('live', 'draft')).toBe(false);
    expect(isTransitionAllowed('replay_available', 'live')).toBe(false);
  });

  test('draft cannot be scheduled without a start time', () => {
    const event = makeEvent({
      state: 'draft',
      details: { ...makeEvent().details, scheduledStartAt: null },
    });
    const blockers = transitionBlockers(event, 'scheduled');
    expect(blockers.map((b) => b.code)).toContain('missing-schedule');
    expect(canTransition(event, 'scheduled')).toBe(false);
  });

  test('ready transition is blocked by unmet requirements', () => {
    const event = makeEvent({
      requirements: [
        req('crew_assigned', 'satisfied'),
        req('ingest_configured', 'pending'),
        req('ticket_pricing', 'missing'),
      ],
    });
    const blockers = transitionBlockers(event, 'ready_for_streaming');
    expect(blockers).toHaveLength(2);
    expect(canTransition(event, 'ready_for_streaming')).toBe(false);
  });

  test('ready transition passes when all blocking requirements are satisfied', () => {
    expect(canTransition(makeEvent(), 'ready_for_streaming')).toBe(true);
  });

  test('live transition is blocked when ingest has failed', () => {
    const event = makeEvent({
      state: 'ready_for_streaming',
      stream: { status: 'failed', message: 'ingest down' },
    });
    const blockers = transitionBlockers(event, 'live');
    expect(blockers.map((b) => b.code)).toContain('stream-ingest-failed');
  });
});

describe('reducer', () => {
  test('applies a satisfied requirement and unblocks the transition', () => {
    const blocked = makeEvent({
      requirements: [
        req('crew_assigned', 'satisfied'),
        req('ingest_configured', 'satisfied'),
        req('ticket_pricing', 'missing'),
      ],
    });
    expect(canTransition(blocked, 'ready_for_streaming')).toBe(false);

    const fixed = eventReducer(blocked, {
      type: 'SET_REQUIREMENT',
      id: 'ticket_pricing',
      status: 'satisfied',
    })!;
    expect(canTransition(fixed, 'ready_for_streaming')).toBe(true);

    const ready = eventReducer(fixed, { type: 'MARK_READY' })!;
    expect(ready.state).toBe('ready_for_streaming');
  });

  test('rejects a blocked transition (no-op)', () => {
    const event = makeEvent({
      requirements: [req('crew_assigned', 'missing')],
    });
    const next = eventReducer(event, { type: 'MARK_READY' });
    expect(next).toBe(event);
  });

  test('going live moves ingest into connecting', () => {
    const event = makeEvent({ state: 'ready_for_streaming' });
    const live = eventReducer(event, { type: 'GO_LIVE' })!;
    expect(live.state).toBe('live');
    expect(live.stream.status).toBe('connecting');
  });
});
