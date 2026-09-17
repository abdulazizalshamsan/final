'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { typeOf, CLEARANCES, AUTHORITY_DISPOSITIONS } from '@/lib/data';
import type { CaseRecord, ClearanceCode } from '@/lib/types';
import './airport.css';
import {
  LANE_LABELS,
  deskLane,
  lanePosition,
  checkerApron,
  breachApron,
  holdApron,
  type Placement,
} from './airportLayout';
import WhatIfForecast, { type ForecastPreview } from './WhatIfForecast';

const MAKER_STATUSES: CaseRecord['status'][] = ['Unassigned', 'Assessment', 'Returned'];
const LANE_THRESHOLD = [2, 3, 3];
const FALLBACK_PLACEMENT: Placement = { x: 50, y: 78, r: 0, s: 1 };

function isClosed(c: { status: CaseRecord['status'] }) {
  return c.status === 'Cleared' || c.status === 'Rejected';
}

export default function AirportSituationRoom({
  cases,
  clearance,
  focusCaseId,
  onOpenCase,
  onQuickSubmitToChecker,
  onQuickApprove,
  onQuickAuthorise,
  onHoldForInfo,
  onResumeReview,
  onReturnToPool,
}: {
  cases: CaseRecord[];
  clearance: ClearanceCode;
  focusCaseId: string | null;
  onOpenCase: (id: string) => void;
  onQuickSubmitToChecker: (id: string) => void;
  onQuickApprove: (id: string) => void;
  onQuickAuthorise: (id: string) => void;
  onHoldForInfo: (id: string) => void;
  onResumeReview: (id: string) => void;
  onReturnToPool: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(cases.find(c => !isClosed(c))?.id ?? null);
  const [paused, setPaused] = useState(false);
  const [demoBreached, setDemoBreached] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('Select any aircraft, then change its case status.');
  const [showForecast, setShowForecast] = useState(false);
  const [forecast, setForecast] = useState<ForecastPreview | null>(null);
  // Departing cases keep their last real placement (captured the moment they closed) while they fly out.
  const [departing, setDeparting] = useState<Map<string, Placement>>(new Map());
  const [departed, setDeparted] = useState<Set<string>>(new Set());
  const prevStatus = useRef<Map<string, CaseRecord['status']>>(new Map());
  const lastPlacementRef = useRef<Map<string, Placement>>(new Map());

  // Sync selection to an incoming "Follow aircraft" request without an extra render round-trip.
  const [syncedFocusId, setSyncedFocusId] = useState(focusCaseId);
  if (focusCaseId !== syncedFocusId) {
    setSyncedFocusId(focusCaseId);
    if (focusCaseId) setSelectedId(focusCaseId);
  }

  const activeCases = useMemo(
    () => cases.filter(c => !departed.has(c.id) && (!isClosed(c) || departing.has(c.id))),
    [cases, departed, departing],
  );

  const placements = useMemo(() => {
    const map = new Map<string, Placement>();
    const makerSlot: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
    const checkerSlot: Record<number, number> = { 0: 0, 1: 0, 2: 0 };
    let breachIdx = 0;
    let holdIdx = 0;
    const sorted = [...activeCases].sort((a, b) => a.id.localeCompare(b.id));
    for (const c of sorted) {
      if (departing.has(c.id)) continue; // keeps its last real placement while it flies out
      if (c.awaitingInfo) {
        map.set(c.id, holdApron(holdIdx++));
        continue;
      }
      const breached = c.remainH < 0 || demoBreached.has(c.id);
      if (breached) {
        map.set(c.id, breachApron(breachIdx++));
        continue;
      }
      const t = deskLane(typeOf(c.type).desk);
      if (MAKER_STATUSES.includes(c.status)) {
        map.set(c.id, lanePosition(t, makerSlot[t]++));
      } else {
        map.set(c.id, checkerApron(t, checkerSlot[t]++));
      }
    }
    return map;
  }, [activeCases, demoBreached, departing]);

  // Cache each case's last computed placement (outside of render) so a departure animation
  // can start from where the aircraft actually was, even after it drops out of `placements`.
  useEffect(() => {
    const cache = lastPlacementRef.current;
    for (const [id, p] of placements) cache.set(id, p);
  }, [placements]);

  // Detect real cases newly closed (Cleared/Rejected) and play a short departure animation
  // before removing them from the active scene, instead of letting them vanish instantly.
  useEffect(() => {
    const next = new Map<string, CaseRecord['status']>();
    for (const c of cases) {
      const prev = prevStatus.current.get(c.id);
      if (isClosed(c) && prev && !isClosed({ status: prev }) && !departed.has(c.id) && !departing.has(c.id)) {
        const start = lastPlacementRef.current.get(c.id) ?? FALLBACK_PLACEMENT;
        setDeparting(s => new Map(s).set(c.id, start));
        window.setTimeout(() => {
          setDeparting(s => { const n = new Map(s); n.delete(c.id); return n; });
          setDeparted(s => new Set(s).add(c.id));
        }, 1300);
      }
      next.set(c.id, c.status);
    }
    prevStatus.current = next;
  }, [cases, departed, departing]);

  const pending = cases.filter(c => !isClosed(c));
  const received = cases.length;
  const breachedPending = pending.filter(c => c.remainH < 0).length;
  const completed = cases.length - pending.length;

  const selected = cases.find(c => c.id === selectedId) || null;
  const selectedDesk = selected ? typeOf(selected.type).desk : null;
  const selectedLane = selectedDesk ? deskLane(selectedDesk) : 0;
  const lanePending = selectedDesk ? pending.filter(c => deskLane(typeOf(c.type).desk) === selectedLane).length : 0;
  const laneBreached = selectedDesk
    ? pending.filter(c => deskLane(typeOf(c.type).desk) === selectedLane && c.remainH < 0).length
    : 0;

  function badgeInfo(c: CaseRecord) {
    if (c.awaitingInfo) return { cls: 'hold', text: 'Ⅱ' };
    if (c.remainH < 0 || demoBreached.has(c.id)) return { cls: 'breached', text: 'BREACHED' };
    if (c.status === 'Authority') return { cls: 'authority', text: '⚑' };
    return { cls: '', text: '◷' };
  }

  function stateText(c: CaseRecord) {
    if (c.awaitingInfo) return 'Awaiting information';
    return { Unassigned: 'Unassigned', Assessment: 'Maker review', Review: 'Checker review', Authority: 'Authority review', Returned: 'Returned to maker', Cleared: 'Completed', Rejected: 'Rejected' }[c.status];
  }

  function canSubmitToChecker(c: CaseRecord) {
    return clearance === 'C2' && c.status === 'Assessment' && !!c.submission && c.submission.assessment.trim().length >= 30;
  }
  function canApprove(c: CaseRecord) {
    return clearance === 'C3' && c.status === 'Review';
  }
  function canAuthorise(c: CaseRecord) {
    return clearance === 'C4' && c.status === 'Authority';
  }
  function canHold(c: CaseRecord) {
    return !c.awaitingInfo && !isClosed(c) && (clearance === 'C2' || clearance === 'C3' || clearance === 'C4');
  }
  function canResume(c: CaseRecord) {
    return !!c.awaitingInfo && (clearance === 'C2' || clearance === 'C3' || clearance === 'C4');
  }
  function canReturnToPool(c: CaseRecord) {
    return !isClosed(c) && !!c.assignedOfficer && MAKER_STATUSES.includes(c.status) && (clearance === 'C2' || clearance === 'C3' || clearance === 'C4');
  }

  function act(kind: string) {
    if (!selected) return;
    const requiresAuthority = !!selected.submission && (typeOf(selected.type).authority || AUTHORITY_DISPOSITIONS.includes(selected.submission.disposition));
    if (kind === 'checker') { onQuickSubmitToChecker(selected.id); setMessage(`${selected.id}: sent to the checker.`); }
    else if (kind === 'approve') {
      onQuickApprove(selected.id);
      setMessage(requiresAuthority ? `${selected.id}: approved — escalated to the Head of FIU.` : `${selected.id}: approved. The aircraft departs.`);
    } else if (kind === 'authorise') { onQuickAuthorise(selected.id); setMessage(`${selected.id}: authorised. The aircraft departs.`); }
    else if (kind === 'hold') { onHoldForInfo(selected.id); setMessage(`${selected.id}: awaiting information. The SLA continues running.`); }
    else if (kind === 'resume') { onResumeReview(selected.id); setMessage(`${selected.id}: information received; review resumes.`); }
    else if (kind === 'return') { onReturnToPool(selected.id); setMessage(`${selected.id}: returned to the unassigned pool. The SLA clock is unaffected.`); }
    else if (kind === 'breach') {
      setDemoBreached(s => new Set(s).add(selected.id));
      setMessage(`${selected.id}: SLA expiry SIMULATED for this demo — its real owner and review stage are unchanged.`);
    } else if (kind === 'clear-breach') {
      setDemoBreached(new Set());
      setMessage('Simulated breaches cleared. Real SLA state is untouched.');
    }
  }

  const laneLoad = [0, 1, 2].map(t => pending.filter(c => deskLane(typeOf(c.type).desk) === t).length);

  return (
    <div className="airport-room">
      <div className="mission-strip">
        <span className="journey-live">
          {forecast ? `FORECAST WEATHER · ${LANE_LABELS[forecast.lane]}` : 'Operational weather reflects each lane’s live queue.'}
        </span>
        <button type="button" className="btn btn-ghost" onClick={() => setShowForecast(s => !s)}>
          {showForecast ? 'Hide staffing forecast' : 'Try a staffing forecast →'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setPaused(p => !p)}>
          {paused ? 'Resume motion' : 'Pause motion'}
        </button>
        {demoBreached.size > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => act('clear-breach')}>Clear simulated breaches</button>
        )}
      </div>

      {showForecast && (
        <div style={{ padding: '0 20px 16px' }}>
          <WhatIfForecast cases={cases} onPreview={setForecast} onClose={() => setShowForecast(false)} />
        </div>
      )}

      <div className="scene">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="background"
          src="/assets/Airport-Background.jpg"
          alt="Empty airport tarmac and control tower at night. Every aircraft shown is a separate, selectable case — none are part of the background art."
        />
        <div className="brand-mask">NBB <small>National Bank<br />of Bahrain</small></div>

        {[0, 1, 2].map(t => {
          const threshold = LANE_THRESHOLD[t];
          const load = forecast && forecast.lane === t ? forecast.projected : laneLoad[t];
          const rain = load > threshold;
          return (
            <button
              key={t}
              type="button"
              className="weather-pod"
              style={{ left: `${[43, 56, 69][t]}%` }}
              title={`${(forecast && forecast.lane === t ? 'Projected ' : '')}${load} pending; illustrative workload-pressure threshold ${threshold}. This is workload weather, not a breach count.`}
            >
              {rain ? '☂ Rain' : '☀ Clear'}{forecast && forecast.lane === t ? ' · forecast' : ''}
            </button>
          );
        })}
        {[0, 1, 2].map(t => {
          const threshold = LANE_THRESHOLD[t];
          const load = forecast && forecast.lane === t ? forecast.projected : laneLoad[t];
          if (load <= threshold) return null;
          return (
            <div key={t} className="rainzone" style={{ left: `${[36, 52, 65][t]}%` }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="raindrop" style={{ left: `${i * 7}%`, animationDelay: `${-i * 0.14}s`, animationPlayState: paused ? 'paused' : 'running' }} />
              ))}
            </div>
          );
        })}

        <div className="metric m0"><span className="n-label">Received</span>{received}</div>
        <div className="metric m1"><span className="n-label">Pending</span>{pending.length}</div>
        <div className="metric m2"><span className="n-label">Breached</span>{breachedPending}</div>
        <div className="metric m3"><span className="n-label">Completed</span>{completed}</div>

        {activeCases.map(c => {
          const departStart = departing.get(c.id);
          const p = departStart
            ? { x: departStart.x - 13, y: 101, r: 15, s: 1.65 }
            : placements.get(c.id) || FALLBACK_PLACEMENT;
          const badge = badgeInfo(c);
          return (
            <button
              key={c.id}
              type="button"
              className={`plane ${c.id === selectedId ? 'selected' : ''} ${badge.cls} ${departing.has(c.id) ? 'departing' : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%,-50%) scale(${p.s})` }}
              aria-label={`${c.id} ${typeOf(c.type).desk}`}
              aria-pressed={c.id === selectedId}
              onClick={() => { setSelectedId(c.id); setMessage(`${c.id} selected.`); }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/Aircraft-Sprite.png" alt="" style={{ transform: `rotate(${p.r}deg)` }} />
              <span className="badge" aria-hidden="true">{badge.text}</span>
            </button>
          );
        })}

        {selected && (
          <div className="inspector">
            <h3>{typeOf(selected.type).desk}</h3>
            <div className="id">{selected.id}</div>
            <div className="data">
              <div>Lane pending<strong>{lanePending}</strong></div>
              <div>Lane breached<strong>{laneBreached}</strong></div>
            </div>
            <div className="person">Officer · {selected.assignedOfficer || 'Unassigned'}</div>
            <div className="person">Reviewer · {CLEARANCES.C3.who}</div>
            <div className="state">{stateText(selected)}{selected.remainH < 0 ? ' · SLA breached' : ''}</div>
          </div>
        )}
      </div>

      <div className="hud">
        <div className="title">
          <span>{selected ? `${selected.id} · ${typeOf(selected.type).desk}` : 'No case selected'}</span>
          <span>{selected ? stateText(selected) : ''}</span>
        </div>
        <div className="copy">{message}</div>
        <div className="selection">
          <label htmlFor="airport-case-picker">Selected case</label>
          <select
            id="airport-case-picker"
            className="select-input"
            value={selectedId ?? ''}
            onChange={e => { setSelectedId(e.target.value); setMessage(`${e.target.value} selected.`); }}
          >
            {activeCases.map(c => (
              <option key={c.id} value={c.id}>{c.id} · {typeOf(c.type).desk}</option>
            ))}
          </select>
        </div>
        <div className="actions">
          <button type="button" onClick={() => selected && onOpenCase(selected.id)} disabled={!selected}>Open case file →</button>
          <button type="button" onClick={() => act('checker')} disabled={!selected || !canSubmitToChecker(selected)}>Send to checker</button>
          <button type="button" className="approve" onClick={() => act('approve')} disabled={!selected || !canApprove(selected)}>Approve</button>
          <button type="button" className="approve" onClick={() => act('authorise')} disabled={!selected || !canAuthorise(selected)}>Authorise & close</button>
          <button type="button" onClick={() => act('hold')} disabled={!selected || !canHold(selected)}>Await information</button>
          <button type="button" onClick={() => act('resume')} disabled={!selected || !canResume(selected)}>Resume review</button>
          <button type="button" onClick={() => act('return')} disabled={!selected || !canReturnToPool(selected)}>Return to pool</button>
          <button type="button" className="breach" onClick={() => act('breach')} disabled={!selected || selected.remainH < 0 || demoBreached.has(selected.id)}>Simulate SLA breach</button>
        </div>
        <div className="event">{activeCases.length} aircraft shown are separate case objects — none are baked into the background.</div>
        <div className="note">
          Fixed-camera layered view · Real cases from the live workflow · &ldquo;Simulate SLA breach&rdquo; is a demo-only overlay and never changes real SLA state · Completion requires the checker stage.
        </div>
      </div>
    </div>
  );
}
