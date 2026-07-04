'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export interface StatusPoint {
  status: string;
  count: number;
  share: number;
}

const STATUS_COLORS: Record<string, string> = {
  'Đã xác nhận': 'var(--chart-1)',
  'Chờ cọc': 'var(--chart-2)',
  'Đang ở': 'var(--chart-3)',
  'Hoàn tất': 'var(--chart-4)',
};

export function PieGraph({ data }: { data: StatusPoint[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  const chartConfig = Object.fromEntries(
    data.map((d) => [d.status, { label: d.status, color: STATUS_COLORS[d.status] ?? 'var(--chart-5)' }])
  ) as ChartConfig;

  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
    fill: STATUS_COLORS[d.status] ?? 'var(--chart-5)',
  }));

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Trạng thái đặt phòng</CardTitle>
        <CardDescription>
          {total > 0 ? `${total} booking trong hệ thống` : 'Chưa có dữ liệu'}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        {total > 0 ? (
          <ChartContainer
            config={chartConfig}
            className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey='name' hideLabel />} />
              <Pie
                data={chartData}
                dataKey='value'
                innerRadius={40}
                cornerRadius={6}
                paddingAngle={3}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className='flex h-[250px] items-center justify-center text-sm text-muted-foreground'>
            Chưa có booking nào để hiển thị biểu đồ.
          </div>
        )}
      </CardContent>
      {total > 0 && (
        <div className='flex flex-wrap justify-center gap-x-4 gap-y-1 px-4 pb-4 text-xs text-muted-foreground'>
          {data.map((d) => (
            <span key={d.status} className='flex items-center gap-1'>
              <span
                className='inline-block h-2 w-2 rounded-full'
                style={{ background: STATUS_COLORS[d.status] ?? 'var(--chart-5)' }}
              />
              {d.status} ({d.count})
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
