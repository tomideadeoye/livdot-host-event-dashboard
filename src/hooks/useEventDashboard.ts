'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type {
  EventCommand,
  EventState,
  HostEvent,
  Issue,
  IssueType,
  ProductionMode,
  ReplayAccess,
  RequirementId,
  RequirementStatus,
  StreamHealth,
} from '@/domain/types';
import { eventReducer } from '@/domain/reducer';
import { deriveDashboard, type DashboardView } from '@/domain/selectors';
import { fetchEvent, recheckReadiness, startStream } from '@/domain/mockApi';

type LoadStatus = 'loading' | 'ready' | 'error';

export interface EventDashboardController {
  status: LoadStatus;
  event: HostEvent | null;
  view: DashboardView | null;
  activity: string[];
  liveSince: number | null;
  dispatch: (command: EventCommand) => void;
  recheck: () => Promise<void>;
  setRequirement: (id: RequirementId, status: RequirementStatus) => void;
  setStream: (stream: StreamHealth) => void;
  setSchedule: (startAt: string | null) => void;
  setReplayAccess: (access: ReplayAccess) => void;
  setProductionMode: (mode: ProductionMode) => void;
  toggleBackup: () => void;
  reportIssue: (type: IssueType) => void;
  resolveIssue: (id: string) => void;
  simulateState: (state: EventState) => void;
}

function requirementsFor(state: EventState): HostEvent['requirements'] {
  const settled = state !== 'draft' && state !== 'scheduled';
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
      status: settled ? 'satisfied' : 'pending',
      blocking: true,
    },
    {
      id: 'ticket_pricing',
      label: 'Ticket pricing configured',
      description: 'At least one ticket tier with a price is published.',
      status: settled ? 'satisfied' : 'missing',
      blocking: true,
    },
  ];
}

function streamFor(state: EventState): StreamHealth {
  if (state === 'live')
    return { status: 'active', quality: 'good', bitrateKbps: 4500, viewers: 128, message: 'Ingest healthy.' };
  if (state === 'completed' || state === 'replay_available') return { status: 'ended', quality: 'good' };
  return { status: 'idle', quality: 'good' };
}

export function useEventDashboard(): EventDashboardController {
  const [event, dispatch] = useReducer(eventReducer, null as HostEvent | null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [activity, setActivity] = useState<string[]>([]);
  const [liveSince, setLiveSince] = useState<number | null>(null);

  const log = useCallback((entry: string) => {
    const stamp = new Date().toLocaleTimeString();
    setActivity((prev) => [`${stamp}  ${entry}`, ...prev].slice(0, 14));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchEvent()
      .then((seed) => {
        if (cancelled) return;
        dispatch({ type: 'RESET', event: seed });
        setStatus('ready');
        log('Loaded event from host API');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [log]);

  // Track when the event goes live (for the uptime readout).
  useEffect(() => {
    if (event?.state === 'live') setLiveSince((prev) => prev ?? Date.now());
    else setLiveSince(null);
  }, [event?.state]);

  // When the event enters `live`, simulate the ingest coming up.
  useEffect(() => {
    if (event?.state === 'live' && event.stream.status === 'pending') {
      let cancelled = false;
      startStream().then((stream) => {
        if (cancelled) return;
        dispatch({ type: 'SET_STREAM', stream });
        log('Ingest connected — stream active');
      });
      return () => {
        cancelled = true;
      };
    }
  }, [event?.state, event?.stream.status, log]);

  const guardedDispatch = useCallback(
    (command: EventCommand) => {
      const label = describeCommand(command);
      if (label) log(label);
      dispatch(command);
    },
    [log],
  );

  const recheck = useCallback(async () => {
    if (!event) return;
    log('Rechecking readiness…');
    const requirements = await recheckReadiness(event);
    const resolved = requirements.filter((r, i) => r.status !== event.requirements[i].status).length;
    requirements.forEach((r) => dispatch({ type: 'SET_REQUIREMENT', id: r.id, status: r.status }));
    log(resolved > 0 ? `Readiness rechecked — ${resolved} updated` : 'Readiness rechecked — no changes');
  }, [event, log]);

  const setRequirement = useCallback(
    (id: RequirementId, next: RequirementStatus) => {
      dispatch({ type: 'SET_REQUIREMENT', id, status: next });
      log(`Simulator: ${id} → ${next}`);
    },
    [log],
  );

  const setStream = useCallback(
    (stream: StreamHealth) => {
      dispatch({ type: 'SET_STREAM', stream });
      log(`Simulator: stream → ${stream.status}`);
    },
    [log],
  );

  const setSchedule = useCallback(
    (startAt: string | null) => {
      dispatch({ type: 'SET_SCHEDULE', startAt });
      log(`Simulator: start time → ${startAt ?? 'unset'}`);
    },
    [log],
  );

  const setReplayAccess = useCallback(
    (access: ReplayAccess) => {
      dispatch({ type: 'SET_REPLAY_ACCESS', access });
      log(`Replay access → ${access}`);
    },
    [log],
  );

  const setProductionMode = useCallback(
    (mode: ProductionMode) => {
      dispatch({ type: 'SET_PRODUCTION_MODE', mode });
      log(`Production mode → ${mode}`);
    },
    [log],
  );

  const toggleBackup = useCallback(() => {
    dispatch({ type: 'TOGGLE_BACKUP_STREAM' });
    log('Backup stream toggled');
  }, [log]);

  const reportIssue = useCallback(
    (type: IssueType) => {
      const issue: Issue = {
        id: `iss_${Date.now()}`,
        type,
        status: 'OPEN',
        note: 'Reported from the host dashboard.',
        openedAt: new Date().toISOString(),
      };
      dispatch({ type: 'REPORT_ISSUE', issue });
      log(`Issue reported: ${type}`);
    },
    [log],
  );

  const resolveIssue = useCallback(
    (id: string) => {
      dispatch({ type: 'RESOLVE_ISSUE', id });
      log('Issue resolved');
    },
    [log],
  );

  const simulateState = useCallback(
    (state: EventState) => {
      if (!event) return;
      dispatch({
        type: 'RESET',
        event: { ...event, state, requirements: requirementsFor(state), stream: streamFor(state) },
      });
      log(`Simulator: jumped to "${state}"`);
    },
    [event, log],
  );

  const view = useMemo(() => (event ? deriveDashboard(event) : null), [event]);

  return {
    status,
    event,
    view,
    activity,
    liveSince,
    dispatch: guardedDispatch,
    recheck,
    setRequirement,
    setStream,
    setSchedule,
    setReplayAccess,
    setProductionMode,
    toggleBackup,
    reportIssue,
    resolveIssue,
    simulateState,
  };
}

function describeCommand(command: EventCommand): string | null {
  switch (command.type) {
    case 'SCHEDULE':
      return 'Action: schedule event';
    case 'MARK_READY':
      return 'Action: mark ready for streaming';
    case 'GO_LIVE':
      return 'Action: go live';
    case 'END_STREAM':
      return 'Action: end stream';
    case 'PUBLISH_REPLAY':
      return 'Action: publish replay';
    default:
      return null;
  }
}
