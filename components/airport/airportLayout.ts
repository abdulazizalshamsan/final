// Position math ported from NBB-Source.html's #airport-cases lane()/parking() helpers.
// The airport art only has 3 physical taxiway lanes, so the app's 4 desks are paired onto them.

export const LANE_DESKS = ['Sanctions & PEP', 'AML & monitoring', 'Fraud', 'KYC & ratings'] as const;
export type Desk = (typeof LANE_DESKS)[number];

const DESK_LANE: Record<Desk, 0 | 1 | 2> = {
  'Sanctions & PEP': 0,
  'AML & monitoring': 1,
  Fraud: 2,
  'KYC & ratings': 2,
};

export function deskLane(desk: string): 0 | 1 | 2 {
  return DESK_LANE[desk as Desk] ?? 1;
}

export const LANE_LABELS = ['Sanctions & PEP', 'AML & monitoring', 'Fraud & KYC ratings'];

export interface Placement {
  x: number;
  y: number;
  r: number;
  s: number;
}

const YS = [33, 39, 47, 60, 54, 67];

/** Position of the `slot`-th aircraft taxiing along lane `t` (0,1,2). Slots wrap every 6 and fan out slightly on wrap. */
export function lanePosition(t: 0 | 1 | 2, slot: number): Placement {
  const wrap = Math.floor(slot / 6);
  const y = YS[slot % 6] + wrap * 2.2;
  const x = t === 0 ? 43.9 - (y - 33) * 0.16 : t === 1 ? 56.1 - (y - 33) * 0.045 : 68.4 + (y - 33) * 0.08;
  return { x, y, r: 0, s: 0.7 + (y - 33) * 0.011 };
}

/** Fixed "checker apron" position for lane `t`, stacking additional simultaneous checker/authority cases by `idx`. */
export function checkerApron(t: 0 | 1 | 2, idx: number): Placement {
  const base = lanePosition(t, 3);
  return { ...base, y: base.y + idx * 3.4 };
}

export function breachApron(index: number): Placement {
  return { x: 10 + (index % 4) * 5, y: 66 + Math.floor(index / 4) * 5, r: 75, s: 0.84 };
}

export function holdApron(index: number): Placement {
  return { x: 77 + (index % 3) * 6, y: 75 + Math.floor(index / 3) * 5, r: 0, s: 0.86 };
}

/** Departure path a case flies once approved/authorised/rejected, mirroring the source's completion animation. */
export function departurePath(from: Placement): Placement[] {
  return [
    { x: from.x - 2, y: 78, r: 0, s: 1.15 },
    { x: from.x - 13, y: 101, r: 15, s: 1.65 },
  ];
}
