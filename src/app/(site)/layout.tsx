import '../../styles/customer.css';

import { MaintenanceScreen } from '@/components/maintenance-screen';
import { CustomerFloatingActions } from '@/components/customer-floating-actions';
import { SeasonalEffects } from '@/components/seasonal-effects';
import { SiteFooter } from '@/components/site-footer';
import { getMaintenanceMode, getSeasonalEffectConfig } from '@/lib/settings-actions';
import { getPublicBranches } from '@/lib/homestay-dashboard';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [maintenance, seasonalConfig] = await Promise.all([
    getMaintenanceMode(),
    getSeasonalEffectConfig(),
  ]);

  if (maintenance) {
    const branches = await getPublicBranches().catch(() => []);
    const hotline = branches.find((b) => b.hotline)?.hotline ?? undefined;
    return <MaintenanceScreen hotline={hotline} />;
  }

  return (
    <>
      {seasonalConfig.enabled && <SeasonalEffects config={seasonalConfig} />}
      {children}
      <CustomerFloatingActions />
      <SiteFooter />
    </>
  );
}
