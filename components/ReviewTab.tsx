'use client';

import { useState } from 'react';
import { AUTHORITY_DISPOSITIONS, RETURN_REASONS, typeOf } from '@/lib/data';
import type { CaseRecord, ClearanceCode } from '@/lib/types';

function GateRow({ state, title, note }: { state: 'ok' | 'warn' | 'na'; title: string; note: string }) {
  const icon = state === 'ok' ? '✓' : state === 'warn' ? '!' : '–';
  return (
    <div className="gate-row">
      <div className={`gate-icon ${state}`}>{icon}</div>
      <div>
        <div className="gate-title">{title}</div>
        <div className="gate-note">{note}</div>
      </div>
    </div>
  );
}

export default function ReviewTab({
  c,
  clearance,
  returnReasonPicked,
  setReturnReasonPicked,
  onApprove,
  onAuthorise,
  onReturn,
  onReject,
}: {
  c: CaseRecord;
  clearance: ClearanceCode;
  returnReasonPicked: string | null;
  setReturnReasonPicked: (r: string | null) => void;
  onApprove: (comment: string) => void;
  onAuthorise: (comment: string) => void;
  onReturn: (comment: string, reason: string) => void;
  onReject: (comment: string) => void;
}) {
  const canAct = (clearance === 'C3' && c.status === 'Review') || (clearance === 'C4' && c.status === 'Authority');
  const sub = c.submission || { assessment: '', disposition: '', revisedRisk: '', action: '' };
  const [comment, setComment] = useState(c.reviewComment || '');

  const requiresAuthority = typeOf(c.type).authority || AUTHORITY_DISPOSITIONS.includes(sub.disposition);

  return (
    <div className="case-body">
      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Submitted record</div>
          <div className="field-block"><label className="field-label">Intelligence assessment</label><div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>{sub.assessment || '—'}</div></div>
          <div className="field-block"><label className="field-label">Recommended disposition</label><div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{sub.disposition || '—'}</div></div>
          <div className="field-block"><label className="field-label">Revised customer risk rating</label><div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{sub.revisedRisk || '—'}</div></div>
          <div className="field-block"><label className="field-label">Action requested</label><div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{sub.action || '—'}</div></div>
          <div className="field-block"><label className="field-label">Filed by</label><div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{c.assignedOfficer} &middot; C-2 Case officer</div></div>
        </div>

        <div className="field-block">
          <label className="field-label">
            Reviewer comment {canAct && <span style={{ color: 'var(--critical)' }}>(mandatory on return)</span>}
          </label>
          <textarea
            rows={4}
            disabled={!canAct}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Required if returning to the officer; optional on approval."
          />
        </div>
        <div className="field-block">
          <label className="field-label">Return reason</label>
          <div>
            {RETURN_REASONS.map(r => (
              <span
                key={r}
                className={`reason-pill ${returnReasonPicked === r ? 'picked' : ''}`}
                onClick={canAct ? () => setReturnReasonPicked(returnReasonPicked === r ? null : r) : undefined}
                style={canAct ? { cursor: 'pointer' } : undefined}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
        {canAct ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            {clearance === 'C3' ? (
              <>
                <button type="button" className="btn btn-red" onClick={() => onApprove(comment)}>Approve</button>
                <button type="button" className="btn btn-ghost" onClick={() => onReturn(comment, returnReasonPicked || '')}>Return to officer</button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-red" onClick={() => onAuthorise(comment)}>Authorise & close</button>
                <button type="button" className="btn btn-ghost" onClick={() => onReturn(comment, returnReasonPicked || '')}>Return to officer</button>
                <button type="button" className="btn btn-outline-red" onClick={() => onReject(comment)}>Reject case</button>
              </>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 8 }}>This case is not currently awaiting your action.</div>
        )}
      </div>

      <div className="card">
        <div className="section-title">Control gates</div>
        <GateRow state="ok" title="Author ≠ reviewer" note="R. Menon authored; S. Fernandes / A. Belhoul review — four-eye satisfied." />
        <GateRow state={c.status === 'Review' || c.status === 'Authority' ? 'ok' : 'na'} title="Screening re-run within 24h" note="Confirmed on last submission." />
        <GateRow state={c.evidence.length ? 'ok' : 'warn'} title="Evidence attached" note={`${c.evidence.length} file(s) on record.`} />
        <GateRow state={c.remainH < 0 ? 'warn' : 'ok'} title="SLA status" note={c.remainH < 0 ? 'Past response window.' : 'Within response window.'} />
        <GateRow
          state={requiresAuthority ? 'warn' : 'na'}
          title="Authorisation required"
          note={requiresAuthority ? 'Head of FIU sign-off required before closure.' : 'Closes at review; no authority step required.'}
        />
      </div>
    </div>
  );
}
