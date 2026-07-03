import { AlertTriangle, Building2, CalendarCheck, Info, TrendingUp } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { money } from "@/lib/format";
import {
  getBranchSummaries,
  getBookingSnapshots,
  getDashboardMetrics,
  getOperationalAlerts,
  getRevenueSummary,
  getTrendPoints,
} from "@/lib/homestay-dashboard";

import { BranchRevenueChart, TrendChart } from "./_components/trend-chart";

const STATUS_COLORS: Record<string, string> = {
  "Đã xác nhận": "default",
  "Chờ cọc": "secondary",
  "Đang ở": "outline",
  "Hoàn tất": "secondary",
};

const ALERT_ICON = {
  info: <Info className="size-4" />,
  warning: <AlertTriangle className="size-4" />,
  critical: <AlertTriangle className="size-4 text-destructive" />,
};

export default async function Page() {
  const [metrics, trends, alerts, branchSummaries, revenueSummary, recentBookings] = await Promise.all([
    getDashboardMetrics(),
    getTrendPoints(),
    getOperationalAlerts(),
    getBranchSummaries(6),
    getRevenueSummary(50),
    getBookingSnapshots(10),
  ]);

  const branchRevenueData = branchSummaries.map((s) => ({
    branch: s.city || s.branch.name,
    total: revenueSummary.bookings
      .filter((b) => b.branch.id === s.branch.id)
      .reduce((sum, b) => sum + b.amount, 0),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <p className="text-sm text-muted-foreground">{m.label}</p>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{m.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" />
              Xu hướng booking
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <TrendChart data={trends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4" />
              Doanh thu theo chi nhánh
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <BranchRevenueChart data={branchRevenueData} />
          </CardContent>
        </Card>
      </div>

      {/* Alerts + Recent bookings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Alerts */}
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base">Cảnh báo vận hành</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có cảnh báo nào.</p>
            ) : (
              alerts.map((alert, i) => (
                <Alert key={i} variant={alert.tone === "critical" ? "destructive" : "default"}>
                  {ALERT_ICON[alert.tone]}
                  <AlertTitle className="text-sm font-medium">{alert.title}</AlertTitle>
                  <AlertDescription className="text-xs">{alert.detail}</AlertDescription>
                </Alert>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent bookings */}
        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="size-4" />
              Booking gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-xs font-normal">Khách</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-normal">Phòng</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-normal">Tiền</TableHead>
                  <TableHead className="px-4 py-3 text-xs font-normal">TT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="px-4 py-2 text-sm">{b.guestName}</TableCell>
                    <TableCell className="px-4 py-2 text-xs text-muted-foreground">{b.room.card_name}</TableCell>
                    <TableCell className="px-4 py-2 text-sm tabular-nums">{money(b.amount)}đ</TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge variant={STATUS_COLORS[b.status] as "default" | "secondary" | "outline"} className="text-xs">
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
