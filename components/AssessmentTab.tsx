'use client';

import { useState } from 'react';
import { DISPOSITIONS } from '@/lib/data';
import type { CaseRecord, ClearanceCode, Submission } from '@/lib/types';

function lastAuditNote(c: CaseRecord, action: string): string {
  const a = [...c.audit].reverse().find(x => x.action === action);
  return a ? a.note : '';
}

function ChainStep({
  role,
  sub,
  stateKey,
  who,
}: {
  role: string;
  sub: string;
  stateKey: 'done' | 'active' | 'pending';
  who: string;
}) {
  const dot = stateKey === 'done' ? '✓' : stateKey === 'active' ? '●' : '';
  const stateColor = stateKey === 'done' ? 'var(--healthy)' : stateKey === 'active' ? 'var(--amber)' : 'var(--ink-faint)';
  const stateText = stateKey === 'done' ? 'Complete' : stateKey === 'active' ? 'In progress' : 'Pending';
  return (
    <div className="chain-step">
      <div className={`chain-dot ${stateKey}`}>{dot}</div>
      <div>
        <div className="chain-who">{who}</div>
        <div className="chain-role">{role} &middot; {sub}</div>
        <div className="chain-state" style={{ color: stateColor }}>{stateText}</div>
      </div>
    </div>
  );
}

export default function AssessmentTab({
  c,
  clearance,
  onAssignMe,
  onSaveDraft,
  onSubmitReview,
}: {
  c: CaseRecord;
  clearance: ClearanceCode;
  onAssignMe: () => void;
  onSaveDraft: (values: Submission) => void;
  onSubmitReview: (values: Submission) => void;
}) {
  const sealed = c.status !== 'Unassigned' && c.status !== 'Assessment' && c.status !== 'Returned';
  const canEdit = clearance === 'C2' && !sealed;
  const base = c.submission || { assessment: '', disposition: DISPOSITIONS[0], revisedRisk: c.threat, action: '' };

  const [assessment, setAssessment] = useState(base.assessment);
  const [disposition, setDisposition] = useState(base.disposition);
  const [revisedRisk, setRevisedRisk] = useState(base.revisedRisk);
  const [action, setAction] = useState(base.action);

  const values = (): Submission => ({ assessment, disposition, revisedRisk, action });

  return (
    <div className="case-body">
      <div>
        <div className={`editability-chip ${canEdit ? 'pill-green' : 'pill-grey'}`}>
          {canEdit ? 'Open for editing' : 'Sealed — record under review'}
        </div>
        {c.status === 'Returned' && c.reworkReason && (
          <div className="rework-banner">
            <b>Returned for rework</b> — reason: <b>{c.reworkReason}</b>
            <br />
            {lastAuditNote(c, 'Returned to officer')}
          </div>
        )}

        <div className="field-block">
          <label className="field-label">Intelligence assessment</label>
          <textarea
            rows={6}
            disabled={!canEdit}
            value={assessment}
            onChange={e => setAssessment(e.target.value)}
            placeholder="Describe what was observed, the evidence reviewed, and why it does or does not indicate financial crime risk."
          />
        </div>
        <div className="field-block">
          <label className="field-label">Recommended disposition</label>
          <select className="select-input" disabled={!canEdit} value={disposition} onChange={e => setDisposition(e.target.value)}>
            {DISPOSITIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field-block">
          <label className="field-label">Revised customer risk rating</label>
          <select className="select-input" disabled={!canEdit} value={revisedRisk} onChange={e => setRevisedRisk(e.target.value)}>
            {['Low', 'Medium', 'High'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="field-block">
          <label className="field-label">Action requested of the branch / business unit</label>
          <textarea
            rows={3}
            disabled={!canEdit}
            value={action}
            onChange={e => setAction(e.target.value)}
            placeholder="What should the branch or business unit do next, if anything?"
          />
        </div>
        <div className="field-block">
          <label className="field-label">Material attached by the field source</label>
          <div>
            {c.evidence.map(e => (
              <span className="file-chip" key={e.name}>
                <span className="file-ext">{e.ext}</span>{e.name}<span style={{ color: 'var(--ink-faint)' }}>{e.size}</span>
              </span>
            ))}
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {c.status === 'Unassigned' ? (
              <button type="button" className="btn btn-red" onClick={onAssignMe}>Assign to me</button>
            ) : (
              <>
                <button type="button" className="btn btn-red" onClick={() => onSubmitReview(values())}>Submit for review</button>
                <button type="button" className="btn btn-ghost" onClick={() => onSaveDraft(values())}>Save draft</button>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Clearance chain</div>
          <ChainStep role="Case officer" sub="FIU analyst" stateKey={c.step >= 1 ? (c.step > 1 ? 'done' : 'active') : 'pending'} who={c.assignedOfficer || 'Unassigned'} />
          <div className="chain-spine" />
          <ChainStep role="Reviewing officer" sub="Unit lead" stateKey={c.step >= 2 ? (c.step > 2 ? 'done' : 'active') : 'pending'} who="S. Fernandes" />
          <div className="chain-spine" />
          <ChainStep role="Authorising officer" sub="Head of FIU" stateKey={c.step >= 3 ? (c.status === 'Authority' ? 'active' : 'done') : 'pending'} who="A. Belhoul" />
          <div style={{ fontSize: 10.5, color: 'var(--ink-cap)', marginTop: 10, lineHeight: 1.5 }}>
            Four-eye rule: the officer who authors an assessment can never also clear it.
          </div>
        </div>
        <div className="card">
          <div className="section-title">Linked exposure</div>
          {c.exposure.map(([k, v]) => (
            <div className="exposure-row" key={k}>
              <div>{k}</div>
              <div className="v">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
