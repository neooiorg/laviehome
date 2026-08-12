"use client";

import * as React from "react";
import { CalendarDays, Check, Clock3 } from "lucide-react";

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
};

export function AdminBookingCalendar({ rooms, dateRange, selected, onChange }: Props) {
  const dates = React.useMemo(() => makeBookingDatesFromRange(dateRange), [dateRange]);
  const [bookedSlotIds, setBookedSlotIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    let cancelled = false;
    async function loadAvailability() {
      const results = await Promise.all(rooms.map(async (room) => {
        try {
          const response = await fetch(`/api/booking-availability?room_id=${room.id}`);
          const data = (await response.json()) as { bookedSlotIds?: string[] };
          return data.bookedSlotIds ?? [];
        } catch {
          return [];
        }
      }));
      if (!cancelled) setBookedSlotIds(new Set(results.flat()));
    }
    void loadAvailability();
    return () => { cancelled = true; };
  }, [rooms]);

  function toggle(roomId: number, dateIso: string, slotIndex: number) {
    const key = `${roomId}-${dateIso}-${slotIndex}`;
    onChange(selected.some((item) => item.key === key)
      ? selected.filter((item) => item.key !== key)
      : [...selected, { key, roomId, dateIso, slotIndex }]);
  }

  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
        <div><p className="font-semibold">Chọn khung giờ còn trống</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Bấm vào ô màu xanh để chọn khung giờ cho booking.</p></div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground"><span><i className="mr-1 inline-block size-3 rounded bg-emerald-500" />Còn trống</span><span><i className="mr-1 inline-block size-3 rounded bg-rose-500" />Đã đặt</span><span><i className="mr-1 inline-block size-3 rounded bg-primary" />Đang chọn</span></div>
      <div className="space-y-4">
        {rooms.map((room) => {
          const slots = getRoomSlots(room.card_name, room.time_slots);
          return <section key={room.id} className="overflow-hidden rounded-lg border bg-background">
            <div className="border-b bg-muted/30 px-3 py-2"><p className="text-sm font-bold">{room.card_name}</p><p className="text-xs text-muted-foreground">{room.branch_name}</p></div>
            <div className="overflow-x-auto">
              <table className="min-w-[620px] w-full text-center text-xs"><thead><tr className="border-b text-muted-foreground"><th className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-semibold">Ngày</th>{slots.map((slot, index) => <th key={index} className="px-2 py-2 font-semibold"><span className="flex items-center justify-center gap-1"><Clock3 className="size-3" />{slot.label}</span><span className="text-[10px] font-normal">{slot.duration}</span></th>)}</tr></thead><tbody>{dates.map((date) => <tr key={date.iso} className="border-b last:border-0"><td className="sticky left-0 z-10 bg-background px-3 py-2 text-left font-semibold">{date.label} <span className="font-normal text-muted-foreground">{date.dateLabel}</span></td>{slots.map((slot, slotIndex) => { const id = `${room.id}-${date.iso}-${slotIndex}`; const booked = bookedSlotIds.has(id); const past = !booked && isSlotStartPast(date.iso, slot); const isSelected = selected.some((item) => item.key === id); return <td key={id} className="px-1 py-1"><button type="button" disabled={booked || past} onClick={() => toggle(room.id, date.iso, slotIndex)} className={`flex h-9 w-full min-w-24 items-center justify-center gap-1 rounded-md border px-2 text-[11px] font-bold transition ${booked || past ? "cursor-not-allowed border-rose-200 bg-rose-500 text-white/80" : isSelected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}>{isSelected ? <Check className="size-3.5" /> : booked || past ? "Đã đặt" : "Chọn"}</button></td>; })}</tr>)}</tbody></table>
            </div>
          </section>;
        })}
      </div>
      <p className="text-xs font-semibold text-muted-foreground">Đã chọn {selected.length} khung giờ ở {new Set(selected.map((item) => item.roomId)).size} phòng.</p>
    </div>
  );
}
