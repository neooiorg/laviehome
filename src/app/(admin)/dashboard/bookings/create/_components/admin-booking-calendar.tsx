"use client";

import * as React from "react";
import { CalendarDays, Check, Clock3, Loader2 } from "lucide-react";

import { getRoomSlots, isSlotStartPast, makeBookingDatesFromRange, type BookingDateRange } from "@/lib/booking-slots";
import type { RoomRow } from "@/lib/homestay-dashboard";

export type AdminPresetSelection = {
  key: string;
  roomId: number;
  dateIso: string;
  slotIndex: number;
};

type Props = {
  rooms: RoomRow[];
  dateRange: BookingDateRange;
  selected: AdminPresetSelection[];
  onChange: (selection: AdminPresetSelection[]) => void;
  mode?: "preset" | "custom";
};

type RoomColumn = {
  room: RoomRow;
  slotIndex: number;
  slot: ReturnType<typeof getRoomSlots>[number];
};

export function AdminBookingCalendar({ rooms, dateRange, selected, onChange, mode = "preset" }: Props) {
  const dates = React.useMemo(() => makeBookingDatesFromRange(dateRange), [dateRange]);
  const columns = React.useMemo<RoomColumn[]>(
    () => rooms.flatMap((room) => getRoomSlots(room.card_name, room.time_slots).map((slot, slotIndex) => ({ room, slotIndex, slot }))),
    [rooms],
  );
  const [bookedSlotIds, setBookedSlotIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function loadAvailability() {
      setLoading(true);
      const results = await Promise.all(rooms.map(async (room) => {
        try {
          const response = await fetch(`/api/booking-availability?room_id=${room.id}`);
          if (!response.ok) return [];
          const data = (await response.json()) as { bookedSlotIds?: string[] };
          return data.bookedSlotIds ?? [];
        } catch {
          return [];
        }
      }));
      if (!cancelled) {
        setBookedSlotIds(new Set(results.flat()));
        setLoading(false);
      }
    }
    void loadAvailability();
    return () => { cancelled = true; };
  }, [rooms]);

  function toggle(roomId: number, dateIso: string, slotIndex: number) {
    const key = `${roomId}-${dateIso}-${slotIndex}`;
    const selectedInDay = selected.some((item) => item.roomId === roomId && item.dateIso === dateIso);
    onChange(selectedInDay
      ? selected.filter((item) => mode === "custom" ? !(item.roomId === roomId && item.dateIso === dateIso) : item.key !== key)
      : [...selected, { key, roomId, dateIso, slotIndex }]);
  }

  const selectedDays = new Set(selected.map((item) => `${item.roomId}-${item.dateIso}`)).size;
  const selectedRooms = new Set(selected.map((item) => item.roomId)).size;

  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">Lịch phòng</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {mode === "custom" ? "Chọn phòng và ngày áp dụng khoảng giờ tùy chỉnh." : "Chọn nhiều khung giờ còn trống cho cùng một khách."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          {loading && <><Loader2 className="size-3.5 animate-spin" /> Đang tải lịch</>}
          {!loading && `${selectedDays} ngày · ${selectedRooms} phòng`}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
        <span><i className="mr-1 inline-block size-3 rounded bg-emerald-500" />Còn trống</span>
        <span><i className="mr-1 inline-block size-3 rounded bg-rose-500" />Đã đặt / đã qua</span>
        <span><i className="mr-1 inline-block size-3 rounded bg-amber-400" />Đang chọn</span>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">Chưa có phòng để hiển thị lịch.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-background shadow-sm">
          <table className="min-w-max text-center text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                <th colSpan={2} className="sticky left-0 z-20 min-w-[7.5rem] border-r bg-muted/60 px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Ngày</th>
                {rooms.map((room) => (
                  <th key={room.id} colSpan={getRoomSlots(room.card_name, room.time_slots).length} className="border-r px-2 py-2 text-center text-sm font-bold last:border-r-0">
                    <span className="block max-w-[15rem] truncate">{room.card_name.replace(/^Phòng\s+/i, "")}</span>
                    <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">{room.branch_name}</span>
                  </th>
                ))}
              </tr>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="sticky left-0 z-20 min-w-[3.5rem] border-r bg-muted/30 px-2 py-1.5 text-[10px] font-bold">Thứ</th>
                <th className="sticky left-[3.5rem] z-20 min-w-[4rem] border-r bg-muted/30 px-2 py-1.5 text-[10px] font-bold">Ngày</th>
                {columns.map(({ room, slotIndex, slot }) => (
                  <th key={`${room.id}-slot-head-${slotIndex}`} className="min-w-[5.5rem] border-r px-1 py-1.5 last:border-r-0">
                    <span className="flex items-center justify-center gap-1 text-[10px] font-semibold text-foreground"><Clock3 className="size-3" />{slot.label}</span>
                    <span className="text-[10px] font-normal">{slot.duration}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => (
                <tr key={date.iso} className="border-b last:border-0 hover:bg-muted/20">
                  <td className={`sticky left-0 z-10 min-w-[3.5rem] border-r bg-background px-2 py-2 text-center font-semibold ${date.label === "Hôm nay" ? "text-primary" : ""}`}>{date.label}</td>
                  <td className={`sticky left-[3.5rem] z-10 min-w-[4rem] border-r bg-background px-2 py-2 text-center font-semibold ${date.label === "Hôm nay" ? "text-primary" : ""}`}>{date.dateLabel}</td>
                  {columns.map(({ room, slotIndex, slot }) => {
                    const id = `${room.id}-${date.iso}-${slotIndex}`;
                    const booked = bookedSlotIds.has(id);
                    const past = !booked && isSlotStartPast(date.iso, slot);
                    const isSelected = mode === "custom"
                      ? selected.some((item) => item.roomId === room.id && item.dateIso === date.iso)
                      : selected.some((item) => item.key === id);
                    const unavailable = booked || past;
                    return (
                      <td key={id} className="border-r px-1 py-1 last:border-r-0">
                        <button
                          type="button"
                          disabled={unavailable}
                          onClick={() => toggle(room.id, date.iso, slotIndex)}
                          title={booked ? "Đã được đặt, không thể chọn" : past ? "Khung giờ đã qua" : `Chọn ${slot.label}`}
                          className={`mx-auto flex h-8 w-full min-w-[4.75rem] items-center justify-center gap-1 rounded-md border px-2 text-[10px] font-bold transition sm:h-9 sm:text-[11px] ${unavailable ? "cursor-not-allowed border-rose-200 bg-rose-500 text-white/90" : isSelected ? "border-amber-300 bg-amber-400 text-amber-950 shadow-sm hover:bg-amber-300" : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}
                        >
                          {isSelected ? <Check className="size-3.5" /> : unavailable ? "Đã đặt" : "Chọn"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs font-semibold text-muted-foreground">
        Đã chọn {mode === "custom" ? selectedDays : selected.length} {mode === "custom" ? "lượt phòng/ngày" : "khung giờ"} ở {selectedRooms} phòng.
      </p>
    </div>
  );
}
