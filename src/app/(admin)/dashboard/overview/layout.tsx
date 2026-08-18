import PageContainer from '@/components/layout/page-container';
import { getPaymentSummary, getRevenueDashboardSummary, type RevenueDashboardSummary } from '@/lib/homestay-dashboard';
import React from 'react';
import { RevenueOverview } from './_components/revenue-overview';

async function getOverviewSummary() {
  try {
    return await Promise.all([getRevenueDashboardSummary(), getPaymentSummary(6)]);
  } catch (error) {
    console.error('Dashboard overview summary error:', error);
    return [
      { today: 0, week: 0, month: 0, year: 0, paidBookings: 0, topRoom: null, topRooms: [] as RevenueDashboardSummary['topRooms'] },
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

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>Xin chào, Admin 👋</h2>
        </div>

        <RevenueOverview data={metrics} />

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
          <div className='lg:col-span-4'>{bar_stats}</div>
          <div className='lg:col-span-3'>{pie_stats}</div>
          <div className='lg:col-span-7'>{sales}</div>
        </div>
      </div>
    </PageContainer>
  );
}
