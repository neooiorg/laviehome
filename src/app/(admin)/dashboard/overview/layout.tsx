import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { getDashboardMetrics, getRevenueSummary } from '@/lib/homestay-dashboard';
import { money } from '@/lib/format';
import React from 'react';

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const [metrics, revenue] = await Promise.all([
    getDashboardMetrics(),
    getRevenueSummary(50),
  ]);

  const kpiCards = [
    {
      description: metrics[0]?.label ?? 'Chi nhánh đang mở',
      title: metrics[0]?.value ?? '—',
      note: metrics[0]?.note ?? '',
      trend: 'up' as const,
      badge: '+active',
    },
    {
      description: metrics[1]?.label ?? 'Phòng đang bán',
      title: metrics[1]?.value ?? '—',
      note: metrics[1]?.note ?? '',
      trend: 'up' as const,
      badge: metrics[1]?.value ?? '',
    },
    {
      description: 'Tổng doanh thu',
      title: `${money(revenue.total)}đ`,
      note: `${revenue.bookings.length} booking gần nhất`,
      trend: 'up' as const,
      badge: '+12.5%',
    },
    {
      description: metrics[2]?.label ?? 'Giá khởi điểm TB',
      title: metrics[2]?.value ?? '—',
      note: metrics[2]?.note ?? '',
      trend: 'up' as const,
      badge: '+4.5%',
    },
  ];

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>Xin chào, Admin 👋</h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          {kpiCards.map((card) => (
            <Card key={card.description} className='@container/card'>
              <CardHeader>
                <CardDescription>{card.description}</CardDescription>
                <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                  {card.title}
                </CardTitle>
                <CardAction>
                  <Badge variant='outline'>
                    <Icons.trendingUp />
                    {card.badge}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className='flex-col items-start gap-1.5 text-sm'>
                <div className='line-clamp-1 flex gap-2 font-medium'>
                  {card.note} <Icons.trendingUp className='size-4' />
                </div>
                <div className='text-muted-foreground'>LaVie Home Homestay</div>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 min-h-0 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
