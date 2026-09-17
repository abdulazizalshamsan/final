import { CaseStatus } from '@/lib/types';
import { STATUS_PILL_CLASS, statusLabel, THREAT_PILL_CLASS } from '@/lib/helpers';

export function StatusPill({ status }: { status: CaseStatus }) {
  return <span className={`pill ${STATUS_PILL_CLASS[status]}`}>{statusLabel(status)}</span>;
}

export function ThreatPill({ threat }: { threat: 'High' | 'Medium' | 'Low' }) {
  return <span className={`pill ${THREAT_PILL_CLASS[threat]}`}>{threat.toUpperCase()} THREAT</span>;
}

export function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`pill ${className}`}>{children}</span>;
}
