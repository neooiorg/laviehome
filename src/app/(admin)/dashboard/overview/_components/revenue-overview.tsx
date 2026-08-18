"use client";

import { useState } from "react";
import { Pie, PieChart, Cell } from "recharts";
import { CalendarDays, Trophy, Wallet } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { money } from "@/lib/format";
import type { RevenueDashboardSummary } from "@/lib/homestay-dashboard";

const PERIODS = [
  ["today", "Hôm nay"], ["week", "Tuần này"], ["month", "Tháng này"], ["year", "Năm nay"],
] as const;
const ROOM_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const chartConfig = { bookings: { label: "Lượt đặt", color: "var(--chart-1)" } } satisfies ChartConfig;

export function RevenueOverview({ data }: { data: RevenueDashboardSummary }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>("month");
  const periodLabel = PERIODS.find(([key]) => key === period)?.[1] ?? "Tháng này";

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><Wallet className="size-4 text-emerald-500" /> Doanh thu thực nhận</CardTitle>
              <CardDescription className="mt-1">Tính theo thời điểm thanh toán của khách và admin.</CardDescription>
            </div>
            <CalendarDays className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-4 flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {PERIODS.map(([key, label]) => (
              <button key={key} type="button" onClick={() => setPeriod(key)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${period === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{money(data[period])}đ</p>
          <p className="mt-2 text-sm text-muted-foreground">{data.paidBookings} thanh toán đã ghi nhận trong dữ liệu hiện có.</p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Trophy className="size-4 text-amber-500" /> Phòng được đặt nhiều</CardTitle><CardDescription>Top 5 theo số lượt đã thanh toán.</CardDescription></CardHeader>
        <CardContent>
          {data.topRooms.length ? <div className="flex items-center gap-3"><ChartContainer config={chartConfig} className="h-36 w-36 shrink-0"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => `${value} lượt đặt`} />} /><Pie data={data.topRooms} dataKey="bookings" nameKey="name" innerRadius={34} outerRadius={56} paddingAngle={3}>{data.topRooms.map((room, index) => <Cell key={room.name} fill={ROOM_COLORS[index]} />)}</Pie></PieChart></ChartContainer><div className="min-w-0 space-y-2">{data.topRooms.map((room, index) => <div key={room.name} className="flex items-center gap-2 text-xs"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: ROOM_COLORS[index] }} /><span className="min-w-0 flex-1 truncate" title={room.name}>{room.name}</span><span className="font-medium tabular-nums">{room.bookings}</span></div>)}</div></div> : <p className="py-8 text-sm text-muted-foreground">Chưa có thanh toán để xếp hạng phòng.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
