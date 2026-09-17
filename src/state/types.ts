export type Team = 0 | 1 | 2;

export type CaseState = 'maker' | 'checker' | 'hold' | 'completed';

export interface Position {
  x: number;
  y: number;
  r: number;
  s: number;
}

export interface CaseRecord extends Position {
  id: string;
  team: Team;
  slot: number;
  state: CaseState;
  breached: boolean;
  owner: string;
  /** State to return to once an "awaiting information" hold is resumed. */
  previous?: CaseState;
  /** Fades out as a completed case departs the scene. */
  opacity?: number;
  business?: string;
  customer?: string;
  summary?: string;
}

export interface Counts {
  received: number;
  pending: number;
  breachedPending: number;
  completed: number;
}

export const TEAMS: readonly string[] = ['Onboarding', 'Sanctions', 'Trade Review'];
export const MAKERS: readonly string[] = ['Sara', 'Ali', 'Fatima'];
export const CHECKERS: readonly string[] = ['Omar', 'Mariam', 'Hassan'];
export const SUBMITTING_DEPARTMENTS: readonly string[] = [
  'Branches',
  'Retail Business Banking',
  'CIB',
];
/** The alternate eligible maker a case is toggled to on "Reassign maker". */
export const REASSIGNMENT_POOL_MAKER = 'Rania';
