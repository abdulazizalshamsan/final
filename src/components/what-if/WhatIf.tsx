'use client';

import { useRouter } from 'next/navigation';
import { missionWeather } from '@/state/missionWeather';
import { useCaseStoreVersion, useMissionWeatherVersion } from '@/state/hooks';
import styles from '@/components/mission/Panels.module.css';

export default function WhatIf() {
  const router = useRouter();
  useCaseStoreVersion();
  useMissionWeatherVersion();

  const f = missionWeather.forecast();
  const max = Math.max(f.baseline, f.projected, 1);
  const weatherLine =
    f.projected > f.now
      ? 'Rain · Queue building'
      : f.projected === 0
        ? 'Clear skies · Projected backlog cleared'
        : 'Clouds clearing · Queue reducing';

  return (
    <section>
      <h2 className={styles.h2}>What if we add capacity?</h2>
      <p className={styles.intro}>
        Change the staffing assumption. See the predicted queue and weather change before making a decision.
      </p>
      <div className={styles.two}>
        <div className={styles.panel}>
          <h3 className={styles.h3}>Onboarding · Staffing simulator</h3>
          <label>
            Additional eligible reviewers: <strong>{f.extraReviewers}</strong>
            <input
              type="range"
              className={styles.range}
              min={0}
              max={3}
              step={1}
              value={f.extraReviewers}
              onChange={(e) => missionWeather.setExtraReviewers(Number(e.target.value))}
            />
          </label>
          <label className={styles.spaced}>
            Forecast horizon
            <select
              className={styles.select}
              value={f.days}
              onChange={(e) => missionWeather.setHorizon(Number(e.target.value))}
            >
              <option value={1}>Tomorrow</option>
              <option value={3}>In 3 working days</option>
              <option value={5}>In 5 working days</option>
            </select>
          </label>
          <div className={styles.forecastNote}>
            Illustrative assumptions: 8 new cases/day; current team completes 6/day; each additional eligible
            reviewer adds 4/day. Constant rates; sufficient checker capacity assumed. These are not measured NBB
            productivity figures.
          </div>
          <button
            type="button"
            className={`${styles.button} ${styles.spaced}`}
            onClick={() => {
              missionWeather.startPreview();
              router.push('/mission-control/mission');
            }}
          >
            Preview forecast weather in airport
          </button>
        </div>

        <div className={styles.panel}>
          <h3 className={styles.h3}>Forecast · Not the live case position</h3>
          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <div className={styles.small}>Pending now</div>
              <div className={styles.value}>{f.now}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.small}>Projected pending</div>
              <div className={styles.value}>{f.projected}</div>
            </div>
            <div className={styles.kpi}>
              <div className={styles.small}>Capacity / day</div>
              <div className={styles.value}>{f.capacity}</div>
            </div>
          </div>
          <div className={styles.small}>Queue without extra reviewers</div>
          <div className={styles.meter}>
            <span className={styles.meterFill} style={{ width: `${(f.baseline / max) * 100}%` }} />
          </div>
          <div className={styles.small}>Queue with selected staffing</div>
          <div className={styles.meter}>
            <span className={styles.meterFill} style={{ width: `${(f.projected / max) * 100}%` }} />
          </div>
          <div className={styles.signal}>{weatherLine}</div>
          <div className={styles.forecastNote}>
            Forecasts do not change real assignments, SLA deadlines or live totals.
          </div>
        </div>
      </div>
    </section>
  );
}
