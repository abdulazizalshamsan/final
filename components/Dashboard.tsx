'use client';

import { typeOf } from '@/lib/data';
import { myActionCases, roleNoun } from '@/lib/helpers';
import type { CaseRecord, ClearanceCode, DashboardMode, ViewKey } from '@/lib/types';
import { StatusPill } from './Pill';
import AirportSituationRoom from './airport/AirportSituationRoom';

const POSTURE = [
  { name: 'Sanctions & PEP', level: 4, count: 18 },
  { name: 'AML & monitoring', level: 3, count: 61 },
  { name: 'Fraud', level: 2, count: 34 },
  { name: 'KYC & ratings', level: 1, count: 32 },
];
const ledColor = (lvl: number) => (lvl >= 4 ? 'lit-r' : lvl >= 3 ? 'lit-a' : 'lit-g');

const SPARK = [9, 12, 7, 14, 11, 16, 10, 8, 13, 19, 15, 12, 17, 14];
const SPARK_MAX = 19;

const AGEING = [
  { label: '0–1 day', count: 52, tone: 'var(--healthy)' },
  { label: '2–3 days', count: 41, tone: 'var(--amber)' },
  { label: '4–7 days', count: 33, tone: 'var(--amber)' },
  { label: '8 days +', count: 19, tone: 'var(--critical)' },
];
const AGE_MAX = Math.max(...AGEING.map(a => a.count));

const SOURCES = [
  { name: 'Retail Banking — 21 branches', sla: 91, count: 64 },
  { name: 'Wholesale Banking', sla: 88, count: 22 },
  { name: 'Cards & Payments', sla: 93, count: 19 },
  { name: 'Private Banking', sla: 82, count: 14 },
  { name: 'Transaction monitoring desk', sla: 90, count: 17 },
  { name: 'Legal & regulator RFIs', sla: 96, count: 9 },
];
function slaColor(v: number) {
  return v >= 90 ? 'var(--healthy)' : v >= 80 ? 'var(--amber)' : 'var(--critical)';
}

function FlowNode({ label, count, tone }: { label: string; count: number; tone: 'red' | 'amber' }) {
  const dim = count === 0;
  return (
    <div className="flow-node-col">
      <div className={`flow-node ${dim ? 'dim' : tone}`}>
        <div className="n">{count}</div>
      </div>
      <div className="flow-label">{label}</div>
    </div>
  );
}
function FlowTrack({ delay }: { delay: number }) {
  return (
    <div className="flow-track">
      <div className="flow-pulse" style={{ animationDelay: `${delay.toFixed(2)}s` }} />
    </div>
  );
}

export default function Dashboard({
  clearance,
  cases,
  onOpen,
  onNav,
  dashboardMode,
  setDashboardMode,
  focusCaseId,
  onQuickSubmitToChecker,
  onQuickApprove,
  onQuickAuthorise,
  onHoldForInfo,
  onResumeReview,
  onReturnToPool,
}: {
  clearance: ClearanceCode;
  cases: CaseRecord[];
  onOpen: (id: string) => void;
  onNav: (v: ViewKey) => void;
  dashboardMode: DashboardMode;
  setDashboardMode: (m: DashboardMode) => void;
  focusCaseId: string | null;
  onQuickSubmitToChecker: (id: string) => void;
  onQuickApprove: (id: string) => void;
  onQuickAuthorise: (id: string) => void;
  onHoldForInfo: (id: string) => void;
  onResumeReview: (id: string) => void;
  onReturnToPool: (id: string) => void;
}) {
  const myQueue = myActionCases(cases, clearance);

  return (
    <>
      <div className="mode-switch" role="tablist" aria-label="Situation room view">
        <button type="button" role="tab" aria-selected={dashboardMode === 'data'} className={`mode-switch-btn ${dashboardMode === 'data' ? 'active' : ''}`} onClick={() => setDashboardMode('data')}>
          Operating picture
        </button>
        <button type="button" role="tab" aria-selected={dashboardMode === 'airport'} className={`mode-switch-btn ${dashboardMode === 'airport' ? 'active' : ''}`} onClick={() => setDashboardMode('airport')}>
          Airport view
        </button>
      </div>

      {dashboardMode === 'airport' && (
        <AirportSituationRoom
          cases={cases}
          clearance={clearance}
          focusCaseId={focusCaseId}
          onOpenCase={onOpen}
          onQuickSubmitToChecker={onQuickSubmitToChecker}
          onQuickApprove={onQuickApprove}
          onQuickAuthorise={onQuickAuthorise}
          onHoldForInfo={onHoldForInfo}
          onResumeReview={onResumeReview}
          onReturnToPool={onReturnToPool}
        />
      )}

      {dashboardMode === 'data' && (
      <>
      <div className="hero">
        <div className="hero-aurora-red" />
        <div className="hero-aurora-amber" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-watermark" src="/assets/nbb-mark.png" alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />
        <div className="hero-scanlines" />
        <div className="hero-sweep" />
        <div className="hero-content">
          <div className="hero-live">
            <span className="watch-dot" />
            LIVE OPERATING PICTURE &middot; 15 Sep 2026 &middot; 11:20 GST &middot; watch B
          </div>
          <div className="hero-readouts">
            <div className="hero-readout">
              <div className="figure" style={{ fontSize: 46, letterSpacing: '-0.04em', color: 'var(--ink-1)' }}>145</div>
              <div className="label">Cases live bank-wide</div>
            </div>
            <div className="hero-readout">
              <div className="figure" style={{ fontSize: 26, color: 'var(--critical)' }}>4</div>
              <div className="label">Past response SLA</div>
            </div>
            <div className="hero-readout">
              <div className="figure" style={{ fontSize: 26, color: 'var(--healthy)' }}>26</div>
              <div className="label">Cleared in the last 24h</div>
            </div>
          </div>
          <div className="hero-note">
            Sanctions & PEP is running elevated on four live screening matches; one case is currently past its
            4-hour response window and awaiting Head of FIU authorisation.
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div className="hero-right-title">Threat posture by desk</div>
          {POSTURE.map(p => (
            <div className="desk-row" key={p.name}>
              <div className="desk-name">{p.name}</div>
              <div className="led-meter">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`led ${i <= p.level ? ledColor(p.level) : ''}`} />
                ))}
              </div>
              <div className="desk-count">{p.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="row-sla-flow">
        <div className="card-lg dial-wrap">
          <div className="section-title" style={{ alignSelf: 'flex-start' }}>SLA compliance</div>
          <div className="dial">
            <div className="dial-inner">
              <div className="dial-figure">89%</div>
              <div className="dial-label">OF TARGET 90%</div>
            </div>
          </div>
          <div className="dial-legend">
            <div className="legend-row"><span><span className="sw" style={{ background: 'var(--healthy)' }} />Within SLA</span><span className="mono">372</span></div>
            <div className="legend-row"><span><span className="sw" style={{ background: 'var(--critical)' }} />Breached</span><span className="mono">46</span></div>
            <div className="legend-row"><span><span className="sw" style={{ background: 'var(--amber)' }} />Avg turnaround</span><span className="mono">2.4d</span></div>
          </div>
          <div className="dial-foot">11 of 46 breaches escalated to the Head of FIU under the 48h rule.</div>
        </div>

        <div className="card-lg">
          <div className="section-title">Case flow</div>
          <div className="flow-nodes">
            <FlowNode label="Intake" count={12} tone="red" />
            <FlowTrack delay={0.1} />
            <FlowNode label="Assessment" count={37} tone="red" />
            <FlowTrack delay={0.35} />
            <FlowNode label="Review" count={22} tone="amber" />
            <FlowTrack delay={0.6} />
            <FlowNode label="Authority" count={6} tone="amber" />
          </div>
          <div className="section-title" style={{ marginTop: 22 }}>Intake &middot; last 14 days</div>
          <div className="sparkband">
            {SPARK.map((v, i) => (
              <div
                key={i}
                className="spark-bar"
                style={{ height: `${((v / SPARK_MAX) * 100).toFixed(0)}%`, animationDelay: `${(i * 0.045).toFixed(3)}s` }}
              />
            ))}
          </div>
          <div className="spark-axis"><span>02 Sep</span><span>08 Sep</span><span>15 Sep</span></div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-tile"><div className="kpi-label">Open cases</div><div className="kpi-figure">145</div><div className="kpi-note">Bank-wide, all desks</div></div>
        <div className="kpi-tile"><div className="kpi-label">Awaiting {roleNoun(clearance)}</div><div className="kpi-figure" style={{ color: 'var(--healthy)' }}>{myQueue.length}</div><div className="kpi-note">In your queue right now</div></div>
        <div className="kpi-tile"><div className="kpi-label">Past SLA</div><div className="kpi-figure" style={{ color: 'var(--critical)' }}>4</div><div className="kpi-note">Requires urgent attention</div></div>
        <div className="kpi-tile"><div className="kpi-label">Avg turnaround</div><div className="kpi-figure">2.4d</div><div className="kpi-note">Intake to closure, 90d rolling</div></div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-title">Ageing of open cases</div>
          {AGEING.map(a => (
            <div className="age-row" key={a.label}>
              <div className="age-label">{a.label}</div>
              <div className="age-track"><div className="age-fill" style={{ width: `${((a.count / AGE_MAX) * 100).toFixed(0)}%`, background: a.tone }} /></div>
              <div className="age-count">{a.count}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="section-title">Intake by source</div>
          {SOURCES.map(s => (
            <div className="source-row" key={s.name}>
              <div className="source-name">{s.name}</div>
              <div className="source-right">
                <div className="source-sla" style={{ color: slaColor(s.sla) }}>{s.sla}% SLA</div>
                <div className="source-count">{s.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Requires my action</div>
        {myQueue.length ? (
          myQueue.map(c => (
            <div className="mini-row" key={c.id} onClick={() => onOpen(c.id)}>
              <div>
                <div className="mini-id">{c.id}</div>
                <div className="mini-subject">{c.subject}</div>
                <div className="mini-sub">{c.codename} &middot; {c.threat} threat &middot; {typeOf(c.type).label}</div>
              </div>
              <StatusPill status={c.status} />
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--ink-4)', fontSize: 12, padding: '8px 0' }}>Nothing waiting on you right now.</div>
        )}
        <div style={{ marginTop: 14 }}>
          <a href="#" style={{ fontSize: 11.5, color: 'var(--red-tint)' }} onClick={e => { e.preventDefault(); onNav('queue'); }}>
            Open the watch floor &rarr;
          </a>
        </div>
      </div>
      </>
      )}
    </>
  );
}
