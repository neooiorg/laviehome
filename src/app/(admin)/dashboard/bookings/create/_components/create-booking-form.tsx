"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, IdCard, Info } from "lucide-react";

import { createBookingAdmin } from "@/lib/booking-actions";
import { addDaysToIso, getRoomSlots, getTodayIso, isOvernightRange } from "@/lib/booking-slots";
import { type BookingStatus, type BranchRow, type RoomRow } from "@/lib/homestay-dashboard";
import type { MenuItem } from "@/lib/menu-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/image-upload";

import { MenuItemsSelector } from "../../_components/menu-items-selector";
import { BookingTimelineEditor } from "./booking-timeline-editor";

const CHANNELS = ["Admin", "Walk-in", "Phone", "Facebook", "Zalo", "Booking.com", "Agoda", "Khác"];
const STATUSES: BookingStatus[] = ["Chờ thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function normalizeWholeNumberInput(value: string) {
  return value.replace(/\D/g, "");
}

function dateLabel(value: string) {
  if (!value) return "Chưa chọn";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

interface CreateBookingFormProps {
  rooms: RoomRow[];
  branches: BranchRow[];
  menuItems: MenuItem[];
}

export function CreateBookingForm({ rooms, branches, menuItems }: CreateBookingFormProps) {
  const router = useRouter();
  const today = getTodayIso();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const [guestName, setGuestName] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [timeMode, setTimeMode] = React.useState<"preset" | "custom">("preset");
  const [selectedSlotIndex, setSelectedSlotIndex] = React.useState("0");
  const [checkInDate, setCheckInDate] = React.useState(today);
  const [checkInTime, setCheckInTime] = React.useState("09:00");
  const [checkOutDate, setCheckOutDate] = React.useState(addDaysToIso(today, 1));
  const [checkOutTime, setCheckOutTime] = React.useState("09:00");
  const [channel, setChannel] = React.useState("Admin");
  const [status, setStatus] = React.useState<BookingStatus>("Đã xác nhận");
  const [amount, setAmount] = React.useState("");
  const [guestCount, setGuestCount] = React.useState("2");
  const [notes, setNotes] = React.useState("");
  const [hasCar, setHasCar] = React.useState(false);
  const [hasDecoration, setHasDecoration] = React.useState(false);
  const [cccdFront, setCccdFront] = React.useState<string | null>(null);
  const [cccdBack, setCccdBack] = React.useState<string | null>(null);
  const [selectedMenuItems, setSelectedMenuItems] = React.useState<number[]>([]);

  const selectedRoom = rooms.find((room) => room.id === Number(roomId));
  const roomSlots = getRoomSlots(selectedRoom?.card_name ?? "", selectedRoom?.time_slots);
  const branchId = selectedRoom?.branch_id;
  const branchName = selectedRoom
    ? branches.find((branch) => branch.id === selectedRoom.branch_id)?.name ?? selectedRoom.branch_name
    : "";
  const availableMenuItems = React.useMemo(
    () => menuItems.filter((item) => item.branch_id === branchId),
    [branchId, menuItems]
  );

  React.useEffect(() => {
    if (!branchId) {
      setSelectedMenuItems([]);
      return;
    }
    const availableIds = new Set(availableMenuItems.map((item) => item.id));
    setSelectedMenuItems((current) => current.filter((id) => availableIds.has(id)));
  }, [availableMenuItems, branchId]);

  React.useEffect(() => {
    const slot = roomSlots[Number(selectedSlotIndex)] ?? roomSlots[0];
    if (timeMode !== "preset" || !slot?.start || !slot.end) return;
    setCheckInTime(slot.start);
    setCheckOutTime(slot.end);
    setCheckOutDate(addDaysToIso(checkInDate, isOvernightRange(slot.start, slot.end) ? 1 : 0));
  // The preset should be applied only when switching rooms, not while editing
  // a custom range or the selected date/time values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const selectedMenuItemsTotal = selectedMenuItems.reduce((sum, id) => {
    const item = availableMenuItems.find((menuItem) => menuItem.id === id);
    return sum + Number(item?.price ?? 0);
  }, 0);
  const totalAmount = (Number(amount) || 0) + selectedMenuItemsTotal;
  const hasValidRange = Boolean(checkInDate && checkInTime && checkOutDate && checkOutTime &&
    `${checkOutDate}T${checkOutTime}` > `${checkInDate}T${checkInTime}`);

  function selectPresetSlot(value: string) {
    setSelectedSlotIndex(value);
    const slot = roomSlots[Number(value)];
    if (!slot?.start || !slot.end) return;
    setCheckInTime(slot.start);
    setCheckOutTime(slot.end);
    setCheckOutDate(addDaysToIso(checkInDate, isOvernightRange(slot.start, slot.end) ? 1 : 0));
  }

  async function handleCreate() {
    if (!roomId || !guestName || !branchId || !hasValidRange) {
      setError("Vui lòng chọn phòng, nhập tên khách và khoảng thời gian hợp lệ.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createBookingAdmin({
        roomId: Number(roomId),
        branchId,
        guestName,
        customerName,
        customerPhone,
        stayDate: checkInDate,
        timeRange: `${checkInTime} - ${checkOutTime}`,
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime,
        channel,
        status,
        amount: Number(amount) || 0,
        guestCount: Number(guestCount) || 1,
        notes,
        hasCar,
        hasDecoration,
        cccdFront,
        cccdBack,
        menuItemIds: selectedMenuItems.length > 0 ? selectedMenuItems : undefined,
      });
      router.push("/dashboard/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo booking.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid max-w-5xl gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thông tin booking</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Phòng *</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger><SelectValue placeholder="Chọn phòng..." /></SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={String(room.id)}>{room.card_name} - {room.branch_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {branchName && <p className="text-xs text-muted-foreground">Chi nhánh: {branchName}</p>}
          </div>

          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Khoảng thời gian tùy chỉnh</p>
                <p className="text-xs text-muted-foreground">Admin không bị giới hạn bởi khung giờ mặc định.</p>
              </div>
              <Clock3 className="size-5 text-primary" />
            </div>
            <div className="mb-3 grid grid-cols-2 rounded-lg border bg-background p-1">
              <button type="button" onClick={() => setTimeMode("preset")} className={`rounded-md px-3 py-2 text-sm font-semibold ${timeMode === "preset" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Khung giờ hiện có</button>
              <button type="button" onClick={() => setTimeMode("custom")} className={`rounded-md px-3 py-2 text-sm font-semibold ${timeMode === "custom" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Khoảng thời gian tùy chỉnh</button>
            </div>
            {timeMode === "preset" && <div className="mb-3 space-y-1.5"><Label>Chọn khung giờ</Label><Select value={selectedSlotIndex} onValueChange={selectPresetSlot}><SelectTrigger><SelectValue placeholder="Chọn khung giờ" /></SelectTrigger><SelectContent>{roomSlots.map((slot, index) => <SelectItem key={`${slot.label}-${index}`} value={String(index)}>{slot.label} · {slot.duration}</SelectItem>)}</SelectContent></Select></div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu *</Label>
                <Input type="date" value={checkInDate} min={today} onChange={(event) => setCheckInDate(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ bắt đầu *</Label>
                <Input type="time" value={checkInTime} disabled={timeMode === "preset"} onChange={(event) => setCheckInTime(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc *</Label>
                <Input type="date" value={checkOutDate} min={checkInDate || today} onChange={(event) => setCheckOutDate(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ kết thúc *</Label>
                <Input type="time" value={checkOutTime} disabled={timeMode === "preset"} onChange={(event) => setCheckOutTime(event.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
              <span className="font-semibold">{dateLabel(checkInDate)} {checkInTime}</span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-semibold">{dateLabel(checkOutDate)} {checkOutTime}</span>
            </div>
            {!hasValidRange && <p className="mt-2 text-xs text-destructive">Thời gian kết thúc phải sau thời gian bắt đầu.</p>}
          </div>

          <div className="flex flex-col gap-1.5"><Label>Tên khách *</Label><Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nguyễn Văn A" /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label>Tên trên CCCD</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
            <div className="flex flex-col gap-1.5"><Label>Số điện thoại</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0901..." /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label>Số khách</Label><Input type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} /></div>
            <div className="flex flex-col gap-1.5">
              <Label>Tiền phòng (đ)</Label>
              <Input type="text" inputMode="numeric" pattern="[0-9]*" value={amount} onChange={(e) => setAmount(normalizeWholeNumberInput(e.target.value))} placeholder="VD: 200000" />
              <p className="text-xs text-muted-foreground">Nhập tiền phòng; menu được cộng riêng.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label>Kênh đặt</Label><Select value={channel} onValueChange={setChannel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHANNELS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex flex-col gap-1.5"><Label>Trạng thái</Label><Select value={status} onValueChange={(value) => setStatus(value as BookingStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
          </div>

          {branchId && <><Separator /><div className="flex flex-col gap-2"><Label className="text-base font-semibold">Menu Items (Tùy chọn)</Label><MenuItemsSelector items={availableMenuItems} selectedIds={selectedMenuItems} onSelectionChange={setSelectedMenuItems} /><div className="rounded-md border bg-muted/40 px-3 py-2 text-sm"><div className="flex items-center justify-between"><span className="text-muted-foreground">Menu items</span><span className="font-medium">{money(selectedMenuItemsTotal)}đ</span></div><div className="mt-1 flex items-center justify-between"><span className="text-muted-foreground">Tổng tạm tính</span><span className="font-semibold">{money(totalAmount)}đ</span></div></div></div></>}
          <div className="flex flex-col gap-1.5"><Label>Ghi chú</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm"><input className="mt-1 accent-primary" type="checkbox" checked={hasCar} onChange={(event) => setHasCar(event.target.checked)} /><span><strong>Đến bằng xe hơi</strong><span className="mt-0.5 block text-xs text-muted-foreground">Để nhân viên hỗ trợ chỗ đỗ xe.</span></span></label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm"><input className="mt-1 accent-primary" type="checkbox" checked={hasDecoration} onChange={(event) => setHasDecoration(event.target.checked)} /><span><strong>Gói trang trí</strong><span className="mt-0.5 block text-xs text-muted-foreground">Nhân viên sẽ liên hệ tư vấn thêm.</span></span></label>
          </div>
          <div className="space-y-3 rounded-xl border p-4"><div className="flex items-start gap-2"><IdCard className="mt-0.5 size-5 text-primary" /><div><p className="font-semibold">Xác thực căn cước</p><p className="text-xs text-muted-foreground">Tải mặt trước và mặt sau CCCD của khách nếu cần lưu cùng booking.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-2 block">CCCD mặt trước</Label><ImageUpload value={cccdFront ? [cccdFront] : []} onChange={(urls) => setCccdFront(urls[0] ?? null)} single /></div><div><Label className="mb-2 block">CCCD mặt sau</Label><ImageUpload value={cccdBack ? [cccdBack] : []} onChange={(urls) => setCccdBack(urls[0] ?? null)} single /></div></div></div>
          {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="flex gap-2 border-t pt-3"><Button variant="outline" asChild><Link href="/dashboard/bookings">Hủy</Link></Button><Button onClick={handleCreate} disabled={saving || !roomId || !guestName || !hasValidRange}>{saving ? "Đang tạo..." : "Tạo booking"}</Button></div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="pb-3"><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between text-muted-foreground"><span>Bắt đầu</span><span className="font-medium text-foreground">{checkInTime}</span></div>
          <div className="h-2 rounded-full bg-muted"><div className="h-full w-1/3 rounded-full bg-primary" /></div>
          <div className="flex items-center justify-between text-muted-foreground"><span>Kết thúc</span><span className="font-medium text-foreground">{checkOutTime}</span></div>
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">Khoảng này sẽ được kiểm tra với toàn bộ booking hiện có, bao gồm booking qua đêm và booking theo slot mặc định.</p>
        </CardContent>
      </Card>
      <div className="xl:col-span-2">
        {selectedRoom ? <BookingTimelineEditor roomId={selectedRoom.id} fromDate={checkInDate} toDate={checkOutDate} /> : <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-100"><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">1</div><div><h2 className="text-base font-bold">Xem lịch phòng và giờ trống</h2><p className="mt-1 text-sm leading-6 text-blue-900/75 dark:text-blue-100/75">Hãy chọn một phòng ở ô <strong>Phòng</strong> phía trên. Sau đó, hệ thống sẽ hiển thị booking hiện có và các khoảng giờ còn trống trong khoảng ngày bạn đã chọn.</p><div className="mt-3 flex items-center gap-2 text-xs font-semibold"><Info className="size-4" /> Chọn phòng để bắt đầu xem lịch.</div></div></div></div>}
      </div>
    </div>
  );
}
