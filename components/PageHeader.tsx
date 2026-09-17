'use client';

import { CLEARANCES } from '@/lib/data';
import type { CaseRecord, ClearanceCode, ViewKey } from '@/lib/types';

const TITLES: Record<ViewKey, [string, string]> = {
  dashboard: ['Situation room', 'Bank-wide financial crime posture · watch B'],
  queue: ['Watch floor', 'Case queue · maker–checker–authority workflow'],
  reporting: ['Intelligence reporting', 'Source performance, SLA adherence and regulatory extracts'],
  case: ['Case file', ''],
  'file-referral': ['File a referral', 'Route a concern to the Financial Intelligence Unit'],
  'my-referrals': ['My referrals', 'Referrals filed from Manama branch'],
  'referral-tracking': ['Referral tracking', ''],
};

export default function PageHeader({
  clearance,
  view,
  activeCase,
  onExportOrRequest,
}: {
  clearance: ClearanceCode;
  view: ViewKey;
  activeCase: CaseRecord | null;
  onExportOrRequest: () => void;
}) {
  const u = CLEARANCES[clearance];
  const [defaultTitle, defaultSub] = TITLES[view];
  const title = view === 'case' && activeCase ? activeCase.subject : defaultTitle;
  const sub = view === 'case' && activeCase ? `${activeCase.id} · ${activeCase.codename}` : defaultSub;

  return (
    <>
      <div className="classification-strip">
        <div className="left">Restricted // NBB-FIU // need to know</div>
        <div className="right">Handling: FININT &middot; no subject disclosure</div>
      </div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <div className="sub">{sub}</div>
        </div>
        <div className="header-right">
          <div className="watch-chip">
            <span className="watch-dot" />
            <span>
              WATCH 11:20 GST &middot; {u.label}
            </span>
          </div>
          <button type="button" className={`btn ${u.fiu ? 'btn-dark' : 'btn-red'}`} onClick={onExportOrRequest}>
            {u.fiu ? 'Release intelligence pack' : 'Raise a request'}
          </button>
        </div>
      </div>
    </>
  );
}
