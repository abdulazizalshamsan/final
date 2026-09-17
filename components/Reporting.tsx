'use client';

const SOURCE_PERF = [
  { name: 'Manama Souq', raised: 38, tat: '2.1d', met: 92, ret: 9, esc: 2 },
  { name: 'Muharraq', raised: 22, tat: '2.8d', met: 84, ret: 14, esc: 1 },
  { name: 'Seef district', raised: 19, tat: '1.9d', met: 95, ret: 5, esc: 3 },
  { name: 'Sitra Industrial', raised: 14, tat: '3.2d', met: 79, ret: 18, esc: 1 },
  { name: 'Corporate Banking Desk 2', raised: 11, tat: '2.6d', met: 88, ret: 11, esc: 2 },
  { name: 'Trade Finance Centre', raised: 9, tat: '2.4d', met: 90, ret: 7, esc: 1 },
  { name: 'Cards Operations', raised: 31, tat: '1.6d', met: 94, ret: 6, esc: 1 },
];
function slaColor(v: number) {
  return v >= 90 ? 'var(--healthy)' : v >= 80 ? 'var(--amber)' : 'var(--critical)';
}
const REWORK: [string, number][] = [
  ['Insufficient evidence', 19],
  ['Missing risk justification', 14],
  ['Incomplete evidence attachments', 11],
  ['Screening not re-run within 24h', 9],
  ['Narrative quality / clarity', 6],
];
const REWORK_MAX = 19;

export default function Reporting() {
  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-tile"><div className="kpi-label">Cases closed QTD</div><div className="kpi-figure">418</div><div className="kpi-note">01 Jul – 15 Sep 2026</div></div>
        <div className="kpi-tile"><div className="kpi-label">SLA adherence</div><div className="kpi-figure" style={{ color: 'var(--healthy)' }}>89%</div><div className="kpi-note">Target 90% &middot; 46 breaches, 11 escalated</div></div>
        <div className="kpi-tile"><div className="kpi-label">Returned at review</div><div className="kpi-figure" style={{ color: 'var(--amber)' }}>14%</div><div className="kpi-note">Of all submissions</div></div>
        <div className="kpi-tile"><div className="kpi-label">Four-eye coverage</div><div className="kpi-figure" style={{ color: 'var(--healthy)' }}>100%</div><div className="kpi-note">No case cleared by its own author</div></div>
      </div>

      <div className="card">
        <div className="section-title">Source performance — branches & business units</div>
        <div className="rep-table">
          <div className="rep-head"><div>Source</div><div>Raised</div><div>Avg TAT</div><div>SLA met</div><div>Returned</div><div>Escalated</div></div>
          {SOURCE_PERF.map(s => (
            <div className="rep-row" key={s.name}>
              <div>{s.name}</div>
              <div className="mono">{s.raised}</div>
              <div className="mono">{s.tat}</div>
              <div className="mono" style={{ color: slaColor(s.met) }}>{s.met}%</div>
              <div className="mono">{s.ret}%</div>
              <div className="mono">{s.esc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Rejection & rework reasons</div>
        {REWORK.map(([label, count]) => (
          <div className="bar-row" key={label}>
            <div className="bar-label">{label}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${((count / REWORK_MAX) * 100).toFixed(0)}%` }} /></div>
            <div className="bar-count">{count}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="reg-extract">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/nbb-mark.png" alt="" />
          <div>
            <div className="section-title" style={{ marginBottom: 6 }}>Regulatory extract</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-4)', lineHeight: 1.6 }}>
              Formatted for CBB and FIU inspection in the standard extract layout: filing volumes, freeze actions and sealed audit event counts for the current reporting period.
            </div>
          </div>
        </div>
        <div className="reg-rows">
          <div className="reg-row"><div>Period</div><div className="v">01 Jul – 15 Sep 2026</div></div>
          <div className="reg-row"><div>Cases in scope</div><div className="v">418</div></div>
          <div className="reg-row"><div>SAR/STR filings</div><div className="v">37</div></div>
          <div className="reg-row"><div>Freeze orders actioned</div><div className="v">12</div></div>
          <div className="reg-row"><div>Audit events sealed</div><div className="v">6,204</div></div>
        </div>
        <button type="button" className="btn btn-red" style={{ width: '100%' }}>Generate pack (XLSX + signed PDF)</button>
      </div>
    </>
  );
}
