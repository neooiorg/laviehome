'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';

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
  const totalBookings = data.reduce((s, d) => s + d.bookings, 0);
  const lastMonth = data[data.length - 1];
  const prevMonth = data[data.length - 2];
  const trend = prevMonth && prevMonth.bookings > 0
    ? Math.round(((lastMonth?.bookings ?? 0) - prevMonth.bookings) / prevMonth.bookings * 100)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Xu hướng đặt phòng</CardTitle>
            <CardDescription className="mt-1">
              {data.length > 0
                ? `${data[0]?.month} – ${data[data.length - 1]?.month}`
                : 'Chưa có dữ liệu'}
            </CardDescription>
          </div>
          {hasData && totalBookings > 0 && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {totalBookings} tổng
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="area-grad-bookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="area-grad-premium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="bookings"
                type="natural"
                fill="url(#area-grad-bookings)"
                stroke="var(--color-bookings)"
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
              <Area
                dataKey="premium"
                type="natural"
                fill="url(#area-grad-premium)"
                stroke="var(--color-premium)"
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Chưa có booking nào để hiển thị biểu đồ.
          </div>
        )}
      </CardContent>
      {trend !== null && (
        <CardFooter>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className={`size-3.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500 rotate-180'}`} />
            <span>
              {trend >= 0 ? '+' : ''}{trend}% so với tháng trước
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
