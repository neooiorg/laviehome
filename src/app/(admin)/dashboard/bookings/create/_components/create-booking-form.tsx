"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, IdCard } from "lucide-react";

import { createBookingAdmin } from "@/lib/booking-actions";
import { addDaysToIso, getRoomSlots, getTodayIso, getTimeslotIdsOverlappingRange, isOvernightRange, makeLocalDateTime } from "@/lib/booking-slots";
import { type BookingStatus, type BranchRow, type DiscountCode, type RoomRow } from "@/lib/homestay-dashboard";
import type { MenuItem } from "@/lib/menu-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { ImageUpload } from "@/components/image-upload";

import { MenuItemsSelector } from "../../_components/menu-items-selector";
import { AdminBookingCalendar, type AdminPresetSelection } from "./admin-booking-calendar";

const CHANNELS = ["Admin", "Walk-in", "Phone", "Facebook", "Zalo", "Booking.com", "Agoda", "Khác"];
const STATUSES: BookingStatus[] = ["Chờ thanh toán", "Đã thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];

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
  discountCodes: DiscountCode[];
}

export function CreateBookingForm({ rooms, menuItems, discountCodes }: CreateBookingFormProps) {
  const router = useRouter();
  const today = getTodayIso();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [guestName, setGuestName] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [timeMode, setTimeMode] = React.useState<"preset" | "custom">("preset");
  const [presetSelections, setPresetSelections] = React.useState<AdminPresetSelection[]>([]);
  const [checkInDate, setCheckInDate] = React.useState(today);
  const [checkInTime, setCheckInTime] = React.useState("09:00");
  const [checkOutDate, setCheckOutDate] = React.useState(addDaysToIso(today, 1));
  const [checkOutTime, setCheckOutTime] = React.useState("09:00");
  const [channel, setChannel] = React.useState("Admin");
  const [status, setStatus] = React.useState<BookingStatus>("Đã xác nhận");
  const [amount, setAmount] = React.useState("");
  const [discountMode, setDiscountMode] = React.useState<"none" | "voucher" | "manual">("none");
  const [voucherCode, setVoucherCode] = React.useState("");
  const [manualDiscountType, setManualDiscountType] = React.useState<"percent" | "amount">("percent");
  const [manualDiscount, setManualDiscount] = React.useState("");
  const [guestCount, setGuestCount] = React.useState("2");
  const [notes, setNotes] = React.useState("");
  const [hasCar, setHasCar] = React.useState(false);
  const [hasDecoration, setHasDecoration] = React.useState(false);
  const [cccdFront, setCccdFront] = React.useState<string | null>(null);
  const [cccdBack, setCccdBack] = React.useState<string | null>(null);
  const [selectedMenuItems, setSelectedMenuItems] = React.useState<number[]>([]);
  const [customBlockedRoomIds, setCustomBlockedRoomIds] = React.useState<Set<number>>(new Set());
  const [customAvailabilityLoading, setCustomAvailabilityLoading] = React.useState(false);

  const selectedRoom = rooms.find((room) => room.id === presetSelections[0]?.roomId);
  const branchId = selectedRoom?.branch_id;
  const availableMenuItems = menuItems.filter((item) => item.branch_id === branchId);

  React.useEffect(() => {
    if (!branchId) {
      setSelectedMenuItems([]);
      return;
    }
    const availableIds = new Set(menuItems.filter((item) => item.branch_id === branchId).map((item) => item.id));
    setSelectedMenuItems((current) => {
      const next = current.filter((id) => availableIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [branchId, menuItems]);

  React.useEffect(() => {
    if (timeMode !== "custom" || !checkInDate || !checkInTime || !checkOutTime) {
      setCustomBlockedRoomIds(new Set());
      setCustomAvailabilityLoading(false);
      return;
    }

    let cancelled = false;
    async function loadCustomAvailability() {
      setCustomAvailabilityLoading(true);
      const results = await Promise.all(rooms.map(async (room) => {
        try {
          const response = await fetch(`/api/booking-availability?room_id=${room.id}`);
          if (!response.ok) return { roomId: room.id, blocked: false };
          const data = (await response.json()) as { bookedSlotIds?: string[] };
          const booked = new Set(data.bookedSlotIds ?? []);
          const touchedSlots = getTimeslotIdsOverlappingRange({
            roomId: room.id,
            roomName: room.card_name,
            startAt: makeLocalDateTime(checkInDate, checkInTime),
            endAt: makeLocalDateTime(checkOutDate, checkOutTime),
            timeSlots: room.time_slots,
          });
          const blocked = touchedSlots.some((slotId) => booked.has(slotId));
          return { roomId: room.id, blocked };
        } catch {
          return { roomId: room.id, blocked: false };
        }
      }));
      if (!cancelled) {
        const blockedIds = new Set(results.filter((result) => result.blocked).map((result) => result.roomId));
        setCustomBlockedRoomIds(blockedIds);
        setPresetSelections((current) => current.filter((selection) => !blockedIds.has(selection.roomId)));
        setCustomAvailabilityLoading(false);
      }
    }
    void loadCustomAvailability();
    return () => { cancelled = true; };
  }, [checkInDate, checkInTime, checkOutDate, checkOutTime, rooms, timeMode]);

  const selectedMenuItemsTotal = selectedMenuItems.reduce((sum, id) => {
    const item = availableMenuItems.find((menuItem) => menuItem.id === id);
    return sum + Number(item?.price ?? 0);
  }, 0);
  const selectedVoucher = discountCodes.find((item) => item.code === voucherCode);
  const discountPercent = discountMode === "voucher" ? Number(selectedVoucher?.percent ?? 0) : manualDiscountType === "percent" ? Math.min(Math.max(Number(manualDiscount) || 0, 0), 100) : 0;
  function getSlotPrice(room: RoomRow, slotIndex: number) {
    const slot = getRoomSlots(room.card_name, room.time_slots)[slotIndex];
    const customPrice = room.slot_prices?.[slotIndex];
    return typeof customPrice === "number" && customPrice > 0 ? customPrice : slot?.isOvernight ? room.full_day_price : room.price_from;
  }

  const presetRoomAmount = presetSelections.reduce((sum, selection) => {
    const room = rooms.find((item) => item.id === selection.roomId);
    return sum + (room ? getSlotPrice(room, selection.slotIndex) : 0);
  }, 0);
  const roomBaseAmount = timeMode === "preset" ? presetRoomAmount : Math.max(Number(amount) || 0, 0);
  function getDiscountAmountFor(baseAmount: number) {
    return discountMode === "manual" && manualDiscountType === "amount"
      ? Math.min(Math.max(Number(manualDiscount) || 0, 0), baseAmount)
      : Math.round(baseAmount * discountPercent / 100);
  }
  const discountAmount = getDiscountAmountFor(roomBaseAmount);
  const finalAmount = Math.max(roomBaseAmount - discountAmount, 0) + selectedMenuItemsTotal;
  const hasValidRange = Boolean(checkInDate && checkInTime && checkOutDate && checkOutTime &&
    `${checkOutDate}T${checkOutTime}` > `${checkInDate}T${checkInTime}`);

  function toggleCustomRoom(roomId: number) {
    if (customBlockedRoomIds.has(roomId)) return;
    const isSelected = presetSelections.some((selection) => selection.roomId === roomId);
    if (isSelected) {
      setPresetSelections((current) => current.filter((selection) => selection.roomId !== roomId));
      return;
    }
    setPresetSelections((current) => [
      ...current,
      {
        key: `${roomId}-${checkInDate}-custom`,
        roomId,
        dateIso: checkInDate,
        slotIndex: 0,
      },
    ]);
  }

  async function createPresetBookings(): Promise<{ ok: true } | { ok: false; error: string }> {
    if (timeMode === "custom") {
      const selectedRoomIds = [...new Set(presetSelections.map((selection) => selection.roomId))];

      for (const roomId of selectedRoomIds) {
        const room = rooms.find((item) => item.id === roomId);
        if (!room) continue;

        const bookingAmount = Math.max(Number(amount) || 0, 0);
        const bookingDiscountAmount = getDiscountAmountFor(bookingAmount);
        const result = await createBookingAdmin({
          roomId: room.id,
          branchId: room.branch_id,
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
          amount: bookingAmount,
          guestCount: Number(guestCount) || 1,
          notes,
          hasCar,
          hasDecoration,
          cccdFront,
          cccdBack,
          discountCode: discountMode === "voucher" ? voucherCode : null,
          discountPercent,
          discountAmount: bookingDiscountAmount,
          menuItemIds: selectedMenuItems.length > 0 ? selectedMenuItems : undefined,
        });
        if (!result.ok) return result;
      }

      return { ok: true };
    }

    for (const selection of presetSelections) {
      const room = rooms.find((item) => item.id === selection.roomId);
      const slot = room ? getRoomSlots(room.card_name, room.time_slots)[selection.slotIndex] : null;
      if (!room) continue;
      const bookingAmount = getSlotPrice(room, selection.slotIndex);
      const bookingDiscountAmount = getDiscountAmountFor(bookingAmount);
      if (!slot?.start || !slot.end) continue;
      const overnight = isOvernightRange(slot.start, slot.end);
      const result = await createBookingAdmin({
        roomId: room.id,
        branchId: room.branch_id,
        guestName,
        customerName,
        customerPhone,
        stayDate: selection.dateIso,
        timeRange: `${slot.start} - ${slot.end}`,
        checkInDate: selection.dateIso,
        checkInTime: slot.start,
        checkOutDate: addDaysToIso(selection.dateIso, overnight ? 1 : 0),
        checkOutTime: slot.end,
        channel,
        status,
        amount: bookingAmount,
        guestCount: Number(guestCount) || 1,
        notes,
        hasCar,
        hasDecoration,
        cccdFront,
        cccdBack,
        discountCode: discountMode === "voucher" ? voucherCode : null,
        discountPercent,
        discountAmount: bookingDiscountAmount,
        menuItemIds: selectedMenuItems.length > 0 ? selectedMenuItems : undefined,
      });
      if (!result.ok) return result;
    }

    return { ok: true };
  }

  async function handleCreate() {
    if (!guestName || presetSelections.length === 0) {
      setError("Vui lòng nhập tên khách và chọn ít nhất một phòng, ngày và khung giờ.");
      return;
    }
    if (timeMode === "custom" && !hasValidRange) {
      setError("Vui lòng kiểm tra khoảng thời gian tùy chỉnh.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await createPresetBookings();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/dashboard/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo booking.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full min-w-0">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thông tin booking</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Khoảng thời gian tùy chỉnh</p>
                <p className="text-xs text-muted-foreground">Admin không bị giới hạn bởi khung giờ mặc định.</p>
              </div>
              <Clock3 className="size-5 text-primary" />
            </div>
            <div className="mb-3 grid grid-cols-2 rounded-lg border bg-background p-1">
              <button type="button" onClick={() => { setTimeMode("preset"); setPresetSelections([]); }} className={`rounded-md px-3 py-2 text-sm font-semibold ${timeMode === "preset" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Khung giờ hiện có</button>
              <button type="button" onClick={() => { setTimeMode("custom"); setPresetSelections([]); }} className={`rounded-md px-3 py-2 text-sm font-semibold ${timeMode === "custom" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Khoảng thời gian tùy chỉnh</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu *</Label>
              <DatePicker value={checkInDate} minDate={today} onChange={(value) => { setCheckInDate(value); setPresetSelections([]); }} className="w-full" />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ bắt đầu *</Label>
                <Input type="time" value={checkInTime} disabled={timeMode === "preset"} onChange={(event) => setCheckInTime(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc *</Label>
              <DatePicker value={checkOutDate} minDate={checkInDate || today} onChange={(value) => { setCheckOutDate(value); setPresetSelections([]); }} className="w-full" />
              </div>
              <div className="space-y-1.5">
                <Label>Giờ kết thúc *</Label>
                <Input type="time" value={checkOutTime} disabled={timeMode === "preset"} onChange={(event) => setCheckOutTime(event.target.value)} />
              </div>
            </div>
            {timeMode === "custom" && <div className="mt-4 space-y-2">
              <Label>Phòng áp dụng *</Label>
              <div className="flex flex-wrap gap-2">
                {rooms.map((room) => {
                  const selected = presetSelections.some((selection) => selection.roomId === room.id);
                  const blocked = customBlockedRoomIds.has(room.id);
                  return <button key={room.id} type="button" disabled={blocked || customAvailabilityLoading} onClick={() => toggleCustomRoom(room.id)} title={blocked ? "Khoảng giờ này đã chạm vào khung giờ đang được đặt của phòng" : undefined} className={`rounded-md border px-3 py-2 text-left text-xs transition ${blocked ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-600 opacity-75" : selected ? "border-primary bg-primary/10 font-semibold text-primary" : "hover:border-primary/50"}`}>
                    <span className="block">{room.card_name}</span>
                    {blocked && <span className="mt-0.5 block text-[10px] font-normal">Đã bận trong khoảng này</span>}
                  </button>;
                })}
              </div>
              <p className="text-xs text-muted-foreground">{customAvailabilityLoading ? "Đang kiểm tra các khung giờ đã đặt..." : "Phòng có slot mặc định bị chồng giờ sẽ được khóa để tránh đặt trùng."}</p>
            </div>}
            <div className="mt-4 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
              <span className="font-semibold">{dateLabel(checkInDate)} {checkInTime}</span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-semibold">{dateLabel(checkOutDate)} {checkOutTime}</span>
            </div>
            {!hasValidRange && <p className="mt-2 text-xs text-destructive">Thời gian kết thúc phải sau thời gian bắt đầu.</p>}
          </div>

          {timeMode === "preset" && <div className="space-y-3 rounded-xl border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Chọn nhiều phòng và khung giờ</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bấm nhiều ô còn trống để tạo nhiều booking cho cùng một khách. Ô đã đặt sẽ không thể chọn.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {presetSelections.length} lựa chọn
              </span>
            </div>
            <AdminBookingCalendar
              mode={timeMode}
              rooms={rooms}
              dateRange={{ from: checkInDate, to: checkOutDate }}
              selected={presetSelections}
              onChange={(next) => {
                setPresetSelections(next);
              }}
            />
          </div>}

          <div className="flex flex-col gap-1.5"><Label>Tên khách *</Label><Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nguyễn Văn A" /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label>Tên trên CCCD</Label><Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
            <div className="flex flex-col gap-1.5"><Label>Số điện thoại</Label><Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0901..." /></div>
          </div>
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div><p className="font-semibold">Voucher / giảm giá</p><p className="mt-1 text-xs text-muted-foreground">Chọn mã có sẵn hoặc nhập mức giảm riêng cho booking này.</p></div>
            <div className="grid grid-cols-3 rounded-lg border bg-background p-1">
              <button type="button" onClick={() => setDiscountMode("none")} className={`rounded-md px-2 py-2 text-xs font-semibold ${discountMode === "none" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Không giảm</button>
              <button type="button" onClick={() => setDiscountMode("voucher")} className={`rounded-md px-2 py-2 text-xs font-semibold ${discountMode === "voucher" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Chọn voucher</button>
              <button type="button" onClick={() => setDiscountMode("manual")} className={`rounded-md px-2 py-2 text-xs font-semibold ${discountMode === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Giảm tùy thích</button>
            </div>
            {discountMode === "voucher" && <Select value={voucherCode} onValueChange={setVoucherCode}><SelectTrigger><SelectValue placeholder="Chọn voucher đang hoạt động" /></SelectTrigger><SelectContent>{discountCodes.filter((item) => item.active).map((item) => <SelectItem key={item.code} value={item.code}>{item.code} · Giảm {item.percent}%{item.description ? ` · ${item.description}` : ""}</SelectItem>)}</SelectContent></Select>}
            {discountMode === "manual" && <div className="grid gap-2 sm:grid-cols-[150px_1fr]"><Select value={manualDiscountType} onValueChange={(value) => setManualDiscountType(value as "percent" | "amount")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">Theo phần trăm (%)</SelectItem><SelectItem value="amount">Theo số tiền (đ)</SelectItem></SelectContent></Select><Input type="number" min={0} max={manualDiscountType === "percent" ? 100 : undefined} value={manualDiscount} onChange={(event) => setManualDiscount(event.target.value)} placeholder={manualDiscountType === "percent" ? "Ví dụ: 10" : "Ví dụ: 50000"} /></div>}
            {discountAmount > 0 && <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-background px-3 py-2 text-sm"><span className="text-muted-foreground">Giảm {discountMode === "voucher" ? voucherCode : "thủ công"}</span><span className="font-bold text-emerald-600">-{money(discountAmount)}đ</span></div>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label>Số khách</Label><Input type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} /></div>
            <div className="flex flex-col gap-1.5">
              <Label>Tiền phòng (đ)</Label>
              {timeMode === "preset" ? (
                <div className="flex h-10 items-center justify-between rounded-md border bg-muted/40 px-3 text-sm font-semibold">
                  <span>{money(presetRoomAmount)}đ</span>
                  <span className="text-xs font-normal text-muted-foreground">Tự tính theo khung giờ</span>
                </div>
              ) : (
                <Input type="text" inputMode="numeric" pattern="[0-9]*" value={amount} onChange={(e) => setAmount(normalizeWholeNumberInput(e.target.value))} placeholder="VD: 200000" />
              )}
              <p className="text-xs text-muted-foreground">{timeMode === "preset" ? "Giá được lấy theo từng phòng và khung giờ đã chọn." : "Admin tự nhập tiền phòng cho khoảng thời gian tùy chỉnh."}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label>Kênh đặt</Label><Select value={channel} onValueChange={setChannel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CHANNELS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex flex-col gap-1.5"><Label>Trạng thái</Label><Select value={status} onValueChange={(value) => setStatus(value as BookingStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
          </div>

          {branchId && <><Separator /><div className="flex flex-col gap-2"><Label className="text-base font-semibold">Menu Items (Tùy chọn)</Label><MenuItemsSelector items={availableMenuItems} selectedIds={selectedMenuItems} onSelectionChange={setSelectedMenuItems} /></div></>}
          <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Tiền phòng</span><span className="font-semibold">{money(roomBaseAmount)}đ</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-muted-foreground">Menu items</span><span className="font-medium">{money(selectedMenuItemsTotal)}đ</span></div>
            {discountAmount > 0 && <div className="mt-1 flex items-center justify-between"><span className="text-muted-foreground">Giảm giá</span><span className="font-medium text-emerald-600">-{money(discountAmount)}đ</span></div>}
            <div className="mt-2 flex items-center justify-between border-t pt-2"><span className="font-semibold">Tổng thanh toán</span><span className="text-base font-bold text-primary">{money(finalAmount)}đ</span></div>
          </div>
          <div className="flex flex-col gap-1.5"><Label>Ghi chú</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm"><input className="mt-1 accent-primary" type="checkbox" checked={hasCar} onChange={(event) => setHasCar(event.target.checked)} /><span><strong>Đến bằng xe hơi</strong><span className="mt-0.5 block text-xs text-muted-foreground">Để nhân viên hỗ trợ chỗ đỗ xe.</span></span></label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm"><input className="mt-1 accent-primary" type="checkbox" checked={hasDecoration} onChange={(event) => setHasDecoration(event.target.checked)} /><span><strong>Gói trang trí</strong><span className="mt-0.5 block text-xs text-muted-foreground">Nhân viên sẽ liên hệ tư vấn thêm.</span></span></label>
          </div>
          <div className="space-y-3 rounded-xl border p-4"><div className="flex items-start gap-2"><IdCard className="mt-0.5 size-5 text-primary" /><div><p className="font-semibold">Xác thực căn cước</p><p className="text-xs text-muted-foreground">Tải mặt trước và mặt sau CCCD của khách nếu cần lưu cùng booking.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><div><Label className="mb-2 block">CCCD mặt trước</Label><ImageUpload value={cccdFront ? [cccdFront] : []} onChange={(urls) => setCccdFront(urls[0] ?? null)} single /></div><div><Label className="mb-2 block">CCCD mặt sau</Label><ImageUpload value={cccdBack ? [cccdBack] : []} onChange={(urls) => setCccdBack(urls[0] ?? null)} single /></div></div></div>
          {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="flex gap-2 border-t pt-3"><Button variant="outline" asChild><Link href="/dashboard/bookings">Hủy</Link></Button><Button onClick={handleCreate} disabled={saving || !guestName || presetSelections.length === 0 || (timeMode === "custom" && !hasValidRange)}>{saving ? "Đang tạo..." : "Tạo booking"}</Button></div>
        </CardContent>
      </Card>

    </div>
  );
}
