'use client';

import { fmtDT } from '@/lib/helpers';
import type { CaseRecord } from '@/lib/types';

function renderDiff(c: CaseRecord) {
  if (!c.submission || (c.version || 1) < 2) {
    return <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Single version on file — no prior submission to compare.</div>;
  }
  const fields: [string, string][] = [
    ['Disposition', c.submission.disposition],
    ['Revised risk', c.submission.revisedRisk],
    ['Action requested', c.submission.action],
  ];
  const before: Record<string, string> = {
    Disposition: 'No further action — risk accepted',
    'Revised risk': 'Low',
    'Action requested': 'None on file.',
  };
  return (
    <>
      {fields.map(([k, v]) => (
        <div className="diff-grid" key={k}>
          <div className="diff-pane before"><div className="diff-k">v1 — before</div>{before[k]}</div>
          <div className="diff-pane after"><div className="diff-k">v{c.version} — after</div>{v}</div>
        </div>
      ))}
    </>
  );
}

export default function AuditTab({ c }: { c: CaseRecord }) {
  return (
    <div className="case-body">
      <div className="card">
        <div className="section-title">Sealed audit log</div>
        {c.audit.map((a, i) => (
          <div className="audit-item" key={i}>
            <div className={`audit-dot ${a.tone}`} />
            <div>
              <div className="audit-action">{a.action}<span className="audit-time">{fmtDT(a.ts)}</span></div>
              <div className="audit-who">{a.actor} &middot; {a.role}</div>
              {a.note && <div className="audit-note">{a.note}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="section-title">Version compare</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button type="button" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }}>v1</button>
          <span style={{ color: 'var(--ink-faint)', alignSelf: 'center' }}>&harr;</span>
          <button type="button" className="btn btn-dark" style={{ padding: '6px 12px', fontSize: 11 }}>v{c.version || 1}</button>
        </div>
        <div className="caption" style={{ marginBottom: 10 }}>Only fields changed between the returned submission and the current record are highlighted.</div>
        {renderDiff(c)}
      </div>
    </div>
  );
}
