'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { money } from '@/lib/format';

export interface RevenuePoint {
  month: string;
  revenue: number;
  bookings: number;
}

const chartConfig = {
  revenue: { label: 'Doanh thu', color: 'var(--chart-1)' }
} satisfies ChartConfig;

function compactVnd(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export function RevenueBar({ data }: { data: RevenuePoint[] }) {
  const total = data.reduce((sum, point) => sum + point.revenue, 0);
  const hasData = total > 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Doanh thu theo tháng</CardTitle>
            <CardDescription className="mt-1">
              {data.length > 0 ? `${data[0]?.month} – ${data[data.length - 1]?.month}` : 'Chưa có dữ liệu'}
            </CardDescription>
          </div>
          {hasData && (
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums">{money(total)}đ</div>
              <div className="text-xs text-muted-foreground">tổng doanh thu</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-full min-h-[220px] w-full">
            <BarChart data={data} barCategoryGap="28%" margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenue-bar-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.5} />
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
                width={44}
                tickFormatter={(value) => compactVnd(Number(value))}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, _name, item) => (
                      <div className="flex w-full flex-col gap-0.5">
                        <span className="font-medium text-foreground">{money(Number(value))}đ</span>
                        <span className="text-xs text-muted-foreground">
                          {item?.payload?.bookings ?? 0} booking
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                fill="url(#revenue-bar-gradient)"
                radius={[6, 6, 2, 2]}
                isAnimationActive
                animationDuration={600}
                animationEasing="ease-out"
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-muted-foreground">
            Chưa có doanh thu để hiển thị.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
