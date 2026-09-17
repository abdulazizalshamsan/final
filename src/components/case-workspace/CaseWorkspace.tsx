'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { caseStore } from '@/state/caseStore';
import { missionSession } from '@/state/missionWeather';
import { useCaseStoreVersion } from '@/state/hooks';
import { CHECKERS, TEAMS } from '@/state/types';
import styles from '@/components/mission/Panels.module.css';

const MAX_TASKS = 5;

function cx(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function CaseWorkspace() {
  const router = useRouter();
  useCaseStoreVersion();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  // Derived purely for this render — the render body must stay a pure function of its
  // inputs, so the shared session pointer is only ever written from effects/handlers below.
  const deskCase = caseStore.cases.find((c) => c.id === missionSession.deskCaseId) ?? caseStore.cases[0];

  useEffect(() => {
    if (missionSession.latestSubmittedId && !caseStore.cases.some((c) => c.id === missionSession.latestSubmittedId)) {
      missionSession.setLatestSubmittedId(null);
    }
    missionSession.setDeskCaseId(deskCase.id);
  });

  const active = caseStore.cases.filter((c) => c.state !== 'completed');
  const taskCases = active.slice(0, MAX_TASKS);
  const latest = missionSession.latestSubmittedId
    ? caseStore.cases.find((c) => c.id === missionSession.latestSubmittedId)
    : null;
  if (latest && latest.state !== 'completed' && !taskCases.includes(latest)) taskCases.unshift(latest);

  function selectCase(id: string) {
    missionSession.setDeskCaseId(id);
    // Triggers this render (missionSession itself isn't a reactive store — deskCase is
    // recomputed from it on every render, so any state update here is enough to pick it up).
    setEvidenceOpen(false);
  }

  function followAircraft() {
    caseStore.select(deskCase.id);
    router.push('/mission-control/mission');
  }

  function sendToChecker() {
    caseStore.select(deskCase.id);
    caseStore.action('checker');
    router.push('/mission-control/mission');
  }

  function approve() {
    caseStore.select(deskCase.id);
    caseStore.action('complete');
    router.push('/mission-control/mission');
  }

  return (
    <section>
      <h2 className={styles.h2}>Work that shows its condition.</h2>
      <p className={styles.intro}>
        Select a case card to open its review desk. Actions affect the same aircraft and case record.
      </p>
      <div className={styles.two}>
        <div className={styles.tasks}>
          {taskCases.map((c) => {
            const statusText = c.breached
              ? '! BREACHED'
              : c.state === 'hold'
                ? 'Ⅱ Waiting on business'
                : c.state === 'checker'
                  ? '● Maker done · ○ Checker'
                  : '○ Maker review';
            return (
              <button
                key={c.id}
                type="button"
                className={cx(styles.task, c.id === deskCase.id && styles.taskActive)}
                onClick={() => selectCase(c.id)}
              >
                <strong>{c.id} · {TEAMS[c.team]}</strong>
                <div className={styles.taskMeta}>
                  <span>{c.owner} · {c.state}</span>
                  <span>{statusText}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.panel}>
          <h3 className={styles.h3}>{deskCase.id} · {TEAMS[deskCase.team]}</h3>
          <div className={styles.chip}>
            {deskCase.state}
            {deskCase.breached ? ' · SLA breached' : ''}
          </div>
          <div className={styles.spaced}>
            <h3 className={styles.h3}>Review summary</h3>
            <p>
              {deskCase.customer
                ? `${deskCase.customer}: ${deskCase.summary ?? ''}`
                : `Fictional ${TEAMS[deskCase.team].toLowerCase()} case assigned to ${deskCase.owner}. Review and record the recommendation before checker approval.`}
            </p>
            {deskCase.customer && (
              <button type="button" className={styles.button} onClick={() => setEvidenceOpen((v) => !v)}>
                Show supporting evidence
              </button>
            )}
            {evidenceOpen && deskCase.customer && (
              <div className={styles.evidence}>
                <strong>Demo document · Customer profile</strong>
                <div>
                  Noor Trading W.L.L. · Business activity: wholesale trading · Account purpose: supplier payments.
                </div>
                <div className={`${styles.small} ${styles.spaced}`}>
                  Illustrative source excerpt, not a real document or AI-verified finding.
                </div>
              </div>
            )}
          </div>
          <div className={styles.spaced}>
            <h3 className={styles.h3}>Four-eyes review</h3>
            <div>
              {deskCase.state === 'completed'
                ? '● Maker recommendation　 ● Checker approval'
                : deskCase.state === 'checker'
                  ? '● Maker recommendation　 ○ Checker approval'
                  : '○ Maker recommendation　 ○ Checker approval'}
            </div>
          </div>
          <div className={styles.actionrow}>
            <button type="button" className={styles.button} disabled={deskCase.state !== 'maker'} onClick={sendToChecker}>
              Send to checker
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              disabled={deskCase.state !== 'checker'}
              onClick={approve}
            >
              Approve & depart
            </button>
            <button type="button" className={styles.button} onClick={followAircraft}>
              Follow aircraft →
            </button>
          </div>
          <div className={styles.log}>
            Maker: {deskCase.owner} · Checker: {CHECKERS[deskCase.team]}
          </div>
        </div>
      </div>
    </section>
  );
}
