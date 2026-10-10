import type { HostEvent, ReadinessRequirement, StreamHealth } from './types';

/**
 * Mock backend.
 *
 * The assessment explicitly allows simulated backend behaviour. Rather than
 * resolving instantly (which would hide the async states we were asked to
 * demonstrate), every call has latency and the seed data deliberately starts
 * with requirements in `pending` and `missing` so the "incomplete
 * configuration" and "blocked action" paths are visible on first paint.
 */

const LATENCY_MS = 600;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function seedRequirements(): ReadinessRequirement[] {
  return [
    {
      id: 'crew_assigned',
      label: 'Production crew assigned',
      description: 'A crew is allocated to run the broadcast setup and desk.',
      status: 'satisfied',
      blocking: true,
    },
    {
      id: 'ingest_configured',
      label: 'Streaming ingest configured',
      description: 'RTMP ingest endpoint and stream key are provisioned.',
      status: 'pending',
      blocking: true,
    },
    {
      id: 'ticket_pricing',
      label: 'Ticket pricing configured',
      description: 'At least one ticket tier with a price is published.',
      status: 'missing',
      blocking: true,
    },
  ];
}

export async function fetchEvent(): Promise<HostEvent> {
  await delay(LATENCY_MS);
  return {
    details: {
      id: 'evt_01HZX',
      title: 'Afrobeats Live Sessions — Finale',
      host: 'Tomide Adeoye',
      scheduledStartAt: '2026-10-18T19:00:00.000Z',
      timezone: 'Africa/Lagos (GMT+1)',
      ticketCapacity: 500,
      ticketsSold: 128,
    },
    state: 'scheduled',
    requirements: seedRequirements(),
    stream: { status: 'idle' },
  };
}

/**
 * Re-runs readiness checks server-side. Indeterminate statuses resolve to a
 * definite value; already-definite statuses are left alone.
 */
export async function recheckReadiness(
  event: HostEvent,
): Promise<ReadinessRequirement[]> {
  await delay(LATENCY_MS);
  return event.requirements.map((r) => {
    if (r.status === 'pending') return { ...r, status: 'satisfied' };
    if (r.status === 'unknown') return { ...r, status: 'missing' };
    return r;
  });
}

export async function startStream(): Promise<StreamHealth> {
  await delay(1200);
  return {
    status: 'healthy',
    bitrateKbps: 4500,
    viewers: 0,
    message: 'Ingest healthy.',
  };
}
