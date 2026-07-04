import { PieGraph } from '@/features/overview/components/pie-graph';
import { getBookingStatusSummary } from '@/lib/homestay-dashboard';

export default async function PieStats() {
  const statuses = await getBookingStatusSummary(100);
  return <PieGraph data={statuses} />;
}
