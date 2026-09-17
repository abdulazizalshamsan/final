'use client';

import { useMemo, useState } from 'react';
import { typeOf } from '@/lib/data';
import type { CaseRecord } from '@/lib/types';
import { LANE_LABELS, deskLane } from './airportLayout';

const ARRIVALS_PER_DAY = 8;
const BASE_CAPACITY_PER_DAY = 6;
const CAPACITY_PER_EXTRA_REVIEWER = 4;
const HORIZONS = [1, 3, 5];

export interface ForecastPreview {
  lane: 0 | 1 | 2;
  projected: number;
  days: number;
}

function isPending(c: CaseRecord) {
  return c.status !== 'Cleared' && c.status !== 'Rejected';
}

export default function WhatIfForecast({
  cases,
  onPreview,
  onClose,
}: {
  cases: CaseRecord[];
  onPreview: (preview: ForecastPreview | null) => void;
  onClose: () => void;
}) {
  const [lane, setLane] = useState<0 | 1 | 2>(1);
  const [extra, setExtra] = useState(0);
  const [days, setDays] = useState(3);
  const [previewing, setPreviewing] = useState(false);

  const pendingNow = useMemo(
    () => cases.filter(c => isPending(c) && deskLane(typeOf(c.type).desk) === lane).length,
    [cases, lane],
  );
  const capacity = BASE_CAPACITY_PER_DAY + CAPACITY_PER_EXTRA_REVIEWER * extra;
  const baseline = Math.max(0, pendingNow + days * (ARRIVALS_PER_DAY - BASE_CAPACITY_PER_DAY));
  const projected = Math.max(0, pendingNow + days * (ARRIVALS_PER_DAY - capacity));
  const max = Math.max(baseline, projected, 1);

  function preview() {
    setPreviewing(true);
    onPreview({ lane, projected, days });
  }
  function stopPreview() {
    setPreviewing(false);
    onPreview(null);
  }
  function close() {
    if (previewing) stopPreview();
    onClose();
  }

  return (
    <div className="card what-if-panel">
      <div className="section-title">What if we add capacity?</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginBottom: 14 }}>
        Change the staffing assumption for one lane and see the predicted queue before making a decision. This never
        changes real cases, SLA deadlines or live totals.
      </div>

      <div className="field-block">
        <label className="field-label">Lane</label>
        <select className="select-input" value={lane} onChange={e => setLane(Number(e.target.value) as 0 | 1 | 2)}>
          {LANE_LABELS.map((l, i) => (
            <option key={l} value={i}>{l}</option>
          ))}
        </select>
      </div>
      <div className="field-block">
        <label className="field-label">Additional eligible reviewers: <strong>{extra}</strong></label>
        <input type="range" min={0} max={3} step={1} value={extra} onChange={e => setExtra(Number(e.target.value))} />
      </div>
      <div className="field-block">
        <label className="field-label">Forecast horizon</label>
        <select className="select-input" value={days} onChange={e => setDays(Number(e.target.value))}>
          {HORIZONS.map(h => (
            <option key={h} value={h}>{h === 1 ? 'Tomorrow' : `In ${h} working days`}</option>
          ))}
        </select>
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '10px 0 16px' }}>
        Illustrative assumptions: {ARRIVALS_PER_DAY} new cases/day; the current team completes{' '}
        {BASE_CAPACITY_PER_DAY}/day; each additional eligible reviewer adds {CAPACITY_PER_EXTRA_REVIEWER}/day.
        Constant rates and sufficient checker capacity are assumed. These are not measured NBB productivity figures.
      </div>

      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <div className="kpi-tile"><div className="kpi-label">Pending now</div><div className="kpi-figure">{pendingNow}</div></div>
        <div className="kpi-tile"><div className="kpi-label">Projected pending</div><div className="kpi-figure" style={{ color: 'var(--amber)' }}>{projected}</div></div>
        <div className="kpi-tile"><div className="kpi-label">Capacity / day</div><div className="kpi-figure">{capacity}</div></div>
      </div>

      <div className="age-row"><div className="age-label" style={{ width: 190 }}>Without extra reviewers</div><div className="age-track"><div className="age-fill" style={{ width: `${(baseline / max) * 100}%`, background: 'var(--critical)' }} /></div><div className="age-count">{baseline}</div></div>
      <div className="age-row"><div className="age-label" style={{ width: 190 }}>With selected staffing</div><div className="age-track"><div className="age-fill" style={{ width: `${(projected / max) * 100}%`, background: 'var(--healthy)' }} /></div><div className="age-count">{projected}</div></div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        {!previewing ? (
          <button type="button" className="btn btn-red" onClick={preview}>Preview forecast weather in airport</button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={stopPreview}>Return to live weather</button>
        )}
        <button type="button" className="btn btn-ghost" onClick={close}>Close</button>
      </div>
      {previewing && (
        <div style={{ fontSize: 11, color: 'var(--red-tint)', marginTop: 10 }}>
          FORECAST WEATHER ONLY · {days} working day{days > 1 ? 's' : ''} · live case totals unchanged
        </div>
      )}
    </div>
  );
}
