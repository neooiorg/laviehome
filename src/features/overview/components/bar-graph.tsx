'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bố giá phòng</CardTitle>
        <CardDescription>
          {total > 0 ? `${total} phòng đang hoạt động` : 'Chưa có dữ liệu'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={data} barCategoryGap='30%'>
              <defs>
                <pattern id='bar-dots-bg' x='0' y='0' width='10' height='10' patternUnits='userSpaceOnUse'>
                  <circle className='text-muted dark:text-muted/40' cx='2' cy='2' r='1' fill='currentColor' />
                </pattern>
              </defs>
              <rect x='0' y='0' width='100%' height='85%' fill='url(#bar-dots-bg)' />
              <XAxis dataKey='label' tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dashed' hideLabel />} />
              <Bar dataKey='count' fill='var(--color-count)' radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className='flex h-[200px] items-center justify-center text-sm text-muted-foreground'>
            Chưa có dữ liệu phòng.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
