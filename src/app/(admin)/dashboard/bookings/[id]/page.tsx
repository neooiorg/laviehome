import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getBookingById } from "@/lib/homestay-dashboard";
import type { BookingSnapshot } from "@/lib/homestay-dashboard";
import { BookingStatusSelect } from "../_components/booking-status-select";

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start gap-4 py-2.5">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

const statusMeta: Record<string, { badgeClass: string; dotClass: string }> = {
  "Đã xác nhận": { badgeClass: "border-blue-200 text-blue-700 dark:border-blue-500/30 dark:text-blue-400", dotClass: "bg-blue-500" },
  "Chờ cọc": { badgeClass: "border-amber-200 text-amber-700 dark:border-amber-500/30 dark:text-amber-400", dotClass: "bg-amber-500" },
  "Đang ở": { badgeClass: "border-green-200 text-green-700 dark:border-green-500/30 dark:text-green-400", dotClass: "bg-green-500" },
  "Hoàn tất": { badgeClass: "border-muted-foreground/30 text-muted-foreground", dotClass: "bg-muted-foreground" },
};

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking: BookingSnapshot | null = await getBookingById(id);
  if (!booking) notFound();

  const meta = statusMeta[booking.status] ?? statusMeta["Hoàn tất"];

  return (
    <PageContainer>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/bookings"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Danh sách đặt phòng
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">#{booking.id}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tạo lúc {new Date(booking.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          <Badge className={cn("gap-1.5 border px-2.5 py-1 font-medium", meta.badgeClass)} variant="outline">
            <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
            {booking.status}
          </Badge>
          <BookingStatusSelect id={booking.id} currentStatus={booking.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — main info */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin khách</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0 px-6 pb-4">
              <Field label="Tên hiển thị" value={booking.guestName} />
              <Field label="Họ tên thực" value={booking.customerName} />
              <Field label="Số điện thoại" value={booking.customerPhone} />
              <Field label="Số khách" value={booking.guestCount !== null ? `${booking.guestCount} người` : null} />
              <Field label="Có xe" value={booking.hasCar ? "Có" : null} />
              <Field label="Trang trí" value={booking.hasDecoration ? "Có" : null} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin đặt phòng</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0 px-6 pb-4">
              <Field label="Phòng" value={booking.room.card_name} />
              <Field label="Chi nhánh" value={booking.branch.name} />
              <Field label="Ngày" value={booking.dateLabel} />
              <Field label="Khung giờ" value={booking.timeRange} />
              <Field label="Kênh" value={booking.channel} />
              <Field label="Mã giảm giá" value={booking.discountCode} />
              {booking.menuItemsTotal > 0 ? (
                <>
                  <Field label="Tiền phòng" value={<span className="text-sm">{money(booking.amount)}đ</span>} />
                  <Field label="Menu items" value={<span className="text-sm">+{money(booking.menuItemsTotal)}đ</span>} />
                  <Field
                    label="Tổng cộng"
                    value={<span className="text-base font-semibold text-primary">{money(booking.amount + booking.menuItemsTotal)}đ</span>}
                  />
                </>
              ) : (
                <Field
                  label="Số tiền"
                  value={<span className="text-base font-semibold">{money(booking.amount)}đ</span>}
                />
              )}
            </CardContent>
          </Card>

          {booking.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{booking.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — CCCD + meta */}
        <div className="space-y-6">
          {(booking.cccdFront || booking.cccdBack) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">CCCD / CMND</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.cccdFront && (
                  <div>
                    <p className="mb-1.5 text-xs text-muted-foreground">Mặt trước</p>
                    <a href={booking.cccdFront} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={booking.cccdFront}
                        alt="CCCD mặt trước"
                        className="w-full rounded-lg border object-cover"
                      />
                    </a>
                  </div>
                )}
                {booking.cccdBack && (
                  <div>
                    <p className="mb-1.5 text-xs text-muted-foreground">Mặt sau</p>
                    <a href={booking.cccdBack} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={booking.cccdBack}
                        alt="CCCD mặt sau"
                        className="w-full rounded-lg border object-cover"
                      />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin hệ thống</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Mã booking</span>
                <span className="font-mono text-sm font-medium">{booking.id}</span>
              </div>
              <Separator />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Tạo lúc</span>
                <span className="text-sm">{new Date(booking.createdAt).toLocaleString("vi-VN")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
