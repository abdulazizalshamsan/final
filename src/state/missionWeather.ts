import { caseStore } from './caseStore';
import type { Team } from './types';

/**
 * Illustrative staffing-forecast assumptions for the What-If demo.
 * These are labelled demo assumptions only — never real NBB capacity policy.
 */
export const ARRIVALS_PER_DAY = 8;
export const BASELINE_CAPACITY_PER_DAY = 6;
export const CAPACITY_PER_EXTRA_REVIEWER = 4;

/** Queue-pressure thresholds per specialist lane — workload weather, not SLA breach counts. */
const WORKLOAD_THRESHOLDS: [number, number, number] = [4, 8, 6];
const FORECAST_TEAM: Team = 0; // Onboarding is the only lane the What-If simulator forecasts.

export interface ForecastResult {
  now: number;
  projected: number;
  baseline: number;
  capacity: number;
  days: number;
  extraReviewers: number;
}

/**
 * Shared demo state between the What-If simulator and the Mission Control workload
 * weather display. Kept separate from `CaseStore` because a forecast preview must
 * never alter real cases or totals — this module only ever reads case counts.
 */
class MissionWeather {
  previewActive = false;
  extraReviewers = 0;
  horizonDays = 3;
  version = 0;

  private listeners = new Set<() => void>();

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = (): number => this.version;

  private notify() {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  setExtraReviewers(n: number) {
    this.extraReviewers = n;
    this.notify();
  }

  setHorizon(days: number) {
    this.horizonDays = days;
    this.notify();
  }

  startPreview() {
    this.previewActive = true;
    this.notify();
  }

  stopPreview() {
    this.previewActive = false;
    this.notify();
  }

  reset() {
    this.previewActive = false;
    this.extraReviewers = 0;
    this.horizonDays = 3;
    this.notify();
  }

  forecast(): ForecastResult {
    const now = caseStore.activeCount(FORECAST_TEAM);
    const capacity = BASELINE_CAPACITY_PER_DAY + CAPACITY_PER_EXTRA_REVIEWER * this.extraReviewers;
    const baseline = Math.max(
      0,
      now + this.horizonDays * (ARRIVALS_PER_DAY - BASELINE_CAPACITY_PER_DAY),
    );
    const projected = Math.max(0, now + this.horizonDays * (ARRIVALS_PER_DAY - capacity));
    return { now, projected, baseline, capacity, days: this.horizonDays, extraReviewers: this.extraReviewers };
  }

  /** Workload-weather reading for a lane; Onboarding swaps to the forecast figure while a preview is active. */
  teamWeather(team: Team): { pending: number; threshold: number; usingForecast: boolean } {
    const usingForecast = team === FORECAST_TEAM && this.previewActive;
    const pending = usingForecast ? this.forecast().projected : caseStore.activeCount(team);
    return { pending, threshold: WORKLOAD_THRESHOLDS[team], usingForecast };
  }
}

export const missionWeather = new MissionWeather();

/**
 * Which case is open in the Case Workspace desk, and which case the Request Desk most
 * recently created. Exposes setters (rather than public settable fields) so component
 * code never assigns to it directly — the React Compiler's purity analysis flags direct
 * field writes on external objects but not method calls.
 */
class MissionSession {
  deskCaseId = 'ONB-0241';
  latestSubmittedId: string | null = null;

  setDeskCaseId(id: string) {
    this.deskCaseId = id;
  }

  setLatestSubmittedId(id: string | null) {
    this.latestSubmittedId = id;
  }

  reset() {
    this.deskCaseId = 'ONB-0241';
    this.latestSubmittedId = null;
  }
}

export const missionSession = new MissionSession();
