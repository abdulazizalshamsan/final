export const MISSION_TABS = [
  { key: 'request', label: '1 · Request desk' },
  { key: 'mission', label: '2 · Mission Control' },
  { key: 'what-if', label: '3 · What if?' },
  { key: 'workspace', label: '4 · Case workspace' },
] as const;

export type TabKey = (typeof MISSION_TABS)[number]['key'];

export function isTabKey(value: string): value is TabKey {
  return MISSION_TABS.some((t) => t.key === value);
}
