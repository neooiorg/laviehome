'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export interface PriceBandPoint {
  label: string;
  count: number;
}

const chartConfig = {
  count: { label: 'Số phòng', color: 'var(--chart-1)' },
} satisfies ChartConfig;

export function BarGraph({ data }: { data: PriceBandPoint[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Phân bố giá phòng</CardTitle>
            <CardDescription className="mt-1">
              {total > 0 ? `${total} phòng đang hoạt động` : 'Chưa có dữ liệu'}
            </CardDescription>
          </div>
          {total > 0 && (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {max} phòng / khoảng giá
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={data} barCategoryGap="30%" margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="bar-gradient-primary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                content={<ChartTooltipContent indicator="dot" hideLabel />}
              />
              <Bar
                dataKey="count"
                fill="url(#bar-gradient-primary)"
                radius={[6, 6, 2, 2]}
                isAnimationActive
                animationDuration={600}
                animationEasing="ease-out"
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Chưa có dữ liệu phòng.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
