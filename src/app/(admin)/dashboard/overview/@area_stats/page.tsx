import { AreaGraph } from '@/features/overview/components/area-graph';
import { getTrendPoints } from '@/lib/homestay-dashboard';

export default async function AreaStats() {
  const trends = await getTrendPoints();
  return <AreaGraph data={trends} />;
}
