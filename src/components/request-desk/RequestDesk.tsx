'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { caseStore } from '@/state/caseStore';
import { missionSession } from '@/state/missionWeather';
import { SUBMITTING_DEPARTMENTS, TEAMS, type CaseRecord, type Team } from '@/state/types';
import styles from '@/components/mission/Panels.module.css';

export default function RequestDesk() {
  const router = useRouter();
  const [business, setBusiness] = useState(SUBMITTING_DEPARTMENTS[0]);
  const [category, setCategory] = useState(TEAMS[0]);
  const [customer, setCustomer] = useState('Noor Trading W.L.L. (demo)');
  const [summary, setSummary] = useState(
    'Review the attached onboarding information and advise whether additional checks are required.',
  );
  const [latest, setLatest] = useState<CaseRecord | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const team = TEAMS.indexOf(category) as Team;
    const issued = caseStore.submit({ team, customer, business, summary });
    missionSession.setLatestSubmittedId(issued.id);
    missionSession.setDeskCaseId(issued.id);
    setLatest(issued);
  }

  function watchAllocation() {
    if (!latest) return;
    caseStore.select(latest.id);
    router.push('/mission-control/mission');
    caseStore.allocate(latest.id);
  }

  return (
    <section>
      <h2 className={styles.h2}>A request becomes a journey.</h2>
      <p className={styles.intro}>
        Submit the fictional request and watch it become a trackable NBB boarding pass.
      </p>
      <div className={styles.two}>
        <form className={styles.panel} onSubmit={handleSubmit}>
          <h3 className={styles.h3}>New financial crime request</h3>
          <div className={styles.fields}>
            <label>
              Business line
              <select value={business} onChange={(e) => setBusiness(e.target.value)}>
                {SUBMITTING_DEPARTMENTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              Request category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {TEAMS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className={styles.span2}>
              Fictional customer
              <input value={customer} onChange={(e) => setCustomer(e.target.value)} required />
            </label>
            <label className={styles.span2}>
              Request summary
              <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </label>
          </div>
          <button type="submit" className={`${styles.button} ${styles.primary} ${styles.spaced}`}>
            {latest ? 'Submit another demo request' : 'Submit request ↗'}
          </button>
          <div className={styles.log}>Demo only · No request is sent outside this presentation.</div>
        </form>

        {!latest ? (
          <div className={styles.panel}>
            <h3 className={styles.h3}>Your case boarding pass</h3>
            <p>A unique reference, current owner and next step appear here after submission.</p>
            <div className={styles.signal}>Submission → Allocation → Maker → Checker → Response</div>
            <div className={styles.small}>Every stage has an owner. Every case has a visible destination.</div>
          </div>
        ) : (
          <div className={`${styles.panel} ${styles.pass}`}>
            <div className={styles.small}>NBB · CASE BOARDING PASS</div>
            <div className={styles.passSerial}>{latest.id}</div>
            <div className={styles.passRoute}>
              <div>
                <div className={styles.small}>FROM</div>
                <strong>{latest.business}</strong>
              </div>
              <span>→</span>
              <div>
                <div className={styles.small}>TO</div>
                <strong>{TEAMS[latest.team]}</strong>
              </div>
            </div>
            <div className={styles.spaced}>{latest.customer}</div>
            <div className={`${styles.small} ${styles.spaced}`}>
              Status: received · Allocation ready
              <br />
              Demo SLA: 2 working days · Human maker/checker review required
            </div>
            <button
              type="button"
              className={`${styles.button} ${styles.primary} ${styles.spaced}`}
              onClick={watchAllocation}
            >
              Watch allocation →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
