'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export interface TrendPoint {
  month: string;
  bookings: number;
  premium: number;
}

const chartConfig = {
  bookings: { label: 'Tổng booking', color: 'var(--chart-1)' },
  premium: { label: 'Phòng premium', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function AreaGraph({ data }: { data: TrendPoint[] }) {
  const hasData = data.length > 0 && data.some((d) => d.bookings > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng đặt phòng</CardTitle>
        <CardDescription>
          {data.length > 0
            ? `${data[0]?.month} – ${data[data.length - 1]?.month}`
            : 'Chưa có dữ liệu'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig}>
            <AreaChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} strokeDasharray='3 3' />
              <XAxis dataKey='month' tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <defs>
                <pattern id='area-dots-bookings' x='0' y='0' width='7' height='7' patternUnits='userSpaceOnUse'>
                  <circle cx='5' cy='5' r='1.5' fill='var(--chart-1)' opacity={0.5} />
                </pattern>
                <pattern id='area-dots-premium' x='0' y='0' width='7' height='7' patternUnits='userSpaceOnUse'>
                  <circle cx='5' cy='5' r='1.5' fill='var(--chart-2)' opacity={0.5} />
                </pattern>
              </defs>
              <Area
                dataKey='bookings'
                type='natural'
                fill='url(#area-dots-bookings)'
                fillOpacity={0.4}
                stroke='var(--color-bookings)'
                stackId='a'
                strokeWidth={0.8}
              />
              <Area
                dataKey='premium'
                type='natural'
                fill='url(#area-dots-premium)'
                fillOpacity={0.4}
                stroke='var(--color-premium)'
                stackId='a'
                strokeWidth={0.8}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className='flex h-[200px] items-center justify-center text-sm text-muted-foreground'>
            Chưa có booking nào để hiển thị biểu đồ.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
