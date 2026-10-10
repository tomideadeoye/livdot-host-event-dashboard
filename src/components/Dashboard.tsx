'use client';

import { useState } from 'react';
import type { EventCommand } from '@/domain/types';
import { useEventDashboard } from '@/hooks/useEventDashboard';
import { StatusBadge } from './StatusBadge';
import { StateTimeline } from './StateTimeline';
import { EventSummary } from './EventSummary';
import { ReadinessPanel } from './ReadinessPanel';
import { AlertsPanel } from './AlertsPanel';
import { ActionsPanel } from './ActionsPanel';
import { SimulatorPanel } from './SimulatorPanel';
import { ActivityLog } from './ActivityLog';

function commandForAction(
  id: string,
  scheduledStartAt: string | null,
): EventCommand | null {
  switch (id) {
    case 'schedule':
      return { type: 'SCHEDULE', startAt: scheduledStartAt ?? new Date().toISOString() };
    case 'mark_ready':
      return { type: 'MARK_READY' };
    case 'go_live':
      return { type: 'GO_LIVE' };
    case 'end_stream':
      return { type: 'END_STREAM' };
    case 'publish_replay':
      return { type: 'PUBLISH_REPLAY' };
    default:
      return null;
  }
}

export function Dashboard() {
  const c = useEventDashboard();
  const [rechecking, setRechecking] = useState(false);

  if (c.status === 'loading' || !c.event || !c.view) {
    return <div className="state-screen">Loading event…</div>;
  }
  if (c.status === 'error') {
    return <div className="state-screen">Failed to load the event.</div>;
  }

  const { event, view } = c;

  const onAction = (id: string) => {
    const command = commandForAction(id, event.details.scheduledStartAt);
    if (command) c.dispatch(command);
  };

  const onRecheck = async () => {
    setRechecking(true);
    try {
      await c.recheck();
    } finally {
      setRechecking(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <p className="dash-header__eyebrow">LIV DOT · Host dashboard</p>
          <h1 className="dash-header__title">{event.details.title}</h1>
        </div>
        <StatusBadge meta={view.stateMeta} />
      </header>

      <AlertsPanel alerts={view.alerts} />

      <section className="panel">
        <header className="panel__header">
          <h2 className="panel__title">Lifecycle</h2>
        </header>
        <StateTimeline steps={view.timeline} />
      </section>

      <div className="grid">
        <div className="grid__col">
          <EventSummary event={event} meta={view.stateMeta} />
          <ReadinessPanel
            readiness={view.readiness}
            onRecheck={onRecheck}
            rechecking={rechecking}
          />
        </div>
        <div className="grid__col">
          <ActionsPanel
            actions={view.actions}
            onAction={onAction}
            busy={event.stream.status === 'connecting'}
          />
          <ActivityLog entries={c.activity} />
        </div>
      </div>

      <SimulatorPanel
        event={event}
        setRequirement={c.setRequirement}
        setStream={c.setStream}
        setSchedule={c.setSchedule}
        simulateState={c.simulateState}
      />
    </div>
  );
}
