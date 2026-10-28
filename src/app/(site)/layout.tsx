import '../../styles/customer.css';

import { MaintenanceScreen } from '@/components/maintenance-screen';
import { CustomerFloatingActions } from '@/components/customer-floating-actions';
import { SeasonalEffects } from '@/components/seasonal-effects';
import { SiteFooter } from '@/components/site-footer';
import { getMaintenanceMode, getSeasonalEffectConfig } from '@/lib/settings-actions';
import { isSeasonalEffectActive } from '@/lib/seasonal-effects';
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
      {isSeasonalEffectActive(
        seasonalConfig,
        new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
      ) && <SeasonalEffects config={seasonalConfig} />}
      {children}
      <CustomerFloatingActions />
      <SiteFooter />
    </>
  );
}
