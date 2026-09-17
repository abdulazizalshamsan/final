'use client';

import { typeOf } from '@/lib/data';
import { myReferralCases, slaTone } from '@/lib/helpers';
import type { CaseRecord } from '@/lib/types';
import { StatusPill } from './Pill';

export default function MyReferrals({ cases, onOpen }: { cases: CaseRecord[]; onOpen: (id: string) => void }) {
  const list = myReferralCases(cases);

  return (
    <>
      <div className="table">
        <div className="t-head"><div>Reference</div><div>Request</div><div>Status</div><div>Progress</div><div style={{ textAlign: 'right' }}>FC response</div></div>
        {list.map(c => {
          const sla = slaTone(c.remainH);
          const color = sla.cls === 'red' ? 'var(--critical)' : sla.cls === 'amber' ? 'var(--amber)' : 'var(--healthy)';
          const stepText = ['Step 1 of 5', 'Step 2 of 5', 'Step 3 of 5', 'Step 4 of 5', 'Step 5 of 5'][Math.min(c.step + 1, 4)] || 'Step 1 of 5';
          return (
            <div className="t-row" key={c.id} onClick={() => onOpen(c.id)}>
              <div className="t-id">{c.id}</div>
              <div><div className="t-subject">{typeOf(c.type).label}</div><div className="t-sub">{c.subject}</div></div>
              <div><StatusPill status={c.status} /></div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{stepText}</div>
              <div className="t-sla" style={{ color }}>{sla.text}</div>
            </div>
          );
        })}
      </div>
      <div className="caption" style={{ marginTop: 14 }}>
        Assessment detail and internal clearance notes stay inside the unit.
      </div>
    </>
  );
}
