/**
 * Domain types for the LIV DOT Host Event Dashboard.
 *
 * The domain is intentionally framework-agnostic: nothing here imports React.
 * UI components consume the *derived* view models produced by the selectors,
 * never these raw types directly.
 *
 * Vocabulary (status values, production mode, replay access, dispute types)
 * deliberately mirrors LIV DOT's own platform contracts so the model reads
 * the way the real backend does.
 */

/**
 * The event lifecycle as described in the assessment brief.
 *
 * It maps onto LIV DOT's platform status enum as follows:
 *   draft            → DRAFT
 *   scheduled        → SCHEDULED
 *   ready_for_streaming → READY_FOR_TEST
 *   live             → LIVE
 *   completed        → ENDED
 *   replay_available → REPLAY_READY
 * (The platform additionally exposes ARCHIVED / CANCELLED / PAUSED / FAILED,
 * which are out of scope for the preparation-focused dashboard.)
 */
export type EventState =
  | 'draft'
  | 'scheduled'
  | 'ready_for_streaming'
  | 'live'
  | 'completed'
  | 'replay_available';

/** Readiness requirements that gate the "ready for streaming" transition. */
export type RequirementId = 'crew_assigned' | 'ingest_configured' | 'ticket_pricing';

/**
 * A four-state readiness value rather than a boolean.
 *
 * Real readiness checks are asynchronous and can be incomplete:
 *   satisfied — the backend confirmed the requirement is met
 *   missing   — the backend confirmed it is NOT met (actionable)
 *   pending   — a check is in flight
 *   unknown   — we have not been able to determine the status yet
 *
 * Collapsing these into one boolean hides the difference between "definitely
 * broken" and "we don't know yet" — exactly the distinction an operator needs.
 */
export type RequirementStatus = 'satisfied' | 'missing' | 'pending' | 'unknown';

export interface ReadinessRequirement {
  id: RequirementId;
  label: string;
  description: string;
  status: RequirementStatus;
  /** Only blocking requirements gate the ready transition. */
  blocking: boolean;
}

export type ProductionMode = 'SELF' | 'HIRE';
export type AccessModel = 'FREE' | 'PAID' | 'SUBSCRIPTION';
export type ReplayAccess = 'INCLUDED' | 'DISABLED' | 'PAID_SEPARATELY';
export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR';

export type EventCategory =
  | 'CONCERT'
  | 'FESTIVAL'
  | 'WEDDING'
  | 'CORPORATE'
  | 'RELIGIOUS'
  | 'COMEDY'
  | 'SPORTS'
  | 'CONFERENCE';

export interface EventDetails {
  id: string;
  title: string;
  host: string;
  category: EventCategory;
  city: string;
  /** ISO timestamp, or null while still a draft. */
  scheduledStartAt: string | null;
  timezone: string;
  plannedDurationMinutes: number;
  accessModel: AccessModel;
  currency: Currency;
  ticketPrice: string | null;
  ticketCapacity: number | null;
  ticketsSold: number;
  productionMode: ProductionMode;
  crewCount: number;
  replayAccess: ReplayAccess;
  backupStreamEnabled: boolean;
}

/** Stream status values, mirroring the platform's streaming contract. */
export type StreamStatus = 'idle' | 'pending' | 'active' | 'error' | 'ended';
export type StreamQuality = 'good' | 'low';

export interface StreamHealth {
  status: StreamStatus;
  quality: StreamQuality;
  bitrateKbps?: number;
  viewers?: number;
  message?: string;
}

/** Operational issues (refund/dispute model from the platform contracts). */
export type IssueType =
  | 'SERVICE_NOT_DELIVERED'
  | 'QUALITY_ISSUE'
  | 'PAYMENT_DISPUTE'
  | 'OTHER';
export type IssueStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';

export interface Issue {
  id: string;
  type: IssueType;
  status: IssueStatus;
  note: string;
  openedAt: string;
}

export interface HostEvent {
  details: EventDetails;
  state: EventState;
  requirements: ReadinessRequirement[];
  stream: StreamHealth;
  issues: Issue[];
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
  | { type: 'SET_REPLAY_ACCESS'; access: ReplayAccess }
  | { type: 'SET_PRODUCTION_MODE'; mode: ProductionMode }
  | { type: 'TOGGLE_BACKUP_STREAM' }
  | { type: 'REPORT_ISSUE'; issue: Issue }
  | { type: 'RESOLVE_ISSUE'; id: string }
  | { type: 'RESET'; event: HostEvent };

/**
 * A structured reason why an action is unavailable. Surfacing *why* an action
 * is blocked (rather than just disabling a button) is a core requirement.
 */
export interface Blocker {
  code: string;
  message: string;
  requirementId?: RequirementId;
}
