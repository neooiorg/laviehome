import { BarGraph } from '@/features/overview/components/bar-graph';
import { getPriceBands } from '@/lib/homestay-dashboard';

export default async function BarStats() {
  const bands = await getPriceBands();
  return <BarGraph data={bands} />;
}
