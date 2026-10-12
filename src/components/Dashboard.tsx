'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EventCommand } from '@/domain/types';
import { useEventDashboard } from '@/hooks/useEventDashboard';
import { ControlRoomBar } from './ControlRoomBar';
import { LiveTicker } from './LiveTicker';
import { OrbitMark } from './OrbitMark';
import { AmbientBackdrop } from './AmbientBackdrop';
import { NextActionGuide } from './NextActionGuide';
import { Reveal } from './Reveal';
import { StatusBadge } from './StatusBadge';
import { StateTimeline } from './StateTimeline';
import { EventSummary } from './EventSummary';
import { ReadinessPanel } from './ReadinessPanel';
import { AlertsPanel } from './AlertsPanel';
import { ActionsPanel } from './ActionsPanel';
import { LiveOpsPanel } from './LiveOpsPanel';
import { PostEventPanel } from './PostEventPanel';
import { SimulatorPanel } from './SimulatorPanel';
import { ActivityLog } from './ActivityLog';

function commandForAction(id: string, scheduledStartAt: string | null): EventCommand | null {
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

const swap = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -8 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

export function Dashboard() {
  const c = useEventDashboard();
  const [rechecking, setRechecking] = useState(false);

  if (c.status === 'loading' || !c.event || !c.view) {
    return <div className="state-screen">Connecting to control room…</div>;
  }
  if (c.status === 'error') {
    return <div className="state-screen">Failed to load the event.</div>;
  }

  const { event, view } = c;
  const isLive = event.state === 'live';
  const isPostEvent = event.state === 'completed' || event.state === 'replay_available';
  const showReadiness = !isLive && !isPostEvent;

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
      <AmbientBackdrop state={event.state} />
      <NextActionGuide
        nextAction={view.actions[0]?.label ?? null}
        enabled={view.actions[0]?.enabled ?? false}
        blockedReason={view.actions[0]?.blockers[0]?.message ?? null}
      />
      <ControlRoomBar isLive={isLive} />
      <LiveTicker />

      <Reveal>
        <header className="dash-header">
          <div>
            <p className="dash-header__eyebrow">Host dashboard</p>
            <h1 className="dash-header__title">{event.details.title}</h1>
          </div>
          <div className="dash-header__status">
            <OrbitMark live={isLive} />
            <StatusBadge meta={view.stateMeta} />
          </div>
        </header>
      </Reveal>

      <Reveal delay={0.05}>
        <AlertsPanel alerts={view.alerts} />
      </Reveal>

      <Reveal delay={0.1}>
        <section className="panel">
          <header className="panel__header">
            <h2 className="panel__title">Lifecycle</h2>
          </header>
          <StateTimeline steps={view.timeline} />
        </section>
      </Reveal>

      <AnimatePresence mode="wait">
        {isLive && (
          <motion.div key="live" {...swap}>
            <LiveOpsPanel
              event={event}
              liveSince={c.liveSince}
              onReportIssue={c.reportIssue}
              onResolveIssue={c.resolveIssue}
              onToggleBackup={c.toggleBackup}
            />
          </motion.div>
        )}
        {isPostEvent && (
          <motion.div key="post" {...swap}>
            <PostEventPanel event={event} onSetReplayAccess={c.setReplayAccess} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid">
        <div className="grid__col">
          <Reveal delay={0.14}>
            <EventSummary event={event} meta={view.stateMeta} />
          </Reveal>
          <AnimatePresence mode="wait">
            {showReadiness && (
              <motion.div key="readiness" {...swap}>
                <ReadinessPanel
                  readiness={view.readiness}
                  onRecheck={onRecheck}
                  rechecking={rechecking}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="grid__col">
          <Reveal delay={0.18}>
            <ActionsPanel
              actions={view.actions}
              onAction={onAction}
              busy={event.stream.status === 'pending'}
            />
          </Reveal>
          <Reveal delay={0.22}>
            <ActivityLog entries={c.activity} />
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.26}>
        <SimulatorPanel
          event={event}
          setRequirement={c.setRequirement}
          setStream={c.setStream}
          setSchedule={c.setSchedule}
          setProductionMode={c.setProductionMode}
          simulateState={c.simulateState}
        />
      </Reveal>
    </div>
  );
}
