"use client";

import { startTransition, useState } from "react";
import { Pie, PieChart, Cell } from "recharts";
import { CalendarDays, Trophy, Wallet } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { money } from "@/lib/format";
import type { RevenueDashboardSummary } from "@/lib/homestay-dashboard";
import { getCustomRevenueSummary } from "./revenue-actions";

const PERIODS = [
  ["today", "Hôm nay"], ["week", "Tuần này"], ["month", "Tháng này"], ["year", "Năm nay"], ["custom", "Tự chọn"],
] as const;
const ROOM_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const chartConfig = { bookings: { label: "Lượt đặt", color: "var(--chart-1)" } } satisfies ChartConfig;

export function RevenueOverview({ data }: { data: RevenueDashboardSummary }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number][0]>("month");
  const [summary, setSummary] = useState(data);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const applyCustomRange = () => {
    if (!from || !to) return;
    setLoading(true);
    startTransition(async () => { try { setSummary(await getCustomRevenueSummary(from, to)); } finally { setLoading(false); } });
  };

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
              <button key={key} type="button" onClick={() => { setPeriod(key); if (key !== "custom") setSummary(data); }} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${period === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          {period === "custom" && <div className="mt-3 flex flex-wrap items-end gap-2"><label className="grid gap-1 text-xs text-muted-foreground">Từ ngày<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-8 rounded-md border bg-background px-2 text-foreground" /></label><label className="grid gap-1 text-xs text-muted-foreground">Đến ngày<input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className="h-8 rounded-md border bg-background px-2 text-foreground" /></label><button type="button" onClick={applyCustomRange} disabled={!from || !to || loading} className="h-8 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50">{loading ? "Đang tải..." : "Áp dụng"}</button></div>}
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{money(summary[period] ?? 0)}đ</p>
          <p className="mt-2 text-sm text-muted-foreground">{summary.paidBookings} thanh toán đã ghi nhận trong dữ liệu hiện có.</p>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Trophy className="size-4 text-amber-500" /> Phòng được đặt nhiều</CardTitle><CardDescription>Top 5 theo số lượt đã thanh toán.</CardDescription></CardHeader>
        <CardContent>
          {summary.topRooms.length ? <div className="flex items-center gap-3"><ChartContainer config={chartConfig} className="h-36 w-36 shrink-0"><PieChart><ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => `${value} lượt đặt`} />} /><Pie data={summary.topRooms} dataKey="bookings" nameKey="name" innerRadius={34} outerRadius={56} paddingAngle={3}>{summary.topRooms.map((room, index) => <Cell key={room.name} fill={ROOM_COLORS[index]} />)}</Pie></PieChart></ChartContainer><div className="min-w-0 space-y-2">{summary.topRooms.map((room, index) => <div key={room.name} className="flex items-center gap-2 text-xs"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: ROOM_COLORS[index] }} /><span className="min-w-0 flex-1 truncate" title={room.name}>{room.name}</span><span className="font-medium tabular-nums">{room.bookings}</span></div>)}</div></div> : <p className="py-8 text-sm text-muted-foreground">Chưa có thanh toán để xếp hạng phòng.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
