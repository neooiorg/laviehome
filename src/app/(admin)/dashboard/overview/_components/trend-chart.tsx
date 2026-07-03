"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { TrendPoint } from "@/lib/homestay-dashboard";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          labelFormatter={(l) => `Tháng ${l}`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any, name: any) => [v, name === "bookings" ? "Đặt phòng" : "Premium"]}
        />
        <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="bookings" />
        <Line type="monotone" dataKey="premium" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="premium" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BranchRevenueChart({ data }: { data: { branch: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="branch" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v) => `${Math.round((v as number) / 1000)}k`} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [`${new Intl.NumberFormat("vi-VN").format(v as number)}đ`, "Doanh thu"]}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
