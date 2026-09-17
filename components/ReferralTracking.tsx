'use client';

import { typeOf } from '@/lib/data';
import { fmtDT, myReferralCases, slaTone } from '@/lib/helpers';
import type { CaseRecord } from '@/lib/types';
import { StatusPill, Pill } from './Pill';

const STEPS = ['Received by the FIU', 'Under assessment', 'Review', 'Authorisation', 'Closed'];

export default function ReferralTracking({
  cases,
  activeCaseId,
  setActiveCaseId,
}: {
  cases: CaseRecord[];
  activeCaseId: string | null;
  setActiveCaseId: (id: string) => void;
}) {
  const list = myReferralCases(cases);
  const c = (activeCaseId && list.find(x => x.id === activeCaseId)) || list[0];

  if (!c) {
    return <div className="card">You haven&apos;t filed any referrals yet.</div>;
  }

  const sla = slaTone(c.remainH);
  const color = sla.cls === 'red' ? 'var(--critical)' : sla.cls === 'amber' ? 'var(--amber)' : 'var(--healthy)';
  const bg = sla.cls === 'red' ? 'var(--tint-red)' : sla.cls === 'amber' ? 'var(--tint-amber)' : 'var(--tint-green)';
  const stepIndex =
    c.status === 'Unassigned' ? 0 :
    c.status === 'Assessment' ? 1 :
    c.status === 'Review' || c.status === 'Returned' ? 2 :
    c.status === 'Authority' ? 3 : 4;

  return (
    <>
      <div className="filter-bar" style={{ marginBottom: 4 }}>
        {list.map(x => (
          <div key={x.id} className={`filter-pill ${x.id === c.id ? 'active' : ''}`} onClick={() => setActiveCaseId(x.id)}>
            {x.id} <span className="c">{x.status}</span>
          </div>
        ))}
      </div>
      <div className="boarding-pass">
        <div className="bp-kicker">NBB · Case boarding pass</div>
        <div className="bp-serial">{c.id}</div>
        <div className="bp-route">
          <div><div className="k">From</div><div className="v">{c.branch}</div></div>
          <div className="bp-arrow">→</div>
          <div><div className="k">To</div><div className="v">{typeOf(c.type).desk}</div></div>
        </div>
        <div className="bp-foot">
          Status: {c.status.toLowerCase()} · {c.assignedOfficer ? `Assigned to ${c.assignedOfficer}` : 'Awaiting allocation'} · Human maker/checker review required
        </div>
      </div>

      <div className="card-lg">
        <div className="case-header">
          <div>
            <div className="case-tags">
              <StatusPill status={c.status} />
              <Pill className="pill-grey">{typeOf(c.type).label}</Pill>
            </div>
            <h2 className="case-subject">{c.subject}</h2>
          </div>
          <div className="turnaround-block" style={{ background: bg }}>
            <div className="turnaround-figure" style={{ color }}>{sla.text}</div>
            <div className="turnaround-label">Response countdown</div>
          </div>
        </div>
        <div className="progress-spine">
          {STEPS.map((s, i) => (
            <div className="pspine-step" key={s}>
              <div className={`pspine-line ${i <= stepIndex ? 'filled' : ''}`} />
              <div className={`pspine-dot ${i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'}`}>
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <div className="pspine-label">{s}</div>
            </div>
          ))}
        </div>
      </div>

      {c.outcome && (
        <div className="outcome-card">
          <div className="h">Outcome</div>
          <div className="b">{c.outcome}</div>
        </div>
      )}

      <div className="card">
        <div className="section-title">Update log</div>
        {c.audit
          .filter(a => !['Submitted for review', 'Submitted for review (v2)', 'Approved — escalated to authority'].includes(a.action))
          .map((a, i) => (
            <div className="audit-item" key={i}>
              <div className={`audit-dot ${a.tone === 'red' ? 'red' : a.tone === 'green' ? 'green' : 'grey'}`} />
              <div><div className="audit-action">{a.action}<span className="audit-time">{fmtDT(a.ts)}</span></div></div>
            </div>
          ))}
      </div>

      <div className="card">
        <div className="section-title">Material you attached</div>
        <div>
          {c.evidence.map(e => (
            <span className="file-chip" key={e.name}>
              <span className="file-ext">{e.ext}</span>{e.name}<span style={{ color: 'var(--ink-faint)' }}>{e.size}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
