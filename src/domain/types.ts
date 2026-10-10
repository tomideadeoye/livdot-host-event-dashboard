/**
 * Domain types for the LIV DOT Host Event Dashboard.
 *
 * The domain is intentionally framework-agnostic: nothing here imports React.
 * UI components consume the *derived* view models produced by the selectors,
 * never these raw types directly. This keeps backend-state modelling separate
 * from rendering concerns.
 */

/** The event lifecycle, as defined by the assessment. Order is meaningful. */
export type EventState =
  | 'draft'
  | 'scheduled'
  | 'ready_for_streaming'
  | 'live'
  | 'completed'
  | 'replay_available';

/**
 * Readiness requirements. `blocking` marks whether the requirement gates the
 * transition into `ready_for_streaming`.
 */
export type RequirementId =
  | 'crew_assigned'
  | 'ingest_configured'
  | 'ticket_pricing';

/**
 * A four-state readiness value rather than a boolean.
 *
 * Real readiness checks are asynchronous and can be incomplete:
 *  - `satisfied` — the backend confirmed the requirement is met.
 *  - `missing`   — the backend confirmed it is NOT met (an actionable gap).
 *  - `pending`   — a check is in flight (e.g. crew assignment propagating).
 *  - `unknown`   — we have not been able to determine the status yet.
 *
 * Collapsing these into one boolean would hide the difference between
 * "definitely broken" and "we don't know yet" — which is exactly the
 * distinction an operator needs during a live event.
 */
export type RequirementStatus =
  | 'satisfied'
  | 'missing'
  | 'pending'
  | 'unknown';

export interface ReadinessRequirement {
  id: RequirementId;
  label: string;
  description: string;
  status: RequirementStatus;
  /** Only blocking requirements gate the ready transition. */
  blocking: boolean;
}

export interface EventDetails {
  id: string;
  title: string;
  host: string;
  /** ISO timestamp, or null when the event is still a draft. */
  scheduledStartAt: string | null;
  timezone: string;
  ticketCapacity: number | null;
  ticketsSold: number;
}

export type StreamStatus =
  | 'idle'
  | 'connecting'
  | 'healthy'
  | 'degraded'
  | 'failed';

export interface StreamHealth {
  status: StreamStatus;
  bitrateKbps?: number;
  viewers?: number;
  message?: string;
}

export interface HostEvent {
  details: EventDetails;
  state: EventState;
  requirements: ReadinessRequirement[];
  stream: StreamHealth;
}

/** Reducer mutations issued from the UI. */
export type EventCommand =
  | { type: 'SET_SCHEDULE'; startAt: string | null }
  | { type: 'SCHEDULE'; startAt: string }
  | { type: 'MARK_READY' }
  | { type: 'GO_LIVE' }
  | { type: 'END_STREAM' }
  | { type: 'PUBLISH_REPLAY' }
  | { type: 'SET_REQUIREMENT'; id: RequirementId; status: RequirementStatus }
  | { type: 'SET_STREAM'; stream: StreamHealth }
  | { type: 'RESET'; event: HostEvent };

/**
 * A structured reason why an action is unavailable. Surfacing *why* an action
 * is blocked (rather than just disabling a button) is a core requirement of
 * the assessment.
 */
export interface Blocker {
  code: string;
  message: string;
  requirementId?: RequirementId;
}
