import { PieGraph } from '@/features/overview/components/pie-graph';
import { getBookingStatusSummary } from '@/lib/homestay-dashboard';

export default async function PieStats() {
  const statuses = await getBookingStatusSummary(100).catch((error) => {
    console.error('Dashboard booking status error:', error);
    return [];
  });
  return <PieGraph data={statuses} />;
}
