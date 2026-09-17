import {
  CHECKERS,
  MAKERS,
  REASSIGNMENT_POOL_MAKER,
  SUBMITTING_DEPARTMENTS,
  TEAMS,
  type CaseRecord,
  type CaseState,
  type Counts,
  type Position,
  type Team,
} from './types';

/**
 * Fictional in-memory case + aircraft position engine.
 *
 * This is not a production case-management backend. It owns both the case
 * records and their on-scene aircraft coordinates because the two are
 * inseparable in this demo — every "case action" is expressed as an
 * aircraft movement. Framework-agnostic on purpose: React components read
 * it through `useSyncExternalStore` (see `useCaseStore` in ../hooks).
 */

export type ActionType =
  | 'checker'
  | 'complete'
  | 'breach'
  | 'hold'
  | 'resume'
  | 'reassign'
  | 'journey'
  | 'pause'
  | 'reset';

interface Waypoint extends Position {
  duration: number;
}

interface TweenJob {
  c: CaseRecord;
  points: (Position | Waypoint)[];
  t: number;
  end?: () => void;
}

const RECEIVED_BASELINE = 6;
const COMPLETED_BASELINE = 6;
const INITIAL_SELECTION = 'ONB-0241';

/** Runway/apron lane slot -> normalised {x,y,rotation,scale} on the airport plate. */
function lane(team: Team, slot: number): Position {
  const ys = [33, 39, 47, 60, 54, 67];
  const y = ys[slot % 6];
  const x =
    team === 0 ? 43.9 - (y - 33) * 0.16 : team === 1 ? 56.1 - (y - 33) * 0.045 : 68.4 + (y - 33) * 0.08;
  return { x, y, r: 0, s: 0.7 + (y - 33) * 0.011 };
}

/** Off-runway holding positions for breached or awaiting-information cases. */
function parking(type: 'breach' | 'hold', index: number): Position {
  if (type === 'breach') {
    return { x: 10 + (index % 4) * 5, y: 66 + Math.floor(index / 4) * 5, r: 75, s: 0.84 };
  }
  return { x: 77 + (index % 3) * 6, y: 75 + Math.floor(index / 3) * 5, r: 0, s: 0.86 };
}

function smoothstep(f: number): number {
  return f * f * (3 - 2 * f);
}

export class CaseStore {
  cases: CaseRecord[] = [];
  selectedId: string = INITIAL_SELECTION;
  paused = false;
  lastMessage = 'Select any aircraft, then change its case status.';
  /** Bumped on every mutation — the React binding subscribes to this via useSyncExternalStore. */
  version = 0;

  private jobs: TweenJob[] = [];
  private listeners = new Set<() => void>();
  private rafId: number | null = null;
  private lastTime = 0;

  constructor() {
    this.reset();
    this.startLoop();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.stopLoop();
        else this.startLoop();
      });
    }
  }

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): number => this.version;

  private notify() {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  private message(s: string) {
    this.lastMessage = s;
  }

  get selected(): CaseRecord {
    return this.cases.find((c) => c.id === this.selectedId) ?? this.cases[0];
  }

  select(id: string) {
    this.selectedId = id;
    this.notify();
  }

  reset() {
    this.jobs = [];
    this.paused = false;
    this.selectedId = INITIAL_SELECTION;
    const cases: CaseRecord[] = [];
    const prefixes = ['ONB-', 'SAN-', 'TRD-'];

    for (let t = 0; t < 3; t++) {
      for (let n = 0; n < 4; n++) {
        cases.push({
          id: prefixes[t] + String(241 + n).padStart(4, '0'),
          team: t as Team,
          slot: n,
          state: n === 3 ? 'checker' : 'maker',
          breached: false,
          owner: MAKERS[t],
          ...lane(t as Team, n),
        });
      }
    }
    for (let n = 0; n < 3; n++) {
      cases.push({
        id: 'ESC-' + (101 + n),
        team: n as Team,
        slot: 4,
        state: 'maker',
        breached: true,
        owner: MAKERS[n],
        ...parking('breach', n),
      });
    }
    for (let n = 0; n < 2; n++) {
      cases.push({
        id: 'RFI-' + (301 + n),
        team: n as Team,
        slot: 5,
        state: 'hold',
        breached: false,
        owner: MAKERS[n],
        ...parking('hold', n),
      });
    }

    this.cases = cases;
    this.message('Select any aircraft, then change its case status.');
    this.notify();
  }

  counts(): Counts {
    const pending = this.cases.filter((c) => c.state !== 'completed');
    const completed = this.cases.length - pending.length;
    return {
      received: RECEIVED_BASELINE + this.cases.length,
      pending: pending.length,
      breachedPending: pending.filter((c) => c.breached).length,
      completed: COMPLETED_BASELINE + completed,
    };
  }

  teamCounts(team: Team): { pending: number; breached: number } {
    const pending = this.cases.filter((c) => c.team === team && c.state !== 'completed');
    return { pending: pending.length, breached: pending.filter((c) => c.breached).length };
  }

  /** Cases still active for a team — used by the What-If forecast (Onboarding = team 0). */
  activeCount(team: Team): number {
    return this.cases.filter((c) => c.team === team && c.state !== 'completed').length;
  }

  isBusy(id: string): boolean {
    return this.jobs.some((j) => j.c.id === id);
  }

  /** Mirrors the prototype's button-disabling rules so every view stays consistent. */
  canPerform(action: ActionType, id: string = this.selectedId): boolean {
    if (action === 'pause' || action === 'reset') return true;
    const c = this.cases.find((x) => x.id === id);
    if (!c) return false;
    if (this.isBusy(id) || c.state === 'completed') return false;
    switch (action) {
      case 'complete':
        return c.state === 'checker';
      case 'checker':
        return c.state === 'maker';
      case 'resume':
        return c.state === 'hold';
      case 'breach':
        return !c.breached;
      case 'hold':
        return c.state !== 'hold';
      default:
        return true;
    }
  }

  togglePause() {
    this.paused = !this.paused;
    this.notify();
  }

  private animate(c: CaseRecord, points: Waypoint[], end?: () => void) {
    const start: Position = { x: c.x, y: c.y, r: c.r, s: c.s };
    this.jobs.push({ c, points: [start, ...points], t: 0, end });
    this.notify();
  }

  private moveTo(c: CaseRecord, p: Position, end?: () => void) {
    this.animate(c, [{ ...p, duration: 3.5 }], end);
  }

  private depart(c: CaseRecord, end: () => void) {
    this.animate(
      c,
      [
        { x: c.x - 2, y: 78, r: 0, s: 1.15, duration: 2 },
        { x: c.x - 13, y: 101, r: 15, s: 1.65, duration: 3 },
      ],
      end,
    );
  }

  action(type: ActionType, id: string = this.selectedId) {
    if (type === 'reset') {
      this.reset();
      return;
    }
    if (type === 'pause') {
      this.togglePause();
      return;
    }

    const c = this.cases.find((x) => x.id === id);
    if (!c || c.state === 'completed' || this.isBusy(id)) return;
    const team = c.team;

    if (type === 'checker' && c.state === 'maker') {
      this.message(`${c.id}: maker submits the recommendation to ${CHECKERS[team]}.`);
      this.moveTo(c, lane(team, 3), () => {
        c.state = 'checker';
        this.notify();
      });
    } else if (type === 'complete' && c.state === 'checker') {
      c.state = 'completed';
      this.message(`${c.id}: ${CHECKERS[team]} approves. The aircraft departs and totals update.`);
      this.depart(c, () => {
        c.opacity = 0;
        this.notify();
      });
    } else if (type === 'breach' && !c.breached) {
      c.breached = true;
      this.message(`${c.id}: SLA expiry simulated. Its owner and review stage remain unchanged.`);
      const n = this.cases.filter((p) => p.breached && p.state !== 'completed').length - 1;
      this.moveTo(c, parking('breach', n), () => this.notify());
    } else if (type === 'hold' && c.state !== 'hold') {
      c.previous = c.state;
      c.state = 'hold';
      this.message(`${c.id}: awaiting information. The SLA continues running.`);
      this.moveTo(
        c,
        parking('hold', this.cases.filter((p) => p.state === 'hold').length - 1),
        () => this.notify(),
      );
    } else if (type === 'resume' && c.state === 'hold') {
      c.state = c.previous ?? 'maker';
      this.message(`${c.id}: information received; review resumes.`);
      const dest = c.breached
        ? parking(
            'breach',
            this.cases.filter((p) => p.breached && p.state !== 'completed').indexOf(c),
          )
        : lane(team, c.state === 'checker' ? 3 : c.slot);
      this.moveTo(c, dest, () => this.notify());
    } else if (type === 'reassign') {
      c.owner = c.owner === MAKERS[team] ? REASSIGNMENT_POOL_MAKER : MAKERS[team];
      this.message(`${c.id}: reassigned to ${c.owner}, an eligible ${TEAMS[team]} maker. The SLA does not reset.`);
      const dest: Position = { x: c.x, y: c.y, r: c.r, s: c.s };
      this.animate(
        c,
        [
          { x: 32, y: 44, r: -65, s: 0.8, duration: 2.5 },
          { ...dest, duration: 2.5 },
        ],
        () => this.notify(),
      );
    } else if (type === 'journey') {
      c.state = 'maker';
      this.message(`${c.id}: maker review → independent checker → approval and departure.`);
      this.animate(
        c,
        [
          { ...lane(team, 2), duration: 2 },
          { ...lane(team, 2), duration: 2 },
          { ...lane(team, 3), duration: 2.5 },
        ],
        () => {
          c.state = 'checker';
          this.message(`${c.id}: ${CHECKERS[team]} performs the independent check.`);
          this.animate(c, [{ ...lane(team, 3), duration: 2 }], () => {
            c.state = 'completed';
            this.message(`${c.id}: checker approval recorded. Case completed.`);
            this.depart(c, () => {
              c.opacity = 0;
              this.notify();
            });
          });
        },
      );
    }
    this.notify();
  }

  submit(input: { team: Team; business: string; customer: string; summary: string }): CaseRecord {
    const prefixes = ['ONB-', 'SAN-', 'TRD-'];
    const deptIndex = SUBMITTING_DEPARTMENTS.indexOf(input.business);
    const c: CaseRecord = {
      ...input,
      id: prefixes[input.team] + String(300 + this.cases.length).padStart(4, '0'),
      slot: 4,
      state: 'maker',
      breached: false,
      owner: MAKERS[input.team],
      x: 24,
      y: [32, 42, 51][deptIndex < 0 ? 0 : deptIndex],
      r: -60,
      s: 0.75,
    };
    this.cases.push(c);
    this.selectedId = c.id;
    this.notify();
    return c;
  }

  allocate(id: string) {
    const c = this.cases.find((x) => x.id === id);
    if (!c || this.isBusy(id)) return;
    this.selectedId = id;
    this.message(`${c.id}: specialist match → available maker → allocation confirmed.`);
    this.animate(
      c,
      [
        { x: 32, y: 43, r: -50, s: 0.8, duration: 3 },
        { x: 32, y: 43, r: -50, s: 0.8, duration: 2 },
        { ...lane(c.team, 4), duration: 3 },
      ],
      () => {
        this.message(`${c.id}: assigned to ${c.owner}. Maker review is ready.`);
        this.notify();
      },
    );
  }

  startLoop() {
    if (this.rafId !== null || typeof requestAnimationFrame === 'undefined') return;
    this.lastTime = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - this.lastTime) / 1000);
      this.lastTime = now;
      if (!this.paused && this.jobs.length) {
        for (const job of [...this.jobs]) {
          job.t += dt;
          let total = 0;
          let index = 1;
          while (
            index < job.points.length - 1 &&
            job.t > total + (job.points[index] as Waypoint).duration
          ) {
            total += (job.points[index] as Waypoint).duration;
            index++;
          }
          const a = job.points[index - 1];
          const b = job.points[index] as Waypoint;
          const f = Math.min(1, Math.max(0, (job.t - total) / b.duration));
          const e = smoothstep(f);
          job.c.x = a.x + (b.x - a.x) * e;
          job.c.y = a.y + (b.y - a.y) * e;
          job.c.r = a.r + (b.r - a.r) * e;
          job.c.s = a.s + (b.s - a.s) * e;
          if (job.c.state === 'completed' && job.c.y > 85) {
            job.c.opacity = Math.max(0, (102 - job.c.y) / 17);
          }
          if (index === job.points.length - 1 && f === 1) {
            this.jobs = this.jobs.filter((x) => x !== job);
            job.end?.();
          }
        }
        this.notify();
      }
      this.rafId = requestAnimationFrame(frame);
    };
    this.rafId = requestAnimationFrame(frame);
  }

  stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

/**
 * A module-level singleton, matching how the rest of this demo shares one case
 * list across every view. Safe under Next.js: the constructor never touches
 * `window`/`requestAnimationFrame` synchronously (both are feature-detected), so
 * server-side prerendering of "use client" components can construct it inertly —
 * each browser tab then gets its own live instance once the client bundle runs.
 */
export const caseStore = new CaseStore();

export function stateLabel(state: CaseState): string {
  return {
    maker: 'Maker review',
    checker: 'Checker review',
    hold: 'Awaiting information',
    completed: 'Completed',
  }[state];
}
