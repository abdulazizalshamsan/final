import { useSyncExternalStore } from 'react';
import { caseStore } from './caseStore';
import { missionWeather } from './missionWeather';

/**
 * Re-renders the calling component whenever the case store mutates. The store
 * itself is the source of truth (`caseStore.cases`, `.selected`, ...) — this
 * hook only supplies the subscription "tick" React needs to know something changed.
 */
export function useCaseStoreVersion(): number {
  return useSyncExternalStore(caseStore.subscribe, caseStore.getSnapshot, caseStore.getSnapshot);
}

export function useMissionWeatherVersion(): number {
  return useSyncExternalStore(missionWeather.subscribe, missionWeather.getSnapshot, missionWeather.getSnapshot);
}
