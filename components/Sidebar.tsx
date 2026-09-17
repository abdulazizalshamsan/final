'use client';

import { useState } from 'react';
import { CLEARANCES } from '@/lib/data';
import type { ClearanceCode, ViewKey } from '@/lib/types';

const NAV_FIU: { key: ViewKey; label: string }[] = [
  { key: 'dashboard', label: 'Situation room' },
  { key: 'queue', label: 'Watch floor' },
  { key: 'reporting', label: 'Intelligence reporting' },
];
const NAV_C1: { key: ViewKey; label: string }[] = [
  { key: 'file-referral', label: 'File a referral' },
  { key: 'my-referrals', label: 'My referrals' },
  { key: 'referral-tracking', label: 'Referral tracking' },
];

export default function Sidebar({
  clearance,
  view,
  onNav,
  onClearance,
}: {
  clearance: ClearanceCode;
  view: ViewKey;
  onNav: (v: ViewKey) => void;
  onClearance: (c: ClearanceCode) => void;
}) {
  const nav = clearance === 'C1' ? NAV_C1 : NAV_FIU;
  const [logoOk, setLogoOk] = useState(true);

  return (
    <aside className="sidebar">
      <div>
        <div className="brand-lockup">
          {logoOk && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/assets/nbb-mark.png" alt="NBB" onError={() => setLogoOk(false)} />
          )}
          <div>
            <div className="brand-name">National Bank of Bahrain</div>
            <div className="brand-sub">Financial Intelligence Unit</div>
          </div>
        </div>
        <div className="brand-rule" style={{ marginTop: 14 }} />
      </div>

      <nav className="nav">
        <div className="nav-label">Workspace</div>
        {nav.map(n => (
          <button
            key={n.key}
            type="button"
            className={`nav-item ${view === n.key ? 'active' : ''}`}
            onClick={() => onNav(n.key)}
          >
            <span className="dot" />
            {n.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="clearance-box">
        <div className="clearance-box-label">Clearance</div>
        {Object.values(CLEARANCES).map(c => (
          <button
            key={c.code}
            type="button"
            className={`clearance-opt ${clearance === c.code ? 'active' : ''}`}
            onClick={() => onClearance(c.code)}
          >
            <div className="tag">{c.label}</div>
            <div className="who">
              {c.who} &middot; {c.role}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
