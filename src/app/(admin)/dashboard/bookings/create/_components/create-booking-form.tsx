"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createBookingAdmin } from "@/lib/booking-actions";
import { type BookingStatus, type BranchRow, type RoomRow } from "@/lib/homestay-dashboard";
import { getMenuItemsByBranch, type MenuItem } from "@/lib/menu-actions";

import { MenuItemsSelector } from "../../_components/menu-items-selector";

const CHANNELS = ["Admin", "Walk-in", "Phone", "Facebook", "Zalo", "Booking.com", "Agoda", "Khác"];
const STATUSES: BookingStatus[] = ["Chờ thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];

function money(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function normalizeWholeNumberInput(value: string) {
  return value.replace(/\D/g, "");
}

export function CreateBookingForm({ rooms, branches }: { rooms: RoomRow[]; branches: BranchRow[] }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [roomId, setRoomId] = React.useState("");
  const [guestName, setGuestName] = React.useState("");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [stayDate, setStayDate] = React.useState("");
  const [timeRange, setTimeRange] = React.useState("");
  const [channel, setChannel] = React.useState("Admin");
  const [status, setStatus] = React.useState<BookingStatus>("Đã xác nhận");
  const [amount, setAmount] = React.useState("");
  const [guestCount, setGuestCount] = React.useState("2");
  const [notes, setNotes] = React.useState("");
  const [selectedMenuItems, setSelectedMenuItems] = React.useState<number[]>([]);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [loadingMenuItems, setLoadingMenuItems] = React.useState(false);

  const selectedRoom = rooms.find((room) => room.id === Number(roomId));
  const branchId = selectedRoom?.branch_id;
  const branchName = selectedRoom
    ? branches.find((branch) => branch.id === selectedRoom.branch_id)?.name ?? selectedRoom.branch_name
    : "";
  const selectedMenuItemsTotal = selectedMenuItems.reduce((sum, id) => {
    const item = menuItems.find((menuItem) => menuItem.id === id);
    return sum + Number(item?.price ?? 0);
  }, 0);
  const totalAmount = (Number(amount) || 0) + selectedMenuItemsTotal;

  React.useEffect(() => {
    if (branchId) {
      setLoadingMenuItems(true);
      getMenuItemsByBranch(branchId)
        .then(setMenuItems)
        .finally(() => setLoadingMenuItems(false));
    } else {
      setMenuItems([]);
      setSelectedMenuItems([]);
    }
  }, [branchId]);

  async function handleCreate() {
    if (!roomId || !guestName || !stayDate || !branchId) return;

    setSaving(true);
    setError("");

    try {
      await createBookingAdmin({
        roomId: Number(roomId),
        branchId,
        guestName,
        customerName,
        customerPhone,
        stayDate,
        timeRange,
        channel,
        status,
        amount: Number(amount) || 0,
        guestCount: Number(guestCount) || 1,
        notes,
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
    <Card className="max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Thông tin booking</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Phòng *</Label>
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn phòng..." />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={String(room.id)}>
                  {room.card_name} - {room.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {branchName && <p className="text-xs text-muted-foreground">Chi nhánh: {branchName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Ngày ở *</Label>
            <DatePicker value={stayDate} onChange={setStayDate} className="w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Khung giờ</Label>
            <Input value={timeRange} onChange={(e) => setTimeRange(e.target.value)} placeholder="VD: 14:00-22:00" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Tên khách *</Label>
          <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nguyễn Văn A" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Tên trên CCCD</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Số điện thoại</Label>
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0901..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Số khách</Label>
            <Input type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tiền phòng (đ)</Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => setAmount(normalizeWholeNumberInput(e.target.value))}
              placeholder="VD: 200000"
            />
            <p className="text-xs text-muted-foreground">
              Chỉ nhập tiền phòng. Menu items sẽ được cộng riêng vào tổng thanh toán.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Kênh đặt</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Trạng thái</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as BookingStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {branchId && menuItems.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <Label className="text-base font-semibold">Menu Items (Tùy chọn)</Label>
              {loadingMenuItems ? (
                <div className="text-sm text-muted-foreground">Đang tải menu items...</div>
              ) : (
                <>
                  <MenuItemsSelector
                    items={menuItems}
                    selectedIds={selectedMenuItems}
                    onSelectionChange={setSelectedMenuItems}
                  />
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Menu items</span>
                      <span className="font-medium">{money(selectedMenuItemsTotal)}đ</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Tổng thanh toán tạm tính</span>
                      <span className="font-semibold">{money(totalAmount)}đ</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Ghi chú</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex gap-2 border-t pt-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/bookings">Hủy</Link>
          </Button>
          <Button onClick={handleCreate} disabled={saving || !roomId || !guestName || !stayDate}>
            {saving ? "Đang tạo..." : "Tạo booking"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
