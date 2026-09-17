import type { CaseRecord, CaseStatus, ClearanceCode } from './types';

export function fmtDT(d: Date): string {
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) +
    ' GST'
  );
}

export interface SlaTone {
  cls: 'red' | 'amber' | 'green';
  text: string;
}

export function fmtRemain(h: number): string {
  if (h < 0) return 'BREACHED';
  if (h < 1) return Math.round(h * 60) + 'm left';
  if (h < 48) return h.toFixed(1) + 'h left';
  return (h / 24).toFixed(1) + 'd left';
}

export function slaTone(remainH: number): SlaTone {
  if (remainH < 0) return { cls: 'red', text: 'BREACHED' };
  if (remainH < 4) return { cls: 'amber', text: fmtRemain(remainH) };
  return { cls: 'green', text: fmtRemain(remainH) };
}

export const STATUS_PILL_CLASS: Record<CaseStatus, string> = {
  Unassigned: 'pill-grey',
  Assessment: 'pill-blue',
  Review: 'pill-amber',
  Authority: 'pill-violet',
  Cleared: 'pill-green',
  Returned: 'pill-red',
  Rejected: 'pill-red',
};

export function statusLabel(status: CaseStatus): string {
  return status === 'Cleared' ? 'CLEARED' : status.toUpperCase();
}

export const THREAT_PILL_CLASS: Record<'High' | 'Medium' | 'Low', string> = {
  High: 'pill-red',
  Medium: 'pill-amber',
  Low: 'pill-green',
};

export function myActionCases(cases: CaseRecord[], clearance: ClearanceCode): CaseRecord[] {
  if (clearance === 'C2') return cases.filter(c => c.status === 'Assessment' || c.status === 'Unassigned' || c.status === 'Returned');
  if (clearance === 'C3') return cases.filter(c => c.status === 'Review');
  if (clearance === 'C4') return cases.filter(c => c.status === 'Authority');
  return cases.filter(c => c.raisedBy.startsWith('H. Al Suwaidi'));
}

export function myReferralCases(cases: CaseRecord[]): CaseRecord[] {
  return cases.filter(c => c.raisedBy.startsWith('H. Al Suwaidi'));
}

export function roleNoun(clearance: ClearanceCode): string {
  return { C2: 'officer', C3: 'review', C4: 'authority', C1: 'response' }[clearance];
}
