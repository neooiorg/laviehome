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
  'Chờ thanh toán': 'var(--chart-5)',
  'Đã thanh toán': 'var(--chart-3)',
  'Đã xác nhận': 'var(--chart-1)',
  'Chờ cọc': 'var(--chart-2)',
  'Đang ở': 'var(--chart-3)',
  'Hoàn tất': 'var(--chart-4)',
};

const STATUS_DOT: Record<string, string> = {
  'Chờ thanh toán': 'bg-[var(--chart-5)]',
  'Đã thanh toán': 'bg-emerald-500',
  'Đã xác nhận': 'bg-[var(--chart-1)]',
  'Chờ cọc': 'bg-[var(--chart-2)]',
  'Đang ở': 'bg-[var(--chart-3)]',
  'Hoàn tất': 'bg-[var(--chart-4)]',
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
    <Card className="flex h-full flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Trạng thái đặt phòng</CardTitle>
        <CardDescription>
          {total > 0 ? `${total} booking trong hệ thống` : 'Chưa có dữ liệu'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center pb-0">
        {total > 0 ? (
          <div className="relative">
            <ChartContainer
              config={chartConfig}
              className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[240px] min-h-[200px]"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={95}
                  cornerRadius={5}
                  paddingAngle={3}
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{total}</span>
              <span className="text-xs text-muted-foreground">booking</span>
            </div>
          </div>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Chưa có booking nào để hiển thị biểu đồ.
          </div>
        )}
      </CardContent>
      {total > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-4 pb-5 pt-2 text-xs text-muted-foreground">
          {data.map((d) => (
            <span key={d.status} className="flex items-center gap-1.5">
              <span
                className={`inline-block size-2 rounded-full ${STATUS_DOT[d.status] ?? 'bg-muted-foreground'}`}
              />
              <span className="text-foreground/80">{d.status}</span>
              <span className="font-medium text-foreground">{d.count}</span>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
