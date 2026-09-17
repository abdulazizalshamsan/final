'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MISSION_TABS } from '@/lib/tabs';
import styles from './Shell.module.css';

export default function TabNav() {
  const pathname = usePathname();

  return (
    <div className={styles.nav} role="tablist" aria-label="Experience">
      {MISSION_TABS.map((tab) => {
        const href = `/mission-control/${tab.key}`;
        const selected = pathname === href;
        return (
          <Link
            key={tab.key}
            href={href}
            role="tab"
            aria-selected={selected}
            aria-controls={`${tab.key}-page`}
            className={styles.navButton}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
