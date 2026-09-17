'use client';

import { typeOf } from '@/lib/data';
import { myActionCases, slaTone } from '@/lib/helpers';
import type { CaseRecord, ClearanceCode } from '@/lib/types';
import { StatusPill } from './Pill';

const QUEUE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'mine', label: 'Needs my action' },
  { key: 'Review', label: 'In review' },
  { key: 'Authority', label: 'With authority' },
  { key: 'Returned', label: 'Returned' },
  { key: 'breach', label: 'SLA breached' },
  { key: 'closed', label: 'Closed' },
];

function queueFilterCount(key: string, cases: CaseRecord[], clearance: ClearanceCode) {
  if (key === 'all') return cases.length;
  if (key === 'mine') return myActionCases(cases, clearance).length;
  if (key === 'breach') return cases.filter(c => c.remainH < 0).length;
  if (key === 'closed') return cases.filter(c => c.status === 'Cleared' || c.status === 'Rejected').length;
  return cases.filter(c => c.status === key).length;
}

function filterCases(cases: CaseRecord[], clearance: ClearanceCode, filter: string, search: string) {
  let list = cases.slice();
  if (filter === 'mine') list = myActionCases(cases, clearance);
  else if (filter === 'breach') list = list.filter(c => c.remainH < 0);
  else if (filter === 'closed') list = list.filter(c => c.status === 'Cleared' || c.status === 'Rejected');
  else if (filter !== 'all') list = list.filter(c => c.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(c => (c.subject + c.id + c.codename + c.branch).toLowerCase().includes(q));
  }
  return list;
}

export default function Queue({
  cases,
  clearance,
  queueFilter,
  setQueueFilter,
  queueSearch,
  setQueueSearch,
  onOpen,
}: {
  cases: CaseRecord[];
  clearance: ClearanceCode;
  queueFilter: string;
  setQueueFilter: (v: string) => void;
  queueSearch: string;
  setQueueSearch: (v: string) => void;
  onOpen: (id: string) => void;
}) {
  const list = filterCases(cases, clearance, queueFilter, queueSearch);

  return (
    <>
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search by case ID, subject, codename or branch"
          value={queueSearch}
          onChange={e => setQueueSearch(e.target.value)}
        />
        {QUEUE_FILTERS.map(f => (
          <div
            key={f.key}
            className={`filter-pill ${queueFilter === f.key ? 'active' : ''}`}
            onClick={() => setQueueFilter(f.key)}
          >
            {f.label} <span className="c">{queueFilterCount(f.key, cases, clearance)}</span>
          </div>
        ))}
      </div>
      <div className="table">
        <div className="t-head"><div>Case</div><div>Subject</div><div>Source</div><div>Status</div><div style={{ textAlign: 'right' }}>SLA</div></div>
        {list.length === 0 && (
          <div style={{ padding: '20px 18px', color: 'var(--ink-4)', fontSize: 12 }}>No cases match this filter.</div>
        )}
        {list.map(c => {
          const sla = slaTone(c.remainH);
          const color = sla.cls === 'red' ? 'var(--critical)' : sla.cls === 'amber' ? 'var(--amber)' : 'var(--healthy)';
          return (
            <div className="t-row" key={c.id} onClick={() => onOpen(c.id)}>
              <div className="t-id">{c.id}</div>
              <div>
                <div className="t-subject">{c.subject}</div>
                <div className="t-sub">{c.codename} &middot; {c.threat} threat &middot; {typeOf(c.type).label} &middot; {c.bu} &middot; Step {c.step} of 3</div>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{c.branch}</div>
              <div><StatusPill status={c.status} /></div>
              <div className="t-sla" style={{ color }}>{sla.text}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
