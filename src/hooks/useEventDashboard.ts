'use client';

import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type {
  EventCommand,
  EventState,
  HostEvent,
  RequirementId,
  RequirementStatus,
  StreamHealth,
} from '@/domain/types';
import { eventReducer } from '@/domain/reducer';
import { deriveDashboard, type DashboardView } from '@/domain/selectors';
import {
  fetchEvent,
  recheckReadiness,
  startStream,
} from '@/domain/mockApi';

type LoadStatus = 'loading' | 'ready' | 'error';

export interface EventDashboardController {
  status: LoadStatus;
  event: HostEvent | null;
  view: DashboardView | null;
  activity: string[];
  dispatch: (command: EventCommand) => void;
  recheck: () => Promise<void>;
  setRequirement: (id: RequirementId, status: RequirementStatus) => void;
  setStream: (stream: StreamHealth) => void;
  setSchedule: (startAt: string | null) => void;
  simulateState: (state: EventState) => void;
}

function requirementsFor(state: EventState): HostEvent['requirements'] {
  // Past `scheduled` we assume configuration is complete; before that we keep
  // a deliberately mixed state so blocked-state UI is demonstrable.
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
      description: 'RTMP ingest endpoint and stream key are provisioned.',
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
  if (state === 'live') return { status: 'healthy', bitrateKbps: 4500, viewers: 128, message: 'Ingest healthy.' };
  if (state === 'completed' || state === 'replay_available') return { status: 'idle' };
  return { status: 'idle' };
}

export function useEventDashboard(): EventDashboardController {
  const [event, dispatch] = useReducer(eventReducer, null as HostEvent | null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [activity, setActivity] = useState<string[]>([]);

  const log = useCallback((entry: string) => {
    const stamp = new Date().toLocaleTimeString();
    setActivity((prev) => [`${stamp}  ${entry}`, ...prev].slice(0, 12));
  }, []);

  // Initial load.
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

  // When the event enters `live`, simulate the ingest coming up.
  useEffect(() => {
    if (event?.state === 'live' && event.stream.status === 'connecting') {
      let cancelled = false;
      startStream().then((stream) => {
        if (cancelled) return;
        dispatch({ type: 'SET_STREAM', stream });
        log('Ingest connected — stream healthy');
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
    const resolved = requirements.filter(
      (r, i) => r.status !== event.requirements[i].status,
    ).length;
    requirements.forEach((r) =>
      dispatch({ type: 'SET_REQUIREMENT', id: r.id, status: r.status }),
    );
    log(
      resolved > 0
        ? `Readiness rechecked — ${resolved} requirement(s) updated`
        : 'Readiness rechecked — no changes',
    );
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

  const simulateState = useCallback(
    (state: EventState) => {
      if (!event) return;
      dispatch({
        type: 'RESET',
        event: {
          ...event,
          state,
          requirements: requirementsFor(state),
          stream: streamFor(state),
        },
      });
      log(`Simulator: jumped to “${state}”`);
    },
    [event, log],
  );

  const view = useMemo(() => (event ? deriveDashboard(event) : null), [event]);

  return {
    status,
    event,
    view,
    activity,
    dispatch: guardedDispatch,
    recheck,
    setRequirement,
    setStream,
    setSchedule,
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
