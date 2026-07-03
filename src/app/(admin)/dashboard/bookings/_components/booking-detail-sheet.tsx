"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { BookingSnapshot } from "@/lib/homestay-dashboard";

import { BookingStatusSelect } from "./booking-status-select";

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface Props {
  booking: BookingSnapshot | null;
  onClose: () => void;
}

export function BookingDetailSheet({ booking, onClose }: Props) {
  return (
    <Sheet open={!!booking} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {booking && (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-lg">Chi tiết booking #{booking.id}</SheetTitle>
            </SheetHeader>

            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Khách</h3>
                <Field label="Tên khách" value={booking.guestName} />
                <Field label="Họ tên thực" value={booking.customerName} />
                <Field label="SĐT" value={booking.customerPhone} />
                <Field label="Số khách" value={booking.guestCount ?? null} />
                {booking.hasCar && <Field label="Có xe" value="✓" />}
                {booking.hasDecoration && <Field label="Trang trí" value="✓" />}
              </section>

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Đặt phòng</h3>
                <Field label="Phòng" value={booking.room.card_name} />
                <Field label="Chi nhánh" value={booking.branch.name} />
                <Field label="Ngày" value={booking.dateLabel} />
                <Field label="Giờ" value={booking.timeRange} />
                <Field label="Kênh" value={booking.channel} />
                <Field label="Số tiền" value={`${money(booking.amount)}đ`} />
                <Field label="Mã giảm giá" value={booking.discountCode} />
                <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <BookingStatusSelect id={booking.id} currentStatus={booking.status} />
                </div>
              </section>

              {booking.notes && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ghi chú</h3>
                  <p className="text-sm rounded-md bg-muted px-3 py-2">{booking.notes}</p>
                </section>
              )}

              {(booking.cccdFront || booking.cccdBack) && (
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CCCD</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {booking.cccdFront && (
                      <a href={booking.cccdFront} target="_blank" rel="noreferrer">
                        <Image
                          src={booking.cccdFront}
                          alt="CCCD mặt trước"
                          width={200}
                          height={130}
                          className="rounded-md border object-cover w-full"
                        />
                      </a>
                    )}
                    {booking.cccdBack && (
                      <a href={booking.cccdBack} target="_blank" rel="noreferrer">
                        <Image
                          src={booking.cccdBack}
                          alt="CCCD mặt sau"
                          width={200}
                          height={130}
                          className="rounded-md border object-cover w-full"
                        />
                      </a>
                    )}
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hệ thống</h3>
                <Field label="Booking ID" value={<span className="font-mono text-xs">{booking.id}</span>} />
                <Field label="Tạo lúc" value={new Date(booking.createdAt).toLocaleString("vi-VN")} />
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
