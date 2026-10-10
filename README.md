# LIV DOT — Host Event Dashboard

A take-home assessment submission for the **Senior Frontend Engineer** role.

The dashboard lets an event host see **what state their event is in, which
readiness requirements are satisfied, and why an action is blocked** — the
interface is driven entirely by backend state and operational conditions.

> Visual polish is deliberately not the focus. The emphasis is on **state
> modelling, blocked/incomplete states, and frontend architecture.**

---

## Getting started

Requires **Bun** (used as the package manager) and Node 18+.

```bash
bun install
bun run dev        # http://localhost:3000
```

Other scripts:

```bash
bun run build      # production build
bun run start      # run the production build
bun run typecheck  # tsc --noEmit
bun test           # domain unit tests (lifecycle + reducer)
```

No environment variables or backend are required — the backend is mocked
(see **Mock backend** below).

---

## What the app does

- Shows the event's **current lifecycle state** and a timeline of the full
  lifecycle (`Draft → Scheduled → Ready for Streaming → Live → Completed →
  Replay Available`).
- Lists **operational readiness requirements** (crew assigned, streaming
  ingest configured, ticket pricing configured) with a status each.
- Offers the **single action** valid for the current state, and when that
  action is blocked, explains **exactly why**.
- Surfaces **operational alerts** (stream failure/degradation, incomplete
  readiness).
- Includes a **backend simulator** so state changes, completeness and stream
  health can be reproduced on demand.

---

## State modelling

### 1. The lifecycle is a finite state machine, not a set of booleans

The event state is a single `EventState` union
(`src/domain/types.ts`). Transitions are declared explicitly in
`src/domain/machine.ts`:

```
draft → scheduled → ready_for_streaming → live → completed → replay_available
```

Anything not declared is invalid. This avoids the classic bug where a stale
boolean (`isLive`, `canStream`) lets the UI render a state combination that
can't actually exist.

### 2. Readiness is a four-state value, not a boolean

Each requirement is `satisfied | missing | pending | unknown`
(`RequirementStatus`). A boolean would collapse three genuinely different
situations into two:

- `missing` — the backend confirmed the requirement is **not met** (actionable).
- `pending` — a check is **in flight** (wait and re-poll).
- `unknown` — we **haven't determined** the status yet.

This is the "asynchronous and incomplete system state" the brief asks about:
the UI stays honest about not-knowing rather than guessing.

### 3. Blocked actions carry structured reasons

`transitionBlockers(event, to)` returns an array of `Blocker`
(`{ code, message, requirementId? }`). The actions panel renders whatever the
machine returns — the UI never hard-codes a reason. A disabled button and its
explanation can never disagree, because they come from the same call.

### 4. One derivation point

`deriveDashboard(event)` in `src/domain/selectors.ts` turns raw event state
into everything the UI renders: state meta, timeline, readiness summary,
available actions, and alerts. Components are dumb consumers of this view
model.

---

## Frontend architecture

```
src/
  domain/            # framework-agnostic core — no React imports
    types.ts         #   domain types
    machine.ts       #   lifecycle, transitions, guards (single source of truth)
    reducer.ts       #   pure state transitions
    selectors.ts     #   raw state → view model
    mockApi.ts       #   simulated backend (latency + async states)
    machine.test.ts  #   unit tests for the guards + reducer
  hooks/
    useEventDashboard.ts   # wires the reducer to async side effects
  components/        # presentational, one concern each
    Dashboard, StateTimeline, EventSummary, ReadinessPanel,
    ActionsPanel, AlertsPanel, SimulatorPanel, ActivityLog, StatusBadge
  app/               # Next.js App Router entry + global styles
```

**Separation of concerns:** business rules live in `domain/` and are testable
without a DOM; `components/` only render props. Swapping the mock API for a
real one touches `mockApi.ts` and one hook — not the UI.

**State management:** `useReducer` over the pure `eventReducer`, with a thin
hook (`useEventDashboard`) that owns async side effects (initial load, ingest
coming up after go-live, readiness re-check). No global store is needed for a
single-entity dashboard; a selector layer keeps derived state out of the
reducer.

---

## Mock backend

`src/domain/mockApi.ts` simulates the backend with **latency** and seed data
that deliberately starts incomplete (one requirement `pending`, one
`missing`) so the blocked paths are visible on first paint. The **backend
simulator** panel drives:

- requirement statuses,
- stream health (`idle → connecting → healthy → degraded → failed`),
- the scheduled start time,
- a direct jump to any lifecycle state.

---

## Assumptions & tradeoffs

- **Only forward transitions.** No un-scheduling or rolling back out of
  `live`; those are product decisions the brief doesn't define.
- **Readiness gates** the `ready_for_streaming` transition; going live
  re-checks readiness defensively, because it can regress while waiting.
- **`unknown` is treated as blocking**, and `Recheck` resolves indeterminate
  states — a real backend would poll or subscribe instead.
- **Mock API over real integration**, as the brief allows.
- **No global state library** — deliberately, to keep the data-flow explicit
  for a single-entity view.

## If extended

Real API + polling/websockets for readiness and stream health; optimistic
updates with rollback on the go-live path; server-backed audit log; and the
readiness checks become subscriptions rather than pull-based rechecks.
