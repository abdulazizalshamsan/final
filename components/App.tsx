'use client';

import { useMemo, useRef, useState } from 'react';
import { AUTHORITY_DISPOSITIONS, CLEARANCES, NOW, createInitialCases, typeOf } from '@/lib/data';
import type { CaseRecord, ClearanceCode, DashboardMode, ReferralDraft, Submission, ViewKey } from '@/lib/types';
import { mkAudit } from '@/lib/data';
import Sidebar from './Sidebar';
import PageHeader from './PageHeader';
import Dashboard from './Dashboard';
import Queue from './Queue';
import CaseFile, { CaseTab } from './CaseFile';
import Reporting from './Reporting';
import FileReferral from './FileReferral';
import MyReferrals from './MyReferrals';
import ReferralTracking from './ReferralTracking';
import Toast from './Toast';

const EMPTY_DRAFT: ReferralDraft = { type: null, subject: '', account: '', amount: '', urgency: 'Routine', narrative: '', needs: '' };

export default function App() {
  const [clearance, setClearance] = useState<ClearanceCode>('C2');
  const [view, setView] = useState<ViewKey>('dashboard');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [caseTab, setCaseTab] = useState<CaseTab>('assessment');
  const [queueFilter, setQueueFilter] = useState('all');
  const [queueSearch, setQueueSearch] = useState('');
  const [returnReasonPicked, setReturnReasonPicked] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>(() => createInitialCases());
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>('data');
  const [focusCaseId, setFocusCaseId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReferralDraft>(EMPTY_DRAFT);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser = () => CLEARANCES[clearance];

  function toast(msg: string) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }

  function go(v: ViewKey, caseId?: string) {
    setView(v);
    if (caseId) {
      setActiveCaseId(caseId);
      setCaseTab('assessment');
    }
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }

  function handleNav(v: ViewKey) {
    go(v);
  }

  function handleClearance(c: ClearanceCode) {
    setClearance(c);
    setView(c === 'C1' ? 'file-referral' : 'dashboard');
  }

  function updateCase(id: string, updater: (c: CaseRecord) => CaseRecord) {
    setCases(prev => prev.map(c => (c.id === id ? updater(c) : c)));
  }

  const activeCase = useMemo(() => cases.find(c => c.id === activeCaseId) || null, [cases, activeCaseId]);

  function assignMe() {
    if (!activeCase) return;
    const who = currentUser().who;
    updateCase(activeCase.id, c => ({
      ...c,
      status: 'Assessment',
      step: 1,
      assignedOfficer: who,
      audit: [...c.audit, mkAudit('Assigned to case officer', who, 'C-2 Case officer', 'Picked up from the unassigned pool.', 0, 'grey')],
    }));
  }

  function saveDraft(values: Submission) {
    if (!activeCase) return;
    updateCase(activeCase.id, c => ({ ...c, submission: values }));
    toast('Draft saved.');
  }

  function submitReview(values: Submission) {
    if (!activeCase) return;
    if (values.assessment.trim().length < 30) {
      toast('Assessment is too thin to submit — add more observed detail (minimum ~30 characters) before sending it for review.');
      return;
    }
    updateCase(activeCase.id, c => {
      const nextVersion = c.firstSubmit ? (c.version || 1) + 1 : 1;
      return {
        ...c,
        submission: values,
        status: 'Review',
        step: 2,
        version: nextVersion,
        firstSubmit: true,
        reworkReason: null,
        audit: [
          ...c.audit,
          mkAudit(nextVersion > 1 ? `Submitted for review (v${nextVersion})` : 'Submitted for review', currentUser().who, 'C-2 Case officer', '', 0, 'green'),
        ],
      };
    });
  }

  function approve(comment: string) {
    if (!activeCase) return;
    const sub = activeCase.submission;
    const requiresAuthority = !!sub && (typeOf(activeCase.type).authority || AUTHORITY_DISPOSITIONS.includes(sub.disposition));
    updateCase(activeCase.id, c => {
      if (requiresAuthority) {
        return {
          ...c,
          reviewComment: comment,
          status: 'Authority',
          step: 3,
          audit: [...c.audit, mkAudit('Approved — escalated to authority', currentUser().who, 'C-3 Reviewing officer', comment || 'Escalated for Head of FIU authorisation given disposition.', 0, 'green')],
        };
      }
      return {
        ...c,
        reviewComment: comment,
        status: 'Cleared',
        step: 3,
        outcome: `${c.submission?.disposition}. ${c.submission?.action}`,
        audit: [...c.audit, mkAudit('Approved — case closed', currentUser().who, 'C-3 Reviewing officer', comment || '', 0, 'green')],
      };
    });
  }

  function authorise(comment: string) {
    if (!activeCase) return;
    updateCase(activeCase.id, c => ({
      ...c,
      status: 'Cleared',
      outcome: `${c.submission?.disposition}. ${c.submission?.action}`,
      audit: [...c.audit, mkAudit('Authorised — case closed', currentUser().who, 'C-4 Authorising officer', comment || '', 0, 'green')],
    }));
  }

  function returnCase(comment: string, reason: string) {
    if (!activeCase) return;
    if (!comment.trim() || !reason) {
      toast('A return reason and a comment are both required before returning a case to the officer.');
      return;
    }
    const roleLabel = clearance === 'C4' ? 'C-4 Authorising officer' : 'C-3 Reviewing officer';
    updateCase(activeCase.id, c => ({
      ...c,
      status: 'Returned',
      step: 1,
      reworkReason: reason,
      reviewComment: comment,
      audit: [...c.audit, mkAudit('Returned to officer', currentUser().who, roleLabel, comment, 0, 'red')],
    }));
    setReturnReasonPicked(null);
  }

  function reject(comment: string) {
    if (!activeCase) return;
    if (!comment.trim()) {
      toast('A comment is required to reject a case.');
      return;
    }
    updateCase(activeCase.id, c => ({
      ...c,
      status: 'Rejected',
      outcome: `Rejected. ${comment}`,
      audit: [...c.audit, mkAudit('Rejected', currentUser().who, 'C-4 Authorising officer', comment, 0, 'red')],
    }));
  }

  // The Airport Situation Room acts on any case by id (not just the open case file), so these
  // mirror submitReview/approve/authorise but read the case's already-saved submission draft.
  function quickSubmitToChecker(id: string) {
    const c = cases.find(x => x.id === id);
    if (!c || !c.submission || c.submission.assessment.trim().length < 30) return;
    const nextVersion = c.firstSubmit ? (c.version || 1) + 1 : 1;
    updateCase(id, cc => ({
      ...cc,
      status: 'Review',
      step: 2,
      version: nextVersion,
      firstSubmit: true,
      reworkReason: null,
      audit: [...cc.audit, mkAudit(nextVersion > 1 ? `Submitted for review (v${nextVersion})` : 'Submitted for review', currentUser().who, 'C-2 Case officer', '', 0, 'green')],
    }));
  }

  function quickApprove(id: string) {
    const c = cases.find(x => x.id === id);
    if (!c) return;
    const requiresAuthority = !!c.submission && (typeOf(c.type).authority || AUTHORITY_DISPOSITIONS.includes(c.submission.disposition));
    updateCase(id, cc => {
      if (requiresAuthority) {
        return {
          ...cc,
          status: 'Authority',
          step: 3,
          audit: [...cc.audit, mkAudit('Approved — escalated to authority', currentUser().who, 'C-3 Reviewing officer', 'Escalated for Head of FIU authorisation given disposition.', 0, 'green')],
        };
      }
      return {
        ...cc,
        status: 'Cleared',
        step: 3,
        outcome: `${cc.submission?.disposition}. ${cc.submission?.action}`,
        audit: [...cc.audit, mkAudit('Approved — case closed', currentUser().who, 'C-3 Reviewing officer', '', 0, 'green')],
      };
    });
  }

  function quickAuthorise(id: string) {
    updateCase(id, cc => ({
      ...cc,
      status: 'Cleared',
      outcome: `${cc.submission?.disposition}. ${cc.submission?.action}`,
      audit: [...cc.audit, mkAudit('Authorised — case closed', currentUser().who, 'C-4 Authorising officer', '', 0, 'green')],
    }));
  }

  function holdForInfo(id: string) {
    updateCase(id, cc => ({
      ...cc,
      awaitingInfo: true,
      audit: [...cc.audit, mkAudit('Awaiting information', currentUser().who, currentUser().label, 'Parked pending information from the business; the SLA clock continues to run.', 0, 'grey')],
    }));
  }

  function resumeReview(id: string) {
    updateCase(id, cc => ({
      ...cc,
      awaitingInfo: false,
      audit: [...cc.audit, mkAudit('Information received — review resumed', currentUser().who, currentUser().label, '', 0, 'grey')],
    }));
  }

  function returnToPool(id: string) {
    updateCase(id, cc => ({
      ...cc,
      status: 'Unassigned',
      step: 0,
      assignedOfficer: null,
      audit: [...cc.audit, mkAudit('Returned to the unassigned pool', currentUser().who, currentUser().label, 'Eligible for pickup by another case officer; SLA clock unaffected.', 0, 'grey')],
    }));
  }

  function followAircraft(id: string) {
    setDashboardMode('airport');
    setFocusCaseId(id);
    go('dashboard');
  }

  function submitReferral() {
    if (!draft.type) {
      toast('Choose a referral type before submitting.');
      return;
    }
    if (draft.narrative.trim().length < 40) {
      toast('Add more detail on what you observed — minimum 40 characters — before submitting.');
      return;
    }
    const t = typeOf(draft.type);
    const n = cases.length + 1;
    const id = `CASE-2026-0${700 + n}`;
    const codenames = ['GLASS BAY', 'SOUTH REEF', 'LOW TIDE', 'GREY HARBOUR'];
    const intake = new Date(NOW);
    const dueAt = new Date(intake.getTime() + t.slaHours * 3600 * 1000);
    const newCase: CaseRecord = {
      id,
      codename: `OP. ${codenames[n % codenames.length]}`,
      subject: draft.subject || 'Field referral — subject pending triage',
      type: draft.type,
      threat: draft.urgency === 'Immediate' ? 'High' : draft.urgency === 'Urgent' ? 'Medium' : 'Low',
      bu: 'Retail Banking',
      branch: 'Manama branch',
      raisedBy: 'H. Al Suwaidi · Manama branch',
      intake,
      assignedOfficer: null,
      status: 'Unassigned',
      step: 0,
      version: 0,
      exposure: [['Account', draft.account || '—'], ['Amount involved', draft.amount || '—'], ['Urgency', draft.urgency]],
      evidence: [],
      submission: null,
      audit: [mkAudit('Referral received', 'System', '—', 'Auto-created from branch referral filed by H. Al Suwaidi.', 0, 'grey')],
      dueAt,
      remainH: (dueAt.getTime() - NOW.getTime()) / 3600000,
    };
    setCases(prev => [newCase, ...prev]);
    setDraft(EMPTY_DRAFT);
    toast(`Referral submitted — reference ${id}`);
    go('referral-tracking', id);
  }

  function headerCta() {
    if (currentUser().fiu) go('reporting');
    else go('file-referral');
  }

  return (
    <div className="app">
      <Sidebar clearance={clearance} view={view} onNav={handleNav} onClearance={handleClearance} />
      <main className="main">
        <PageHeader clearance={clearance} view={view} activeCase={activeCase} onExportOrRequest={headerCta} />
        <div className="view">
          {view === 'dashboard' && (
            <Dashboard
              clearance={clearance}
              cases={cases}
              onOpen={id => go('case', id)}
              onNav={handleNav}
              dashboardMode={dashboardMode}
              setDashboardMode={setDashboardMode}
              focusCaseId={focusCaseId}
              onQuickSubmitToChecker={quickSubmitToChecker}
              onQuickApprove={quickApprove}
              onQuickAuthorise={quickAuthorise}
              onHoldForInfo={holdForInfo}
              onResumeReview={resumeReview}
              onReturnToPool={returnToPool}
            />
          )}
          {view === 'queue' && (
            <Queue
              cases={cases}
              clearance={clearance}
              queueFilter={queueFilter}
              setQueueFilter={setQueueFilter}
              queueSearch={queueSearch}
              setQueueSearch={setQueueSearch}
              onOpen={id => go('case', id)}
            />
          )}
          {view === 'case' && activeCase && (
            <CaseFile
              c={activeCase}
              clearance={clearance}
              caseTab={caseTab}
              setCaseTab={t => { setCaseTab(t); setReturnReasonPicked(null); }}
              onBack={() => go('queue')}
              returnReasonPicked={returnReasonPicked}
              setReturnReasonPicked={setReturnReasonPicked}
              onAssignMe={assignMe}
              onSaveDraft={saveDraft}
              onSubmitReview={submitReview}
              onApprove={approve}
              onAuthorise={authorise}
              onReturn={returnCase}
              onReject={reject}
              onFollowAircraft={() => followAircraft(activeCase.id)}
            />
          )}
          {view === 'reporting' && <Reporting />}
          {view === 'file-referral' && <FileReferral draft={draft} setDraft={updater => setDraft(updater)} onSubmit={submitReferral} />}
          {view === 'my-referrals' && <MyReferrals cases={cases} onOpen={id => go('referral-tracking', id)} />}
          {view === 'referral-tracking' && (
            <ReferralTracking cases={cases} activeCaseId={activeCaseId} setActiveCaseId={id => setActiveCaseId(id)} />
          )}
        </div>
      </main>
      <Toast message={toastMsg} />
    </div>
  );
}
