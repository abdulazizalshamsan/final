'use client';

import { caseStore, stateLabel, type ActionType } from '@/state/caseStore';
import { missionSession, missionWeather } from '@/state/missionWeather';
import { useCaseStoreVersion, useMissionWeatherVersion } from '@/state/hooks';
import { CHECKERS, TEAMS, type Team } from '@/state/types';
import type { TabKey } from '@/lib/tabs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import panels from '@/components/mission/Panels.module.css';
import styles from './SituationRoom.module.css';

const ACTIONS: { act: ActionType; label: string; cls?: string }[] = [
  { act: 'journey', label: '▶ Play case journey' },
  { act: 'checker', label: 'Send to checker' },
  { act: 'complete', label: 'Approve & complete', cls: styles.approve },
  { act: 'breach', label: 'Breach SLA', cls: styles.breachButton },
  { act: 'hold', label: 'Await information' },
  { act: 'resume', label: 'Resume review' },
  { act: 'reassign', label: 'Reassign maker' },
  { act: 'pause', label: 'Pause motion' },
  { act: 'reset', label: 'Reset demo' },
];

const WEATHER_POD_LEFT: [number, number, number] = [43, 56, 69];
const WEATHER_ZONE_LEFT: [number, number, number] = [36, 52, 65];

function cx(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// "Reset demo" restores the whole demonstration, not just aircraft positions — the
// What-If staffing scenario and the Case Workspace's open desk are part of it too.
function resetDemo() {
  caseStore.action('reset');
  missionWeather.reset();
  missionSession.reset();
}

export default function SituationRoom() {
  const router = useRouter();
  useCaseStoreVersion();
  useMissionWeatherVersion();
  const [podMessage, setPodMessage] = useState<string | null>(null);

  const c = caseStore.selected;
  const counts = caseStore.counts();
  const teamCounts = caseStore.teamCounts(c.team);
  const label = stateLabel(c.state);

  function goToTab(tab: TabKey) {
    router.push(`/mission-control/${tab}`);
  }

  function handleAction(act: ActionType) {
    if (act === 'reset') resetDemo();
    else caseStore.action(act);
  }

  return (
    <div className={styles.room}>
      <div className={panels.missionStrip}>
        <span className={panels.journeyLive}>
          {missionWeather.previewActive
            ? `FORECAST WEATHER ONLY · ${missionWeather.forecast().days} working days · Live case totals unchanged`
            : (podMessage ?? 'Operational weather reflects each team’s queue.')}
        </span>
        <button
          type="button"
          className={panels.button}
          onClick={() => {
            if (missionWeather.previewActive) {
              missionWeather.stopPreview();
              setPodMessage('Live demo weather restored.');
            } else {
              goToTab('what-if');
            }
          }}
        >
          {missionWeather.previewActive ? 'Return to live weather' : 'Try a staffing forecast →'}
        </button>
      </div>

      <div className={styles.scene}>
        {/* eslint-disable-next-line @next/next/no-img-element -- background is read pixel-by-pixel on the cover; kept as a plain <img> here for consistency and to avoid the optimizer resizing this fixed-composition plate */}
        <img
          className={styles.background}
          src="/assets/nbb/airport-background.jpg"
          alt="Detailed airport dashboard. Every aircraft on the runways and in the holding bays is an individually selectable case."
        />
        <div className={styles.brandMask}>
          NBB <small>National Bank<br />of Bahrain</small>
        </div>

        <div className={cx(styles.metric, styles.m0)}>{counts.received}</div>
        <div className={cx(styles.metric, styles.m1)}>{counts.pending}</div>
        <div className={cx(styles.metric, styles.m2)}>{counts.breachedPending}</div>
        <div className={cx(styles.metric, styles.m3)}>{counts.completed}</div>

        <div>
          {caseStore.cases.map((plane) => {
            const hidden = plane.state === 'completed' && !caseStore.isBusy(plane.id);
            return (
              <button
                key={plane.id}
                type="button"
                className={cx(
                  styles.plane,
                  plane.id === c.id && styles.selected,
                  plane.breached && styles.breached,
                  plane.state === 'hold' && styles.hold,
                )}
                style={{
                  left: `${plane.x}%`,
                  top: `${plane.y}%`,
                  transform: `translate(-50%,-50%) scale(${plane.s})`,
                  opacity: plane.opacity === undefined ? 1 : plane.opacity,
                  display: hidden ? 'none' : 'block',
                }}
                aria-label={`${plane.id} ${TEAMS[plane.team]}`}
                aria-pressed={plane.id === c.id}
                onClick={() => caseStore.select(plane.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative sprite reused across ~20 buttons; next/image adds no benefit here */}
                <img
                  src="/assets/nbb/aircraft-sprite.png"
                  alt=""
                  style={{ transform: `rotate(${plane.r}deg)` }}
                />
                <span className={styles.badge} aria-hidden="true">
                  {plane.breached ? 'BREACHED' : plane.state === 'hold' ? 'Ⅱ' : '◷'}
                </span>
              </button>
            );
          })}
        </div>

        {[0, 1, 2].map((t) => (
          <div
            key={t}
            className={styles.rainzone}
            style={{ left: `${WEATHER_ZONE_LEFT[t]}%` }}
            hidden={!(missionWeather.teamWeather(t as Team).pending > missionWeather.teamWeather(t as Team).threshold)}
          >
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                className={styles.raindrop}
                style={{ left: `${i * 7}%`, animationDelay: `${-i * 0.14}s` }}
              />
            ))}
          </div>
        ))}

        {[0, 1, 2].map((t) => {
          const w = missionWeather.teamWeather(t as Team);
          const rain = w.pending > w.threshold;
          const reason = `${w.usingForecast ? 'Projected ' : ''}${w.pending} pending; demo queue-pressure threshold ${w.threshold}. This is workload weather, not a breach count.`;
          return (
            <button
              key={t}
              type="button"
              className={styles.weatherPod}
              style={{ left: `${WEATHER_POD_LEFT[t]}%` }}
              title={`${TEAMS[t]}: ${reason}`}
              onClick={() => setPodMessage(`${TEAMS[t]}: ${reason}`)}
            >
              {(rain ? '☂ Rain' : '☀ Clear') + (w.usingForecast ? ' · forecast' : '')}
            </button>
          );
        })}

        <div className={styles.inspector}>
          <h3>{TEAMS[c.team]}</h3>
          <div className={styles.inspectorId}>{c.id}</div>
          <div className={styles.inspectorData}>
            <div>
              Team pending
              <strong>{teamCounts.pending}</strong>
            </div>
            <div>
              Breached
              <strong>{teamCounts.breached}</strong>
            </div>
          </div>
          <div className={styles.person}>Maker · {c.owner}</div>
          <div className={styles.person}>Checker · {CHECKERS[c.team]}</div>
          <div className={styles.inspectorState}>{label}</div>
        </div>

        <button
          type="button"
          className={cx(styles.hit, styles.play)}
          aria-label="Play selected case journey"
          onClick={() => caseStore.action('journey')}
        />
        <button
          type="button"
          className={cx(styles.hit, styles.pauseHit)}
          aria-label="Pause or resume aircraft movement"
          onClick={() => caseStore.action('pause')}
        />
        <button
          type="button"
          className={cx(styles.hit, styles.resetHit)}
          aria-label="Reset all demo cases"
          onClick={resetDemo}
        />
      </div>

      <div className={styles.hud}>
        <div className={styles.title}>
          <span>{c.id} · {TEAMS[c.team]}</span>
          <span>{label} · {c.breached ? 'SLA breached' : 'Within SLA'}</span>
        </div>
        <div className={styles.copy} aria-live="polite">
          {caseStore.lastMessage}
        </div>
        <div className={styles.selection}>
          <label htmlFor="airport-case-picker">Selected case</label>
          <select
            id="airport-case-picker"
            className={styles.picker}
            value={c.id}
            onChange={(e) => caseStore.select(e.target.value)}
          >
            {caseStore.cases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {TEAMS[p.team]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.actions}>
          {ACTIONS.map((a) => (
            <button
              key={a.act}
              type="button"
              className={a.cls}
              disabled={!caseStore.canPerform(a.act, c.id)}
              onClick={() => handleAction(a.act)}
            >
              {a.act === 'pause' ? (caseStore.paused ? 'Resume motion' : 'Pause motion') : a.label}
            </button>
          ))}
        </div>
        <div className={styles.event}>{caseStore.lastMessage}</div>
        <div className={styles.note}>
          Fixed-camera layered prototype · Fictional cases · &ldquo;Breach SLA&rdquo; simulates expiry · Completion
          requires checker stage · Reset restores all cases.
        </div>
      </div>
    </div>
  );
}
