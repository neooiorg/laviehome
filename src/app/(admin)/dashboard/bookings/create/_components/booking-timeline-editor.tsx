"use client";

import * as React from "react";
import { CalendarDays, Check, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";

import {
  createRoomAvailabilitySlot,
  deleteRoomAvailabilitySlot,
  getRoomTimeline,
  mergeRoomAvailabilitySlots,
  updateRoomAvailabilitySlot,
  type AvailabilitySlotStatus,
  type RoomAvailabilitySlot,
  type RoomTimeline,
} from "@/lib/room-availability-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

type Props = {
  roomId?: number;
  fromDate: string;
  toDate: string;
};

const STATUS_LABELS: Record<AvailabilitySlotStatus, string> = {
  available: "Còn trống",
  blocked: "Tạm khóa",
  custom: "Khung linh động",
};

function inputDate(value: string) {
  return value.slice(0, 10);
}

function inputTime(value: string) {
  return value.slice(11, 16);
}

function timestamp(date: string, time: string) {
  return `${date} ${time}:00`;
}

function formatTimestamp(value: string | null) {
  if (!value) return "Chưa cấu hình";
  return `${value.slice(8, 10)}/${value.slice(5, 7)} ${value.slice(11, 16)}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function statusClass(status: AvailabilitySlotStatus) {
  if (status === "blocked") return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200";
  if (status === "custom") return "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200";
  return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200";
}

function EditableSlot({ slot, roomId, selected, onToggle, onChanged }: { slot: RoomAvailabilitySlot; roomId: number; selected: boolean; onToggle: () => void; onChanged: () => void }) {
  const [editing, setEditing] = React.useState(false);
  const [fromDate, setFromDate] = React.useState(inputDate(slot.start_at));
  const [fromTime, setFromTime] = React.useState(inputTime(slot.start_at));
  const [toDate, setToDate] = React.useState(inputDate(slot.end_at));
  const [toTime, setToTime] = React.useState(inputTime(slot.end_at));
  const [status, setStatus] = React.useState<AvailabilitySlotStatus>(slot.status);
  const [price, setPrice] = React.useState(String(slot.price));
  const [visible, setVisible] = React.useState(slot.customer_visible);
  const [busy, startTransition] = React.useTransition();

  function save() {
    startTransition(async () => {
      await updateRoomAvailabilitySlot({
        id: slot.id,
        roomId,
        startAt: timestamp(fromDate, fromTime),
        endAt: timestamp(toDate, toTime),
        status,
        price: Number(price) || 0,
        customerVisible: visible,
        label: slot.label ?? undefined,
      });
      setEditing(false);
      onChanged();
    });
  }

  function remove() {
    if (!window.confirm("Xóa available slot này?")) return;
    startTransition(async () => {
      await deleteRoomAvailabilitySlot(slot.id, roomId);
      onChanged();
    });
  }

  return (
    <div className={`rounded-lg border p-3 text-xs ${statusClass(status)}`}>
      {editing ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <DatePicker value={fromDate} onChange={setFromDate} className="w-full" />
          <Input type="time" value={fromTime} onChange={(event) => setFromTime(event.target.value)} />
          <DatePicker value={toDate} onChange={setToDate} className="w-full" />
          <Input type="time" value={toTime} onChange={(event) => setToTime(event.target.value)} />
          <Select value={status} onValueChange={(value) => setStatus(value as AvailabilitySlotStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" min={0} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Giá riêng" />
          <label className="flex items-center gap-2"><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} /> Cho khách đặt</label>
          <div className="flex gap-2 sm:col-span-2"><Button size="sm" onClick={save} disabled={busy}><Check className="mr-1 size-3.5" />Lưu</Button><Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={busy}><X className="mr-1 size-3.5" />Hủy</Button></div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <input type="checkbox" checked={selected} onChange={onToggle} aria-label="Chọn slot để gộp" />
          <span className="font-bold">{formatTimestamp(slot.start_at)} → {formatTimestamp(slot.end_at)}</span>
          <span>{STATUS_LABELS[status]}</span>
          <span>{slot.price.toLocaleString("vi-VN")}đ</span>
          <span>{visible ? "Khách thấy" : "Ẩn"}</span>
          <div className="ml-auto flex gap-1"><Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={busy}><Pencil className="size-3.5" /></Button><Button size="sm" variant="ghost" onClick={remove} disabled={busy}><Trash2 className="size-3.5" /></Button></div>
        </div>
      )}
    </div>
  );
}

export function BookingTimelineEditor({ roomId, fromDate, toDate }: Props) {
  const [timeline, setTimeline] = React.useState<RoomTimeline | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [newFromDate, setNewFromDate] = React.useState(fromDate);
  const [newFromTime, setNewFromTime] = React.useState("09:00");
  const [newToDate, setNewToDate] = React.useState(toDate);
  const [newToTime, setNewToTime] = React.useState("12:00");
  const [newStatus, setNewStatus] = React.useState<AvailabilitySlotStatus>("available");
  const [newPrice, setNewPrice] = React.useState("0");
  const [newVisible, setNewVisible] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedSlotIds, setSelectedSlotIds] = React.useState<number[]>([]);
  const [busy, startTransition] = React.useTransition();

  const load = React.useCallback(async () => {
    if (!roomId || !fromDate || !toDate) {
      setTimeline(null);
      return;
    }
    setLoading(true);
    try {
      setTimeline(await getRoomTimeline(roomId, timestamp(fromDate, "00:00"), timestamp(toDate, "23:59")));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải timeline.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, roomId, toDate]);

  React.useEffect(() => { void load(); }, [load]);

  const freeSlots = timeline?.slots.filter((slot) => slot.status === "available") ?? [];
  const freeBounds = freeSlots.length > 0
    ? { earliest: formatTimestamp(freeSlots[0].start_at), latest: formatTimestamp(freeSlots[freeSlots.length - 1].end_at) }
    : null;

  function applyFreeSlot(slot: RoomAvailabilitySlot) {
    setNewFromDate(inputDate(slot.start_at));
    setNewFromTime(inputTime(slot.start_at));
    setNewToDate(inputDate(slot.end_at));
    setNewToTime(inputTime(slot.end_at));
  }

  function createSlot() {
    if (!roomId) return;
    setError("");
    startTransition(async () => {
      try {
        await createRoomAvailabilitySlot({
          roomId,
          startAt: timestamp(newFromDate, newFromTime),
          endAt: timestamp(newToDate, newToTime),
          status: newStatus,
          price: Number(newPrice) || 0,
          customerVisible: newVisible,
        });
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tạo slot.");
      }
    });
  }

  function mergeSlots() {
    if (!roomId) return;
    setError("");
    startTransition(async () => {
      try {
        await mergeRoomAvailabilitySlots(roomId, selectedSlotIds);
        setSelectedSlotIds([]);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể gộp slot.");
      }
    });
  }

  if (!roomId) return <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Chọn phòng để xem timeline và available slot.</div>;

  return (
    <CardSection title="Khoảng thời gian còn trống trong ngày hoặc các ngày" loading={loading} onRefresh={() => void load()}>
      <div className="mb-4 flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
        <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
        <div><p className="text-sm font-semibold">Đang xem từ {formatDate(fromDate)} đến {formatDate(toDate)}</p><p className="mt-0.5 text-xs text-muted-foreground">Màu đỏ là đã có khách. Màu xanh là giờ có thể bán. Bấm biểu tượng bút để chỉnh giờ hoặc giá.</p></div>
      </div>
      {error && <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
      {timeline && <div className="space-y-2">
        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground"><span>{formatDate(fromDate)} · 00:00</span><span>{formatDate(toDate)} · 23:59</span></div>
          <div className="relative h-10 overflow-hidden rounded-md bg-muted">
            {timeline.bookings.map((booking) => <TimelineBlock key={`booking-${booking.id}`} startAt={booking.start_at} endAt={booking.end_at} fromDate={fromDate} toDate={toDate} label="Đã có khách" className="bg-red-500" />)}
            {timeline.slots.map((slot) => <TimelineBlock key={`slot-${slot.id}`} startAt={slot.start_at} endAt={slot.end_at} fromDate={fromDate} toDate={toDate} label={STATUS_LABELS[slot.status]} className={slot.status === "blocked" ? "bg-amber-500" : slot.status === "custom" ? "bg-violet-500" : "bg-emerald-500"} />)}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground"><span><i className="mr-1 inline-block size-2 rounded-full bg-red-500" />Đã có khách</span><span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />Còn trống</span><span><i className="mr-1 inline-block size-2 rounded-full bg-amber-500" />Tạm khóa</span><span><i className="mr-1 inline-block size-2 rounded-full bg-violet-500" />Khung linh động</span></div>
        </div>
        {selectedSlotIds.length > 1 && <Button size="sm" variant="outline" onClick={mergeSlots} disabled={busy}><Check className="mr-1 size-3.5" />Gộp {selectedSlotIds.length} slot liền nhau</Button>}
        {timeline.slots.map((slot) => <EditableSlot key={slot.id} slot={slot} roomId={roomId} selected={selectedSlotIds.includes(slot.id)} onToggle={() => setSelectedSlotIds((current) => current.includes(slot.id) ? current.filter((id) => id !== slot.id) : [...current, slot.id])} onChanged={() => void load()} />)}
        {!timeline.bookings.length && !timeline.slots.length && <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Chưa có booking hoặc available slot trong khoảng này.</div>}
      </div>}
      <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="mb-3"><p className="text-sm font-semibold">Bạn có muốn tạo khung thời gian linh động cho giờ còn sót lại không?</p><p className="mt-1 text-xs text-muted-foreground">Chọn ngày, giờ bắt đầu và giờ kết thúc bên dưới nếu muốn mở phần thời gian này cho khách đặt.</p></div>
        {freeSlots.length > 0 ? <div className="mb-3 rounded-lg border bg-background p-3"><p className="mb-2 text-xs font-semibold text-muted-foreground">Khoảng còn trống hiện tại, dùng làm mốc nhập:</p><p className="mb-2 text-[11px] text-muted-foreground">Mốc sớm nhất: <strong>{freeBounds?.earliest}</strong> · Mốc muộn nhất: <strong>{freeBounds?.latest}</strong></p><div className="space-y-2">{freeSlots.map((slot) => <button key={slot.id} type="button" onClick={() => applyFreeSlot(slot)} className="flex w-full items-center justify-between rounded-md border border-emerald-200 px-3 py-2 text-left text-xs transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:hover:bg-emerald-950/30"><span><strong>{formatTimestamp(slot.start_at)} → {formatTimestamp(slot.end_at)}</strong><span className="ml-2 text-muted-foreground">{slot.price.toLocaleString("vi-VN")}đ</span></span><span className="font-semibold text-emerald-700 dark:text-emerald-300">Dùng khoảng này</span></button>)}</div></div> : <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">Hiện chưa có khoảng trống được tách tự động trong ngày này. Bạn vẫn có thể nhập khoảng giờ thủ công, hệ thống sẽ kiểm tra trùng lịch.</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          <DatePicker value={newFromDate} onChange={setNewFromDate} className="w-full" />
          <Input type="time" value={newFromTime} onChange={(event) => setNewFromTime(event.target.value)} />
          <DatePicker value={newToDate} onChange={setNewToDate} className="w-full" />
          <Input type="time" value={newToTime} onChange={(event) => setNewToTime(event.target.value)} />
          <Select value={newStatus} onValueChange={(value) => setNewStatus(value as AvailabilitySlotStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(STATUS_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
          <Input type="number" min={0} value={newPrice} onChange={(event) => setNewPrice(event.target.value)} placeholder="Giá riêng" />
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={newVisible} onChange={(event) => setNewVisible(event.target.checked)} /> Cho khách đặt</label>
          <Button size="sm" onClick={createSlot} disabled={busy}><Plus className="mr-1 size-3.5" />Tạo khung giờ linh động</Button>
        </div>
      </div>
    </CardSection>
  );
}

function TimelineBlock({ startAt, endAt, fromDate, toDate, label, className }: { startAt: string | null; endAt: string | null; fromDate: string; toDate: string; label: string; className: string }) {
  if (!startAt || !endAt) return null;
  const rangeStart = new Date(`${fromDate}T00:00:00`).getTime();
  const rangeEnd = new Date(`${toDate}T23:59:59`).getTime();
  const start = Math.max(rangeStart, new Date(startAt.replace(" ", "T")).getTime());
  const end = Math.min(rangeEnd, new Date(endAt.replace(" ", "T")).getTime());
  if (end <= start || rangeEnd <= rangeStart) return null;
  const left = ((start - rangeStart) / (rangeEnd - rangeStart)) * 100;
  const width = ((end - start) / (rangeEnd - rangeStart)) * 100;
  return <div className={`absolute top-1 h-8 min-w-1 rounded-sm px-1 text-[9px] font-bold leading-8 text-white ${className}`} style={{ left: `${left}%`, width: `${width}%` }} title={label}>{width > 8 ? label : ""}</div>;
}

function CardSection({ title, loading, onRefresh, children }: { title: string; loading: boolean; onRefresh: () => void; children: React.ReactNode }) {
  return <div className="rounded-xl border p-4"><div className="mb-3 flex items-center justify-between gap-2"><p className="text-sm font-semibold">{title}</p><Button size="sm" variant="ghost" onClick={onRefresh} disabled={loading}>{loading ? <RefreshCw className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}</Button></div>{children}</div>;
}
