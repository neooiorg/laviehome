"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { type BookingStatus, type BranchRow, type RoomRow } from "@/lib/homestay-dashboard";
import { createBookingAdmin } from "@/lib/booking-actions";

const CHANNELS = ["Admin", "Walk-in", "Phone", "Facebook", "Zalo", "Booking.com", "Agoda", "Khác"];
const STATUSES: BookingStatus[] = ["Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];

export function CreateBookingSheet({
  open, onClose, branches, rooms
}: {
  open: boolean;
  onClose: () => void;
  branches: BranchRow[];
  rooms: RoomRow[];
}) {
  const [saving, setSaving] = React.useState(false);
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

  const selectedRoom = rooms.find((r) => r.id === Number(roomId));
  const branchId = selectedRoom?.branch_id;
  const branchName = selectedRoom ? branches.find((b) => b.id === selectedRoom.branch_id)?.name ?? selectedRoom.branch_name : "";

  function reset() {
    setRoomId(""); setGuestName(""); setCustomerName(""); setCustomerPhone("");
    setStayDate(""); setTimeRange(""); setChannel("Admin"); setStatus("Đã xác nhận");
    setAmount(""); setGuestCount("2"); setNotes("");
  }

  async function handleCreate() {
    if (!roomId || !guestName || !stayDate || !branchId) return;
    setSaving(true);
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
    });
    setSaving(false);
    reset();
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tạo đặt phòng</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-1.5">
            <Label>Phòng *</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger><SelectValue placeholder="Chọn phòng..." /></SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.card_name} — {r.branch_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {branchName && (
            <p className="text-xs text-muted-foreground">Chi nhánh: {branchName}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Ngày ở *</Label>
              <Input type="date" value={stayDate} onChange={(e) => setStayDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Khung giờ</Label>
              <Input value={timeRange} onChange={(e) => setTimeRange(e.target.value)} placeholder="VD: 14:00–22:00" />
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
              <Label>Số tiền (đ)</Label>
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Kênh đặt</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Trạng thái</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Ghi chú</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="flex gap-2 border-t pt-3">
            <Button variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>Hủy</Button>
            <Button className="flex-1" onClick={handleCreate} disabled={saving || !roomId || !guestName || !stayDate}>
              {saving ? "Đang tạo..." : "Tạo booking"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
