"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateAdminBooking } from "@/lib/booking-actions";
import type { BookingSnapshot, BookingStatus } from "@/lib/homestay-dashboard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { ImageUpload } from "@/components/image-upload";

const STATUSES: BookingStatus[] = ["Chờ thanh toán", "Đã thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất", "Đã hết hạn - Không thanh toán"];
const CHANNELS = ["Admin", "Walk-in", "Phone", "Facebook", "Zalo", "Booking.com", "Agoda", "Khác"];

function datePart(value: string | null, fallback: string) {
  return value?.slice(0, 10) || fallback;
}

function timePart(value: string | null, fallback: string) {
  return value?.slice(11, 16) || fallback;
}

export function AdminBookingEdit({ booking }: { booking: BookingSnapshot }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [guestName, setGuestName] = React.useState(booking.guestName);
  const [customerName, setCustomerName] = React.useState(booking.customerName ?? "");
  const [customerPhone, setCustomerPhone] = React.useState(booking.customerPhone ?? "");
  const [checkInDate, setCheckInDate] = React.useState(datePart(booking.checkInAt, booking.stayDate));
  const [checkInTime, setCheckInTime] = React.useState(timePart(booking.checkInAt, booking.timeRange.split(" - ")[0] ?? "09:00"));
  const [checkOutDate, setCheckOutDate] = React.useState(datePart(booking.checkOutAt, booking.stayDate));
  const [checkOutTime, setCheckOutTime] = React.useState(timePart(booking.checkOutAt, booking.timeRange.split(" - ")[1] ?? "09:00"));
  const [amount, setAmount] = React.useState(String(booking.amount));
  const [guestCount, setGuestCount] = React.useState(String(booking.guestCount ?? 1));
  const [channel, setChannel] = React.useState(booking.channel);
  const [status, setStatus] = React.useState<BookingStatus>(booking.status);
  const [discountCode, setDiscountCode] = React.useState(booking.discountCode ?? "");
  const [notes, setNotes] = React.useState(booking.notes ?? "");
  const [hasCar, setHasCar] = React.useState(booking.hasCar);
  const [hasDecoration, setHasDecoration] = React.useState(booking.hasDecoration);
  const [cccdFront, setCccdFront] = React.useState<string | null>(booking.cccdFront);
  const [cccdBack, setCccdBack] = React.useState<string | null>(booking.cccdBack);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const result = await updateAdminBooking({
        id: booking.id, guestName, customerName, customerPhone,
        checkInDate, checkInTime, checkOutDate, checkOutTime,
        channel, status, amount: Number(amount) || 0, guestCount: Number(guestCount) || 1,
        discountCode, notes, hasCar, hasDecoration, cccdFront, cccdBack,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Pencil className="size-4" /> Chỉnh sửa booking</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Chỉnh sửa booking admin</DialogTitle><DialogDescription>Đổi thông tin khách, thời gian hoặc giá. Hệ thống sẽ kiểm tra trùng phòng trước khi lưu.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Tên khách *</Label><Input value={guestName} onChange={(event) => setGuestName(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Số khách</Label><Input type="number" min={1} value={guestCount} onChange={(event) => setGuestCount(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Tên trên CCCD</Label><Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Số điện thoại</Label><Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Từ ngày *</Label><DatePicker value={checkInDate} onChange={setCheckInDate} className="w-full" /></div>
          <div className="space-y-1.5"><Label>Giờ bắt đầu *</Label><Input type="time" value={checkInTime} onChange={(event) => setCheckInTime(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Đến ngày *</Label><DatePicker value={checkOutDate} minDate={checkInDate} onChange={setCheckOutDate} className="w-full" /></div>
          <div className="space-y-1.5"><Label>Giờ kết thúc *</Label><Input type="time" value={checkOutTime} onChange={(event) => setCheckOutTime(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Tiền phòng (đ)</Label><Input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} /></div>
          <div className="space-y-1.5"><Label>Mã giảm giá</Label><Input value={discountCode} onChange={(event) => setDiscountCode(event.target.value)} placeholder="Để trống nếu không dùng" /></div>
          <div className="space-y-1.5"><Label>Kênh đặt</Label><Select value={channel} onValueChange={setChannel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHANNELS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Trạng thái</Label><Select value={status} onValueChange={(value) => setStatus(value as BookingStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="space-y-1.5"><Label>Ghi chú</Label><Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-md border p-3 text-sm"><input type="checkbox" checked={hasCar} onChange={(event) => setHasCar(event.target.checked)} /> Có xe hơi</label>
          <label className="flex items-center gap-2 rounded-md border p-3 text-sm"><input type="checkbox" checked={hasDecoration} onChange={(event) => setHasDecoration(event.target.checked)} /> Có trang trí</label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-2 block">CCCD mặt trước</Label><ImageUpload value={cccdFront ? [cccdFront] : []} onChange={(urls) => setCccdFront(urls[0] ?? null)} single /></div><div><Label className="mb-2 block">CCCD mặt sau</Label><ImageUpload value={cccdBack ? [cccdBack] : []} onChange={(urls) => setCccdBack(urls[0] ?? null)} single /></div></div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button><Button onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button></div>
      </DialogContent>
    </Dialog>
  );
}
