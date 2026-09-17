'use client';

import { TYPES, typeOf } from '@/lib/data';
import type { ReferralDraft } from '@/lib/types';

export default function FileReferral({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: ReferralDraft;
  setDraft: (updater: (d: ReferralDraft) => ReferralDraft) => void;
  onSubmit: () => void;
}) {
  const t = draft.type ? typeOf(draft.type) : null;

  return (
    <div className="case-body">
      <div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="step-heading"><div className="step-num">1</div><div className="step-title">What are you referring?</div></div>
          <div className="step-helper">
            {t ? t.guidance : 'Choose the category that best matches what you observed. This determines which desk receives it and the response window that applies.'}
          </div>
          <div className="type-grid">
            {TYPES.map(ty => (
              <button
                key={ty.key}
                type="button"
                className={`type-btn ${draft.type === ty.key ? 'selected' : ''}`}
                onClick={() => setDraft(d => ({ ...d, type: ty.key }))}
              >
                {ty.label}
              </button>
            ))}
          </div>

          <div className="step-heading"><div className="step-num">2</div><div className="step-title">Who is it about?</div></div>
          <div className="step-helper">Basic identifying detail only — the assessment itself stays inside the FIU.</div>
          <div className="qa-grid">
            <div>
              <label className="field-label">Customer / entity</label>
              <input className="text-input" value={draft.subject} placeholder="Name or account holder" onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Account</label>
              <input className="text-input" value={draft.account} placeholder="Account or reference number" onChange={e => setDraft(d => ({ ...d, account: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Amount involved (if any)</label>
              <input className="text-input" value={draft.amount} placeholder="e.g. BHD 4,200" onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Urgency</label>
              <select className="select-input" value={draft.urgency} onChange={e => setDraft(d => ({ ...d, urgency: e.target.value }))}>
                {['Routine', 'Elevated', 'Urgent', 'Immediate'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="step-heading" style={{ marginTop: 18 }}><div className="step-num">3</div><div className="step-title">What did you observe?</div></div>
          <div className="step-helper">Describe only what you observed and when — do not speculate about the customer&apos;s intent.</div>
          <div style={{ marginLeft: 32 }}>
            <textarea
              rows={6}
              value={draft.narrative}
              placeholder="What happened, when, and what drew your attention to it?"
              onChange={e => setDraft(d => ({ ...d, narrative: e.target.value }))}
            />
            <div className="char-count">{draft.narrative.length} characters &middot; minimum 40</div>
            <div className="tipoff-note">Reminder: do not disclose to the customer that a referral has been made (tipping-off).</div>
            <div className="field-block" style={{ marginTop: 14 }}>
              <label className="field-label">What do you need from the FIU? (optional)</label>
              <textarea
                rows={2}
                value={draft.needs}
                placeholder="e.g. guidance on whether to release a pending payment"
                onChange={e => setDraft(d => ({ ...d, needs: e.target.value }))}
              />
            </div>
            <button type="button" className="dashed-add">+ Attach document</button>
          </div>

          <div style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-red" onClick={onSubmit}>Submit referral</button>
          </div>
        </div>
      </div>

      <div>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Routing</div>
          <div className="route-row"><div>Receiving desk</div><div className="v">{t ? t.desk : '—'}</div></div>
          <div className="route-row"><div>Response SLA</div><div className="v">{t ? `${t.slaHours}h` : '—'}</div></div>
          <div className="route-row"><div>Approval path</div><div className="v">{t ? (t.authority ? 'Officer → Reviewer → Head of FIU' : 'Officer → Reviewer') : '—'}</div></div>
          <div className="route-row"><div>Raised by</div><div className="v">H. Al Suwaidi</div></div>
        </div>
        <div className="notice-amber">
          Before you submit: referrals are reviewed by the FIU and remain confidential from the customer and branch management. A thin narrative with no observed detail will be returned for rework before it reaches an officer.
        </div>
      </div>
    </div>
  );
}
