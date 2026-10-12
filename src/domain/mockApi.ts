import type { HostEvent, ReadinessRequirement, StreamHealth } from './types';

/**
 * Mock backend.
 *
 * The assessment allows simulated backend behaviour. Rather than resolving
 * instantly (which would hide the async states we were asked to demonstrate),
 * every call has latency and the seed data deliberately starts with
 * requirements in `pending` and `missing` so the "incomplete configuration"
 * and "blocked action" paths are visible on first paint.
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
      description: 'RTMPS/SRT ingest endpoint and stream key are provisioned.',
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
      category: 'CONCERT',
      city: 'Lagos',
      scheduledStartAt: '2026-10-18T18:00:00.000Z',
      timezone: 'Africa/Lagos (WAT)',
      plannedDurationMinutes: 150,
      accessModel: 'PAID',
      currency: 'NGN',
      ticketPrice: '15000',
      ticketCapacity: 500,
      ticketsSold: 128,
      productionMode: 'HIRE',
      crewCount: 3,
      replayAccess: 'INCLUDED',
      backupStreamEnabled: true,
    },
    state: 'scheduled',
    requirements: seedRequirements(),
    stream: { status: 'idle', quality: 'good' },
    issues: [],
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
  return { status: 'active', quality: 'good', bitrateKbps: 4500, viewers: 0, message: 'Ingest healthy.' };
}
