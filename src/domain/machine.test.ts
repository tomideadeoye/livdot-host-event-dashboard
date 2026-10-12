import { describe, expect, test } from 'bun:test';
import type { HostEvent, ReadinessRequirement } from './types';
import { canTransition, isTransitionAllowed, transitionBlockers } from './machine';
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
      category: 'CONCERT',
      city: 'Lagos',
      scheduledStartAt: '2026-10-18T18:00:00.000Z',
      timezone: 'Africa/Lagos (WAT)',
      plannedDurationMinutes: 120,
      accessModel: 'PAID',
      currency: 'NGN',
      ticketPrice: '10000',
      ticketCapacity: 100,
      ticketsSold: 0,
      productionMode: 'SELF',
      crewCount: 0,
      replayAccess: 'INCLUDED',
      backupStreamEnabled: false,
    },
    state: 'scheduled',
    requirements: [
      req('crew_assigned', 'satisfied'),
      req('ingest_configured', 'satisfied'),
      req('ticket_pricing', 'satisfied'),
    ],
    stream: { status: 'idle', quality: 'good' },
    issues: [],
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
    expect(transitionBlockers(event, 'scheduled').map((b) => b.code)).toContain('missing-schedule');
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
    expect(transitionBlockers(event, 'ready_for_streaming')).toHaveLength(2);
    expect(canTransition(event, 'ready_for_streaming')).toBe(false);
  });

  test('ready transition passes when all blocking requirements are satisfied', () => {
    expect(canTransition(makeEvent(), 'ready_for_streaming')).toBe(true);
  });

  test('live transition is blocked when ingest is in an error state', () => {
    const event = makeEvent({
      state: 'ready_for_streaming',
      stream: { status: 'error', quality: 'good', message: 'ingest down' },
    });
    expect(transitionBlockers(event, 'live').map((b) => b.code)).toContain('stream-ingest-error');
  });
});

describe('reducer', () => {
  test('satisfying a requirement unblocks and allows the transition', () => {
    const blocked = makeEvent({
      requirements: [req('crew_assigned', 'satisfied'), req('ticket_pricing', 'missing')],
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
    const event = makeEvent({ requirements: [req('crew_assigned', 'missing')] });
    expect(eventReducer(event, { type: 'MARK_READY' })).toBe(event);
  });

  test('going live moves ingest into pending', () => {
    const live = eventReducer(makeEvent({ state: 'ready_for_streaming' }), { type: 'GO_LIVE' })!;
    expect(live.state).toBe('live');
    expect(live.stream.status).toBe('pending');
  });

  test('reporting an issue adds it to the event', () => {
    const next = eventReducer(makeEvent(), {
      type: 'REPORT_ISSUE',
      issue: {
        id: 'iss_1',
        type: 'QUALITY_ISSUE',
        status: 'OPEN',
        note: 'blurry',
        openedAt: new Date().toISOString(),
      },
    })!;
    expect(next.issues).toHaveLength(1);
    expect(next.issues[0].status).toBe('OPEN');
  });
});
