import '../../styles/customer.css';

import { MaintenanceScreen } from '@/components/maintenance-screen';
import { getMaintenanceMode } from '@/lib/settings-actions';
import { getPublicBranches } from '@/lib/homestay-dashboard';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const maintenance = await getMaintenanceMode();

  if (maintenance) {
    const branches = await getPublicBranches().catch(() => []);
    const hotline = branches.find((b) => b.hotline)?.hotline ?? undefined;
    return <MaintenanceScreen hotline={hotline} />;
  }

  return <>{children}</>;
}
