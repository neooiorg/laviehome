import PageContainer from '@/components/layout/page-container';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPaymentSummary, getRevenueDashboardSummary } from '@/lib/homestay-dashboard';
import { money } from '@/lib/format';
import { Wallet, CalendarDays, Trophy, Clock } from 'lucide-react';
import React from 'react';

async function getOverviewSummary() {
  try {
    return await Promise.all([getRevenueDashboardSummary(), getPaymentSummary(6)]);
  } catch (error) {
    console.error('Dashboard overview summary error:', error);
    return [
      { today: 0, week: 0, month: 0, year: 0, paidBookings: 0, topRoom: null },
      {
        receivedTotal: 0,
        receivedCount: 0,
        pendingTotal: 0,
        pendingCount: 0,
        activities: []
      }
    ] as const;
  }
}

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
}) {
  const [metrics, payments] = await getOverviewSummary();

  const kpiCards = [
    {
      label: 'Doanh thu hôm nay',
      value: `${money(metrics.today)}đ`,
      note: 'Theo thời điểm thanh toán',
      icon: Wallet,
      accent: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      label: 'Doanh thu tuần này',
      value: `${money(metrics.week)}đ`,
      note: `${metrics.paidBookings} thanh toán đã ghi nhận`,
      icon: CalendarDays,
      accent: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      label: 'Doanh thu tháng này',
      value: `${money(metrics.month)}đ`,
      note: `Năm ${new Date().getFullYear()}: ${money(metrics.year)}đ`,
      icon: Wallet,
      accent: 'text-foreground'
    },
    {
      label: 'Phòng được đặt nhiều',
      value: metrics.topRoom?.name ?? 'Chưa có',
      note: metrics.topRoom ? `${metrics.topRoom.bookings} lượt · ${money(metrics.topRoom.revenue)}đ` : 'Chưa có thanh toán',
      icon: Trophy,
      accent: 'text-foreground'
    }
  ];

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>Xin chào, Admin 👋</h2>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className='@container/card'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardDescription>{card.label}</CardDescription>
                    <Icon className={`size-4 ${card.accent}`} />
                  </div>
                  <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${card.accent}`}>
                    {card.value}
                  </CardTitle>
                  <p className='text-muted-foreground text-sm'>{card.note}</p>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <div className='lg:col-span-4'>{bar_stats}</div>
          <div className='lg:col-span-3'>{pie_stats}</div>
          <div className='lg:col-span-7'>{sales}</div>
        </div>
      </div>
    </PageContainer>
  );
}
