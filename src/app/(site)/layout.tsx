import '../../styles/customer.css';

import { MaintenanceScreen } from '@/components/maintenance-screen';
import { CustomerFloatingActions } from '@/components/customer-floating-actions';
import { SiteFooter } from '@/components/site-footer';
import { getMaintenanceMode } from '@/lib/settings-actions';
import { getLuckyWheelConfig } from '@/lib/lucky-wheel-settings';
import { getPublicBranches } from '@/lib/homestay-dashboard';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [maintenance, luckyWheelConfig] = await Promise.all([
    getMaintenanceMode(),
    getLuckyWheelConfig(),
  ]);

  if (maintenance) {
    const branches = await getPublicBranches().catch(() => []);
    const hotline = branches.find((b) => b.hotline)?.hotline ?? undefined;
    return <MaintenanceScreen hotline={hotline} />;
  }

  return (
    <>
      {children}
      <CustomerFloatingActions luckyWheelEnabled={luckyWheelConfig.enabled} />
      <SiteFooter />
    </>
  );
}
