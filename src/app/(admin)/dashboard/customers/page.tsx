import { Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageContainer from "@/components/layout/page-container";
import { money } from "@/lib/format";
import { getGuestSummaries } from "@/lib/homestay-dashboard";

import { CustomersSearch } from "./_components/customers-search";

export default async function Page() {
  const guests = await getGuestSummaries(50);

  return (
    <PageContainer pageTitle="Khách hàng" pageDescription="Danh sách khách đã đặt phòng, xếp theo tổng chi tiêu.">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tổng khách</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{guests.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Trong 50 booking gần nhất</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chi tiêu cao nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {guests[0] ? `${money(guests[0].totalSpent)}đ` : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{guests[0]?.guestName ?? ""}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Booking nhiều nhất</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {Math.max(...guests.map((g) => g.bookings), 0)} lần
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {guests.find((g) => g.bookings === Math.max(...guests.map((x) => x.bookings)))?.guestName ?? ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chi tiêu TB</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {guests.length ? `${money(Math.round(guests.reduce((s, g) => s + g.totalSpent, 0) / guests.length))}đ` : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Trung bình mỗi khách</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Danh sách khách hàng</CardTitle>
                <CardDescription className="mt-1">
                  {guests.length} khách, xếp theo tổng chi tiêu
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pt-0">
            <CustomersSearch guests={guests} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
