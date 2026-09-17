import type {
  Clearance,
  ClearanceCode,
  CaseTypeDef,
  CaseRecord,
  AuditEntry,
  AuditTone,
} from './types';

export const NOW = new Date('2026-09-15T11:20:00');

export const CLEARANCES: Record<ClearanceCode, Clearance> = {
  C1: { code: 'C1', label: 'C-1 Field source', who: 'H. Al Suwaidi', role: 'Manama branch', fiu: false },
  C2: { code: 'C2', label: 'C-2 Case officer', who: 'R. Menon', role: 'FIU analyst', fiu: true },
  C3: { code: 'C3', label: 'C-3 Reviewing officer', who: 'S. Fernandes', role: 'Unit lead', fiu: true },
  C4: { code: 'C4', label: 'C-4 Authorising officer', who: 'A. Belhoul', role: 'Head of FIU', fiu: true },
};

export const TYPES: CaseTypeDef[] = [
  {
    key: 'sanctions', label: 'Sanctions / PEP match', desk: 'Sanctions & PEP', slaHours: 4, authority: true,
    guidance: 'Sanctions and PEP matches route directly to the Sanctions & PEP desk on a 4-hour response window. Do not contact the customer or branch pending screening confirmation.',
  },
  {
    key: 'freeze', label: 'Freeze order request', desk: 'Sanctions & PEP', slaHours: 4, authority: true,
    guidance: 'Freeze requests are treated as sanctions-tier urgency. The account is flagged for hold pending FIU authorisation — a 4-hour response window applies.',
  },
  {
    key: 'aml', label: 'AML — unusual transaction pattern', desk: 'AML & monitoring', slaHours: 24, authority: false,
    guidance: 'Unusual transaction patterns route to AML & monitoring on a 24-hour response window. Attach the transaction extract if you have one.',
  },
  {
    key: 'fraud', label: 'Fraud referral', desk: 'Fraud', slaHours: 24, authority: false,
    guidance: 'Fraud referrals route to the Fraud desk on a 24-hour response window. Include the customer contact you already made, if any.',
  },
  {
    key: 'cash', label: 'Suspicious cash structuring', desk: 'AML & monitoring', slaHours: 24, authority: false,
    guidance: 'Cash structuring concerns route to AML & monitoring on a 24-hour response window. Note the pattern of deposits you observed.',
  },
  {
    key: 'trade', label: 'Trade finance red flag', desk: 'AML & monitoring', slaHours: 48, authority: true,
    guidance: 'Trade finance red flags route to AML & monitoring on a 48-hour response window and may require Head of FIU authorisation given typical exposure size.',
  },
  {
    key: 'kyc', label: 'KYC / risk rating concern', desk: 'KYC & ratings', slaHours: 72, authority: false,
    guidance: 'KYC and risk rating concerns route to KYC & ratings on a 72-hour response window.',
  },
  {
    key: 'rfi', label: 'Regulator / legal RFI', desk: 'KYC & ratings', slaHours: 48, authority: false,
    guidance: 'Regulator and legal requests for information route to KYC & ratings on a 48-hour response window given external deadlines.',
  },
];

export function typeOf(key: string): CaseTypeDef {
  return TYPES.find(t => t.key === key)!;
}

export const DISPOSITIONS = [
  'No further action — risk accepted',
  'Enhanced monitoring only',
  'Revise customer risk rating',
  'File SAR/STR with CBB FIU',
  'Freeze account pending investigation',
  'Escalate to law enforcement liaison',
];

export const AUTHORITY_DISPOSITIONS = [
  'File SAR/STR with CBB FIU',
  'Freeze account pending investigation',
  'Escalate to law enforcement liaison',
];

export const RETURN_REASONS = [
  'Insufficient evidence',
  'Screening not re-run within 24h',
  'Narrative quality / clarity',
  'Missing customer risk justification',
  'Incomplete evidence attachments',
  'Disposition inconsistent with findings',
];

export function hoursAgo(h: number): Date {
  return new Date(NOW.getTime() - h * 3600 * 1000);
}

export function mkAudit(action: string, actor: string, role: string, note: string, hAgo: number, tone: AuditTone): AuditEntry {
  return { action, actor, role, note: note || '', ts: hoursAgo(hAgo), tone };
}

type SeedCase = Omit<CaseRecord, 'dueAt' | 'remainH'>;

function seed(): SeedCase[] {
  return [
    {
      id: 'CASE-2026-0731', codename: 'OP. HARBOUR LIGHT', subject: 'F. Al Zahrani — private banking relationship',
      type: 'sanctions', threat: 'High', bu: 'Private Banking', branch: 'Seef district',
      raisedBy: 'F. Haddad · Private Banking, Seef', intake: hoursAgo(52), assignedOfficer: 'R. Menon',
      status: 'Authority', step: 3, version: 2, firstSubmit: true,
      exposure: [['Linked accounts', '4'], ['Cross-border transfers (90d)', 'BHD 214,500'], ['Screening matches', '2 partial']],
      evidence: [{ name: 'screening-hit-report.pdf', ext: 'PDF', size: '1.2 MB' }, { name: 'kyc-file-extract.pdf', ext: 'PDF', size: '640 KB' }],
      submission: {
        assessment: 'Customer name partially matches a sanctioned-entity alias flagged by the screening engine on the last periodic re-screen. Relationship holds BHD 214,500 in linked balances across four accounts opened 2019–2023. No transaction activity has been blocked to date. Screening was re-run manually against the OFAC and UN consolidated lists within the last 24 hours; the match remains partial (name plus date-of-birth proximity, no address match).',
        disposition: 'File SAR/STR with CBB FIU', revisedRisk: 'High',
        action: 'Hold any outbound international transfer instructions pending FIU clearance; do not disclose the review to the customer.',
      },
      audit: [
        mkAudit('Referral received', 'System', '—', 'Auto-created from branch referral filed by F. Haddad.', 52, 'grey'),
        mkAudit('Assigned to case officer', 'System', '—', 'Auto-assigned to R. Menon under the sanctions rota.', 50, 'grey'),
        mkAudit('Submitted for review', 'R. Menon', 'C-2 Case officer', '', 30, 'green'),
        mkAudit('Returned to officer', 'S. Fernandes', 'C-3 Reviewing officer', 'Screening evidence attached was the automated hit only — please re-run manual screening and attach the confirmation before resubmission.', 26, 'red'),
        mkAudit('Submitted for review (v2)', 'R. Menon', 'C-2 Case officer', 'Manual re-screen attached.', 9, 'green'),
        mkAudit('Approved — escalated to authority', 'S. Fernandes', 'C-3 Reviewing officer', 'Disposition of SAR/STR filing requires Head of FIU sign-off under the sanctions escalation rule.', 5, 'green'),
      ],
      reviewComment: 'Manual re-screen confirms a partial match only; recommend filing given the sanctions-tier nature of the hit, but this needs your authorisation before we notify CBB FIU.',
    },
    {
      id: 'CASE-2026-0729', codename: 'OP. PEARL DIVER', subject: 'Retail customer — structured deposit pattern',
      type: 'aml', threat: 'Medium', bu: 'Retail Banking', branch: 'Manama Souq',
      raisedBy: 'H. Al Suwaidi · Manama branch', intake: hoursAgo(30), assignedOfficer: 'R. Menon',
      status: 'Review', step: 2, version: 1, firstSubmit: true,
      exposure: [['Linked accounts', '2'], ['Deposits flagged (30d)', 'BHD 38,200'], ['Related alerts', '3']],
      evidence: [{ name: 'txn-extract-30d.xlsx', ext: 'XLS', size: '88 KB' }, { name: 'teller-note.pdf', ext: 'PDF', size: '110 KB' }],
      submission: {
        assessment: 'Nine cash deposits over the last three weeks, each between BHD 3,800–3,950, consistently below the BHD 4,000 CTR-adjacent internal threshold. Deposits are made across two branches by the account holder in person. No plausible business rationale on file for a retail salaried customer profile.',
        disposition: 'Enhanced monitoring only', revisedRisk: 'Medium',
        action: 'Place the account on 90-day enhanced transaction monitoring; no customer contact at this stage.',
      },
      audit: [
        mkAudit('Referral received', 'System', '—', 'Field referral filed by H. Al Suwaidi, Manama branch.', 30, 'grey'),
        mkAudit('Assigned to case officer', 'System', '—', 'Auto-assigned to R. Menon.', 29, 'grey'),
        mkAudit('Submitted for review', 'R. Menon', 'C-2 Case officer', '', 3, 'green'),
      ],
    },
    {
      id: 'CASE-2026-0725', codename: 'OP. NIGHT FERRY', subject: 'Card dispute cluster — possible collusion',
      type: 'fraud', threat: 'Medium', bu: 'Cards & Payments', branch: 'Cards Operations',
      raisedBy: 'Cards Operations desk', intake: hoursAgo(14), assignedOfficer: 'R. Menon',
      status: 'Assessment', step: 1, version: 0,
      exposure: [['Disputed transactions', '11'], ['Value at risk', 'BHD 6,140'], ['Common merchant terminals', '2']],
      evidence: [{ name: 'dispute-log.csv', ext: 'CSV', size: '44 KB' }],
      submission: null,
      audit: [
        mkAudit('Referral received', 'System', '—', 'Auto-created from Cards Operations referral.', 14, 'grey'),
        mkAudit('Assigned to case officer', 'R. Menon', 'C-2 Case officer', 'Picked up from the unassigned pool.', 3, 'grey'),
      ],
    },
    {
      id: 'CASE-2026-0722', codename: 'OP. SILENT ATOLL', subject: 'LC discrepancy — over-invoicing pattern',
      type: 'trade', threat: 'High', bu: 'Wholesale Banking', branch: 'Trade Finance Centre',
      raisedBy: 'Trade Finance Centre', intake: hoursAgo(210), assignedOfficer: 'R. Menon',
      status: 'Cleared', step: 3, version: 1, firstSubmit: true,
      exposure: [['LC value', 'BHD 1,180,000'], ['Related counterparties', '3'], ['Prior alerts (12mo)', '1']],
      evidence: [{ name: 'lc-documents.pdf', ext: 'PDF', size: '3.1 MB' }, { name: 'invoice-comparison.xlsx', ext: 'XLS', size: '210 KB' }],
      submission: {
        assessment: 'Invoice values on the underlying goods are approximately 22% above comparable market pricing for the same commodity class and origin, consistent with a trade-based value transfer pattern. Counterparty has an established five-year relationship with no prior adverse findings, and the discrepancy falls within a range explainable by freight and insurance terms once verified with the shipping documents.',
        disposition: 'No further action — risk accepted', revisedRisk: 'Medium',
        action: 'No branch action required; annotate the file for review at next periodic KYC refresh.',
      },
      audit: [
        mkAudit('Referral received', 'System', '—', '', 210, 'grey'),
        mkAudit('Assigned to case officer', 'System', '—', '', 208, 'grey'),
        mkAudit('Submitted for review', 'R. Menon', 'C-2 Case officer', '', 196, 'green'),
        mkAudit('Approved — case closed', 'S. Fernandes', 'C-3 Reviewing officer', 'Explanation is documented and consistent with shipping terms; no escalation required.', 188, 'green'),
      ],
      outcome: 'No further action. Explanation on invoicing differential accepted and documented; flagged for review at the next periodic KYC refresh.',
    },
    {
      id: 'CASE-2026-0718', codename: 'OP. AMBER TIDE', subject: 'Retail customer — round-figure cash structuring',
      type: 'cash', threat: 'Medium', bu: 'Retail Banking', branch: 'Muharraq',
      raisedBy: 'H. Al Suwaidi · Manama branch', intake: hoursAgo(70), assignedOfficer: 'R. Menon',
      status: 'Returned', step: 1, version: 1, firstSubmit: true,
      exposure: [['Deposits flagged (30d)', 'BHD 19,500'], ['Branches used', '2'], ['Related alerts', '1']],
      evidence: [{ name: 'teller-note.pdf', ext: 'PDF', size: '95 KB' }],
      submission: {
        assessment: 'Customer made five deposits of BHD 3,900 across two branches within nine days.',
        disposition: 'No further action — risk accepted', revisedRisk: 'Low', action: 'None.',
      },
      audit: [
        mkAudit('Referral received', 'System', '—', '', 70, 'grey'),
        mkAudit('Assigned to case officer', 'System', '—', '', 68, 'grey'),
        mkAudit('Submitted for review', 'R. Menon', 'C-2 Case officer', '', 50, 'green'),
        mkAudit('Returned to officer', 'S. Fernandes', 'C-3 Reviewing officer', 'Assessment does not address why round-figure deposits sit just below the internal threshold across two branches — this needs a proper structuring analysis, not a risk-accepted disposition without reasoning.', 46, 'red'),
      ],
      reworkReason: 'Disposition inconsistent with findings',
    },
    {
      id: 'CASE-2026-0715', codename: 'OP. COPPER REEF', subject: 'Corporate customer — periodic KYC risk flag',
      type: 'kyc', threat: 'Low', bu: 'Retail Banking', branch: 'Sitra Industrial',
      raisedBy: 'Sitra Industrial branch', intake: hoursAgo(6), assignedOfficer: null,
      status: 'Unassigned', step: 0, version: 0,
      exposure: [['Account tenure', '6 years'], ['Turnover (12mo)', 'BHD 402,000'], ['Beneficial owners', '2']],
      evidence: [{ name: 'company-extract.pdf', ext: 'PDF', size: '320 KB' }],
      submission: null,
      audit: [mkAudit('Referral received', 'System', '—', 'Auto-created from Sitra Industrial branch referral.', 6, 'grey')],
    },
    {
      id: 'CASE-2026-0712', codename: 'OP. QUIET SOUQ', subject: 'CBB information request — corporate facility',
      type: 'rfi', threat: 'Medium', bu: 'Legal & regulator RFIs', branch: 'Corporate Banking Desk 2',
      raisedBy: 'Legal & Compliance', intake: hoursAgo(96), assignedOfficer: 'R. Menon',
      status: 'Review', step: 2, version: 1, firstSubmit: true,
      exposure: [['Facility value', 'BHD 860,000'], ['Related entities', '4'], ['Prior RFIs (24mo)', '2']],
      evidence: [{ name: 'cbb-rfi-letter.pdf', ext: 'PDF', size: '450 KB' }, { name: 'facility-summary.xlsx', ext: 'XLS', size: '75 KB' }],
      submission: {
        assessment: 'CBB has requested account activity and beneficial ownership detail on a corporate facility in connection with an external inquiry. Facility has been active for three years with no adverse internal findings; ownership structure matches the KYC file on record with no undisclosed layers identified.',
        disposition: 'No further action — risk accepted', revisedRisk: 'Medium',
        action: 'Compile response pack for CBB within the regulatory deadline; no customer contact.',
      },
      audit: [
        mkAudit('Referral received', 'System', '—', '', 96, 'grey'),
        mkAudit('Assigned to case officer', 'System', '—', '', 94, 'grey'),
        mkAudit('Submitted for review', 'R. Menon', 'C-2 Case officer', '', 50, 'green'),
      ],
    },
    {
      id: 'CASE-2026-0708', codename: 'OP. FALCON BAY', subject: 'Corporate account — sanctioned-vessel counterparty',
      type: 'freeze', threat: 'High', bu: 'Wholesale Banking', branch: 'Riffa',
      raisedBy: 'Wholesale Banking, Riffa', intake: hoursAgo(340), assignedOfficer: 'R. Menon',
      status: 'Rejected', step: 3, version: 1, firstSubmit: true,
      exposure: [['Facility value', 'BHD 2,050,000'], ['Counterparty vessels flagged', '1'], ['Related alerts', '2']],
      evidence: [{ name: 'vessel-screening.pdf', ext: 'PDF', size: '880 KB' }],
      submission: {
        assessment: 'Payment instruction referenced a vessel appearing on a maritime sanctions watchlist maintained by a third-party screening provider not currently integrated with our primary screening engine. No match on our primary sanctions list.',
        disposition: 'Freeze account pending investigation', revisedRisk: 'High',
        action: 'Freeze outbound payment instructions on the facility pending investigation.',
      },
      audit: [
        mkAudit('Referral received', 'System', '—', '', 340, 'grey'),
        mkAudit('Assigned to case officer', 'System', '—', '', 338, 'grey'),
        mkAudit('Submitted for review', 'R. Menon', 'C-2 Case officer', '', 320, 'green'),
        mkAudit('Approved — escalated to authority', 'S. Fernandes', 'C-3 Reviewing officer', 'Freeze disposition requires Head of FIU authorisation.', 300, 'green'),
        mkAudit('Rejected', 'A. Belhoul', 'C-4 Authorising officer', 'Watchlist source is not one of our approved screening providers and the match is unverified against primary lists — reject the freeze recommendation and refer back to Sanctions & PEP for verification through an approved source before any hold is placed.', 288, 'red'),
      ],
      outcome: 'Rejected. Recommendation was based on an unapproved third-party watchlist; referred back to Sanctions & PEP for verification through an approved screening source.',
    },
    {
      id: 'CASE-2026-0704', codename: 'OP. RED DHOW', subject: 'Card-not-present fraud ring — merchant cluster',
      type: 'fraud', threat: 'Low', bu: 'Cards & Payments', branch: 'Cards Operations',
      raisedBy: 'H. Al Suwaidi · Manama branch', intake: hoursAgo(260), assignedOfficer: 'R. Menon',
      status: 'Cleared', step: 3, version: 1, firstSubmit: true,
      exposure: [['Disputed transactions', '6'], ['Value at risk', 'BHD 1,240'], ['Common merchant terminals', '1']],
      evidence: [{ name: 'dispute-log.csv', ext: 'CSV', size: '21 KB' }],
      submission: {
        assessment: 'Six low-value card-not-present disputes traced to a single merchant terminal already flagged and suspended by the acquirer three days prior. No further exposure on this customer relationship.',
        disposition: 'No further action — risk accepted', revisedRisk: 'Low',
        action: 'None; merchant terminal already suspended by acquirer.',
      },
      audit: [
        mkAudit('Referral received', 'System', '—', '', 260, 'grey'),
        mkAudit('Assigned to case officer', 'System', '—', '', 258, 'grey'),
        mkAudit('Submitted for review', 'R. Menon', 'C-2 Case officer', '', 230, 'green'),
        mkAudit('Approved — case closed', 'S. Fernandes', 'C-3 Reviewing officer', 'Merchant terminal already suspended by acquirer; no further action needed.', 224, 'green'),
      ],
      outcome: 'No further action. Merchant terminal responsible for the disputes was already suspended by the acquirer; no residual exposure on this customer.',
    },
    {
      id: 'CASE-2026-0701', codename: 'OP. SEA GLASS', subject: 'Private banking — inbound wire from high-risk corridor',
      type: 'aml', threat: 'High', bu: 'Private Banking', branch: 'Manama Souq',
      raisedBy: 'Private Banking, Manama Souq', intake: hoursAgo(3), assignedOfficer: 'R. Menon',
      status: 'Assessment', step: 1, version: 0,
      exposure: [['Inbound wire value', 'BHD 96,000'], ['Origin corridor risk', 'High'], ['Related alerts', '1']],
      evidence: [{ name: 'wire-details.pdf', ext: 'PDF', size: '180 KB' }],
      submission: null,
      audit: [
        mkAudit('Referral received', 'System', '—', '', 3, 'grey'),
        mkAudit('Assigned to case officer', 'R. Menon', 'C-2 Case officer', 'Picked up from the unassigned pool.', 1, 'grey'),
      ],
    },
  ];
}

export function createInitialCases(): CaseRecord[] {
  return seed().map(c => {
    const dueAt = new Date(c.intake.getTime() + typeOf(c.type).slaHours * 3600 * 1000);
    const remainH = (dueAt.getTime() - NOW.getTime()) / 3600000;
    return { ...c, dueAt, remainH };
  });
}
