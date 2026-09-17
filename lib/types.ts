export type ClearanceCode = 'C1' | 'C2' | 'C3' | 'C4';

export interface Clearance {
  code: ClearanceCode;
  label: string;
  who: string;
  role: string;
  fiu: boolean;
}

export interface CaseTypeDef {
  key: string;
  label: string;
  desk: string;
  slaHours: number;
  authority: boolean;
  guidance: string;
}

export type AuditTone = 'red' | 'green' | 'grey';

export interface AuditEntry {
  action: string;
  actor: string;
  role: string;
  note: string;
  ts: Date;
  tone: AuditTone;
}

export interface Submission {
  assessment: string;
  disposition: string;
  revisedRisk: string;
  action: string;
}

export interface Evidence {
  name: string;
  ext: string;
  size: string;
}

export type CaseStatus =
  | 'Unassigned'
  | 'Assessment'
  | 'Review'
  | 'Authority'
  | 'Cleared'
  | 'Returned'
  | 'Rejected';

export interface CaseRecord {
  id: string;
  codename: string;
  subject: string;
  type: string;
  threat: 'High' | 'Medium' | 'Low';
  bu: string;
  branch: string;
  raisedBy: string;
  intake: Date;
  assignedOfficer: string | null;
  status: CaseStatus;
  step: number;
  version: number;
  firstSubmit?: boolean;
  exposure: [string, string][];
  evidence: Evidence[];
  submission: Submission | null;
  audit: AuditEntry[];
  reviewComment?: string;
  reworkReason?: string | null;
  outcome?: string;
  dueAt: Date;
  remainH: number;
  awaitingInfo?: boolean;
}

export type DashboardMode = 'data' | 'airport';

export type ViewKey =
  | 'dashboard'
  | 'queue'
  | 'case'
  | 'reporting'
  | 'file-referral'
  | 'my-referrals'
  | 'referral-tracking';

export interface ReferralDraft {
  type: string | null;
  subject: string;
  account: string;
  amount: string;
  urgency: string;
  narrative: string;
  needs: string;
}
