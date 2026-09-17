'use client';

import { typeOf } from '@/lib/data';
import { fmtDT, slaTone } from '@/lib/helpers';
import type { CaseRecord, ClearanceCode, Submission } from '@/lib/types';
import { StatusPill, ThreatPill, Pill } from './Pill';
import AssessmentTab from './AssessmentTab';
import ReviewTab from './ReviewTab';
import AuditTab from './AuditTab';

export type CaseTab = 'assessment' | 'review' | 'audit';

export default function CaseFile({
  c,
  clearance,
  caseTab,
  setCaseTab,
  onBack,
  returnReasonPicked,
  setReturnReasonPicked,
  onAssignMe,
  onSaveDraft,
  onSubmitReview,
  onApprove,
  onAuthorise,
  onReturn,
  onReject,
  onFollowAircraft,
}: {
  c: CaseRecord;
  clearance: ClearanceCode;
  caseTab: CaseTab;
  setCaseTab: (t: CaseTab) => void;
  onBack: () => void;
  returnReasonPicked: string | null;
  setReturnReasonPicked: (r: string | null) => void;
  onAssignMe: () => void;
  onSaveDraft: (values: Submission) => void;
  onSubmitReview: (values: Submission) => void;
  onApprove: (comment: string) => void;
  onAuthorise: (comment: string) => void;
  onReturn: (comment: string, reason: string) => void;
  onReject: (comment: string) => void;
  onFollowAircraft: () => void;
}) {
  const sla = slaTone(c.remainH);
  const tone = sla.cls === 'red' ? 'var(--critical)' : sla.cls === 'amber' ? 'var(--amber)' : 'var(--healthy)';
  const outcomeTone =
    c.status === 'Cleared'
      ? { c: 'var(--healthy)', t: 'CLEARED' }
      : c.status === 'Authority'
      ? { c: 'var(--authority)', t: 'AWAITING AUTHORITY' }
      : c.status === 'Returned' || c.status === 'Rejected'
      ? { c: 'var(--critical)', t: c.status.toUpperCase() }
      : null;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <button type="button" className="back-link" onClick={onBack}>&larr; Back to watch floor</button>
        <button type="button" className="btn btn-ghost" onClick={onFollowAircraft}>Follow aircraft →</button>
      </div>
      <div className="card-lg">
        <div className="case-header">
          <div>
            <div className="case-tags">
              <span className="mono" style={{ color: 'var(--red-tint)', fontSize: 12 }}>{c.id}</span>
              <StatusPill status={c.status} />
              <ThreatPill threat={c.threat} />
              <Pill className="pill-grey">v{c.version || 1}</Pill>
              <span className="codename-chip">{c.codename}</span>
            </div>
            <h2 className="case-subject">{c.subject}</h2>
            {outcomeTone && (
              <div className="outcome-stamp" style={{ borderColor: outcomeTone.c, color: outcomeTone.c, marginTop: 10, display: 'inline-block' }}>
                {outcomeTone.t}
              </div>
            )}
          </div>
          <div className="turnaround-block" style={{ background: sla.cls === 'red' ? 'var(--tint-red)' : sla.cls === 'amber' ? 'var(--tint-amber)' : 'var(--tint-green)' }}>
            <div className="turnaround-figure" style={{ color: tone }}>{sla.text}</div>
            <div className="turnaround-label">Due {fmtDT(c.dueAt)}</div>
          </div>
        </div>
        <div className="meta-grid">
          <div className="meta-item"><div className="k">Case type</div><div className="v">{typeOf(c.type).label}</div></div>
          <div className="meta-item"><div className="k">Source</div><div className="v">{c.branch}</div></div>
          <div className="meta-item"><div className="k">Business unit</div><div className="v">{c.bu}</div></div>
          <div className="meta-item"><div className="k">Raised by</div><div className="v">{c.raisedBy}</div></div>
          <div className="meta-item"><div className="k">Intake</div><div className="v">{fmtDT(c.intake)}</div></div>
          <div className="meta-item"><div className="k">Assigned officer</div><div className="v">{c.assignedOfficer || 'Unassigned'}</div></div>
        </div>
      </div>

      <div className="tabs">
        <button type="button" className={`tab ${caseTab === 'assessment' ? 'active' : ''}`} onClick={() => setCaseTab('assessment')}>Officer assessment</button>
        <button type="button" className={`tab ${caseTab === 'review' ? 'active' : ''}`} onClick={() => setCaseTab('review')}>Approval review</button>
        <button type="button" className={`tab ${caseTab === 'audit' ? 'active' : ''}`} onClick={() => setCaseTab('audit')}>Audit trail & versions</button>
      </div>

      {caseTab === 'assessment' && (
        <AssessmentTab
          key={c.id + c.version + c.status}
          c={c}
          clearance={clearance}
          onAssignMe={onAssignMe}
          onSaveDraft={onSaveDraft}
          onSubmitReview={onSubmitReview}
        />
      )}
      {caseTab === 'review' && (
        <ReviewTab
          key={c.id + c.version + c.status}
          c={c}
          clearance={clearance}
          returnReasonPicked={returnReasonPicked}
          setReturnReasonPicked={setReturnReasonPicked}
          onApprove={onApprove}
          onAuthorise={onAuthorise}
          onReturn={onReturn}
          onReject={onReject}
        />
      )}
      {caseTab === 'audit' && <AuditTab c={c} />}
    </>
  );
}
