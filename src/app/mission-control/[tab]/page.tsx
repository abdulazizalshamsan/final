import { notFound } from 'next/navigation';
import { MISSION_TABS, isTabKey } from '@/lib/tabs';
import shellStyles from '@/components/mission/Shell.module.css';
import SituationRoom from '@/components/situation-room/SituationRoom';
import RequestDesk from '@/components/request-desk/RequestDesk';
import WhatIf from '@/components/what-if/WhatIf';
import CaseWorkspace from '@/components/case-workspace/CaseWorkspace';

export function generateStaticParams() {
  return MISSION_TABS.map((tab) => ({ tab: tab.key }));
}

export default async function MissionControlTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (!isTabKey(tab)) notFound();

  return (
    <section
      id={`${tab}-page`}
      role="tabpanel"
      className={tab === 'mission' ? shellStyles.pageFlush : shellStyles.page}
    >
      {tab === 'request' && <RequestDesk />}
      {tab === 'mission' && <SituationRoom />}
      {tab === 'what-if' && <WhatIf />}
      {tab === 'workspace' && <CaseWorkspace />}
    </section>
  );
}
