import { RevenueBar } from '@/features/overview/components/revenue-bar';
import { getMonthlyRevenue } from '@/lib/homestay-dashboard';

export default async function BarStats() {
  const revenue = await getMonthlyRevenue().catch((error) => {
    console.error('Dashboard monthly revenue error:', error);
    return [];
  });
  return <RevenueBar data={revenue} />;
}
