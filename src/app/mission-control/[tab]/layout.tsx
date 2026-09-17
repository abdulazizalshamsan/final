import Link from 'next/link';
import TabNav from '@/components/mission/TabNav';
import styles from '@/components/mission/Shell.module.css';

export default function MissionControlLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.brandbar}>
        <div className={styles.brand}>
          NBB <small>Financial Crime · Next-generation case experience</small>
        </div>
        <div className={styles.brandActions}>
          <span className={styles.demoPill}>FICTIONAL DEMO</span>
          <Link href="/" className={styles.brandBack}>
            ← Back to cover
          </Link>
        </div>
      </div>
      <TabNav />
      {children}
    </div>
  );
}
