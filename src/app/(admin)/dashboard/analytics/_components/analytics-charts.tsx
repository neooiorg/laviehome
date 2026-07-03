"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { BookingStatusPoint, PriceBandPoint, TrendPoint } from "@/lib/homestay-dashboard";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export function BookingTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-bookings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-premium" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          labelFormatter={(l) => `Tháng ${l}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter={(v: any, name: any) => [v, name === "bookings" ? "Tổng booking" : "Premium"]}
        />
        <Area type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" fill="url(#grad-bookings)" strokeWidth={2} name="bookings" />
        <Area type="monotone" dataKey="premium" stroke="hsl(var(--chart-2))" fill="url(#grad-premium)" strokeWidth={2} name="premium" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PriceBandChart({ data }: { data: PriceBandPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter={(v: any) => [v, "Số phòng"]}
        />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: BookingStatusPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius={90}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label={({ status, share }: any) => `${status} ${share}%`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter={(v: any, name: any) => [v, name]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AmenityChart({ data }: { data: { label: string; count: number; share: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={110} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter={(v: any) => [v, "Số phòng có"]}
        />
        <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
