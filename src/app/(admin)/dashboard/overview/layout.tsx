import PageContainer from '@/components/layout/page-container';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getDashboardMetrics, getPaymentSummary } from '@/lib/homestay-dashboard';
import { money } from '@/lib/format';
import { Wallet, Clock, BedDouble, Building2 } from 'lucide-react';
import React from 'react';

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
}) {
  const [metrics, payments] = await Promise.all([getDashboardMetrics(), getPaymentSummary(6)]);

  const branchMetric = metrics.find((metric) => metric.label === 'Chi nhánh đang mở');
  const roomMetric = metrics.find((metric) => metric.label === 'Phòng đang bán');

  const kpiCards = [
    {
      label: 'Doanh thu đã nhận',
      value: `${money(payments.receivedTotal)}đ`,
      note: `${payments.receivedCount} giao dịch gần đây`,
      icon: Wallet,
      accent: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      label: 'Chờ chuyển khoản',
      value: String(payments.pendingCount),
      note: `${money(payments.pendingTotal)}đ đang chờ khách chuyển`,
      icon: Clock,
      accent: 'text-amber-600 dark:text-amber-400'
    },
    {
      label: roomMetric?.label ?? 'Phòng đang bán',
      value: roomMetric?.value ?? '—',
      note: roomMetric?.note ?? '',
      icon: BedDouble,
      accent: 'text-foreground'
    },
    {
      label: branchMetric?.label ?? 'Chi nhánh đang mở',
      value: branchMetric?.value ?? '—',
      note: branchMetric?.note ?? '',
      icon: Building2,
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
