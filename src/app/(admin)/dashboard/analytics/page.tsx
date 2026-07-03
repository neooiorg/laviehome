import { BarChart3, BedDouble, TrendingUp, Zap } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageContainer from "@/components/layout/page-container";
import { money } from "@/lib/format";
import {
  getAmenityLeaderboard,
  getBookingStatusSummary,
  getPriceBands,
  getRevenueSummary,
  getTrendPoints,
} from "@/lib/homestay-dashboard";

import {
  AmenityChart,
  BookingTrendChart,
  PriceBandChart,
  StatusPieChart,
} from "./_components/analytics-charts";

export default async function Page() {
  const [trends, priceBands, amenities, statusSummary, revenueSummary] = await Promise.all([
    getTrendPoints(),
    getPriceBands(),
    getAmenityLeaderboard(8),
    getBookingStatusSummary(100),
    getRevenueSummary(100),
  ]);

  const totalBookings = statusSummary.reduce((s, x) => s + x.count, 0);

  return (
    <PageContainer pageTitle="Thống kê" pageDescription="Phân tích dữ liệu hoạt động của LaVie Home.">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{money(revenueSummary.total)}đ</p>
              <p className="mt-1 text-xs text-muted-foreground">{revenueSummary.bookings.length} booking gần nhất</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">TB / booking</CardTitle>
              <BarChart3 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{money(revenueSummary.average)}đ</p>
              <p className="mt-1 text-xs text-muted-foreground">Giá trị trung bình</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cao nhất</CardTitle>
              <Zap className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{money(revenueSummary.highest)}đ</p>
              <p className="mt-1 text-xs text-muted-foreground">Booking giá cao nhất</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng booking</CardTitle>
              <BedDouble className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{totalBookings}</p>
              <p className="mt-1 text-xs text-muted-foreground">Trong mẫu phân tích</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4" />
                Xu hướng booking
              </CardTitle>
              <CardDescription>6 tháng gần nhất — tổng đặt phòng và phòng premium</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingTrendChart data={trends} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="size-4" />
                Phân phối giá phòng
              </CardTitle>
              <CardDescription>Số lượng phòng theo dải giá</CardDescription>
            </CardHeader>
            <CardContent>
              <PriceBandChart data={priceBands} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tỉ lệ trạng thái booking</CardTitle>
              <CardDescription>Phân bổ trạng thái trong {totalBookings} booking mẫu</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusPieChart data={statusSummary} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top tiện ích phòng</CardTitle>
              <CardDescription>Tiện ích phổ biến nhất theo số phòng có</CardDescription>
            </CardHeader>
            <CardContent>
              <AmenityChart data={amenities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
