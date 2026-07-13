"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, Sparkles } from "lucide-react";
import { money } from "@/lib/format";
import { RoomMenuOptions } from "./_components/room-menu-options";
import type { MenuItem } from "@/lib/menu-actions";

type BookingRoom = {
  id: number;
  branch_id: number;
  card_name: string;
  branch_name: string;
  price_from: number;
  full_day_price: number;
};

type SelectedSlot = {
  id: string;
  date: string;
  dateIso: string;
  time: string;
  price: number;
  position: number;
};

const roomSlots: Record<string, { label: string; duration: string; isOvernight?: boolean }[]> = {
  Honey: [
    { label: "9:00 - 12:00", duration: "3T" },
    { label: "12:30 - 15:30", duration: "3T" },
    { label: "16:00 - 19:00", duration: "3T" },
    { label: "19:30 - 8:20", duration: "12T 50", isOvernight: true },
  ],
  Squid: [
    { label: "9:30 - 12:30", duration: "3T" },
    { label: "13:00 - 16:00", duration: "3T" },
    { label: "16:30 - 19:30", duration: "3T" },
    { label: "20:00 - 8:50", duration: "12T 50", isOvernight: true },
  ],
  default: [
    { label: "9:00 - 12:00", duration: "3T" },
    { label: "12:30 - 15:30", duration: "3T" },
    { label: "16:00 - 19:00", duration: "3T" },
    { label: "19:30 - 8:20", duration: "12T 50", isOvernight: true },
  ],
};

function getRoomSlots(roomName: string) {
  if (roomName.includes("Honey")) return roomSlots.Honey;
  if (roomName.includes("Squid")) return roomSlots.Squid;
  return roomSlots.default;
}

function makeDates() {
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return Array.from({ length: 9 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return {
      iso: date.toISOString().slice(0, 10),
      label: index === 0 ? "Hôm nay" : weekdays[date.getDay()],
      dateLabel: `${day}-${month}`,
    };
  });
}

function isSlotPast(dayIndex: number, slotLabel: string): boolean {
  if (dayIndex !== 0) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startTime = slotLabel.split(" - ")[0];
  if (!startTime) return false;
  const [h, m] = startTime.split(":").map(Number);
  const slotStart = h * 60 + (m || 0);
  return nowMinutes > slotStart;
}

function isSlotBooked(roomName: string, dayIndex: number, slotIndex: number) {
  if (roomName.includes("Honey") && dayIndex === 0 && (slotIndex === 0 || slotIndex === 1)) return true;
  if (roomName.includes("Squid") && dayIndex === 0 && slotIndex <= 2) return true;
  if (roomName.includes("Squid") && dayIndex === 1 && (slotIndex === 1 || slotIndex === 2)) return true;
  const hash = roomName.charCodeAt(roomName.length - 1) + dayIndex * 5 + slotIndex * 13;
  return hash % 9 === 0;
}

function isSlotPromo(dayIndex: number) {
  return dayIndex >= 1 && dayIndex <= 5;
}

function formatCheckoutDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function RoomBooking({ room }: { room: BookingRoom }) {
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItem[]>([]);
  const [menuTotal, setMenuTotal] = useState(0);
  const dates = useMemo(() => makeDates(), []);
  const slots = useMemo(() => getRoomSlots(room.card_name), [room.card_name]);

  const subtotal = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
  const discountRate = selectedSlots.length === 2 ? 0.05 : selectedSlots.length >= 3 ? 0.1 : 0;
  const extraMinutes = selectedSlots.length === 2 ? 30 : selectedSlots.length >= 3 ? 60 : 0;
  const comboTotal = Math.max(subtotal - subtotal * discountRate, 0);

  function toggleSlot(slot: SelectedSlot) {
    setSelectedSlots((current) => {
      if (current.some((item) => item.id === slot.id)) {
        return current.filter((item) => item.id !== slot.id);
      }
      if (current.length >= 4) return current;
      if (current.length > 0) {
        // Only allow selecting sequential slots on the same day.
        const sameDay = current.every((item) => item.dateIso === slot.dateIso);
        const nextPositions = [...current.map((item) => item.position), slot.position].sort((a, b) => a - b);
        const sequential = nextPositions.every(
          (position, index) => index === 0 || position - nextPositions[index - 1] === 1
        );
        if (!sameDay || !sequential) return [slot];
      }
      return [...current, slot].sort((a, b) => a.position - b.position);
    });
  }

  function goToCheckout() {
    if (!selectedSlots.length) return;
    const first = selectedSlots[0];
    const totalWithMenu = comboTotal + menuTotal;
    const payload = {
      timeslot_ids: selectedSlots.map((slot) => slot.id).join(","),
      room_name: room.card_name,
      branch_name: room.branch_name,
      branch_id: String(room.branch_id),
      date: formatCheckoutDate(first.dateIso),
      time_range: selectedSlots.map((slot) => slot.time).join(", "),
      price: totalWithMenu,
      menu_item_ids: selectedMenuItems.map((item) => item.id).join(","),
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const params = new URLSearchParams({
      data: encoded,
      timeslot_ids: payload.timeslot_ids,
      room_name: payload.room_name,
      branch_name: payload.branch_name,
      branch_id: payload.branch_id,
      date: payload.date,
      time_range: payload.time_range,
      price: String(payload.price),
      menu_item_ids: payload.menu_item_ids,
    });
    window.location.href = `/checkout/?${params.toString()}`;
  }

  const summary = selectedSlots[0];

  return (
    <section id="booking" className="scroll-mt-28 mt-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <h2 className="text-2xl md:text-3xl font-black tracking-[-0.02em] text-white">Chọn khung giờ & đặt ngay</h2>
        <p className="mt-2 text-pink-300 font-bold text-sm uppercase tracking-wider">
          {room.card_name} — {room.branch_name}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mb-6 text-xs font-bold text-white/85">
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-rose-500" /> Đã đặt</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-md border-2 border-rose-500 bg-white/5" /> Còn trống</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-yellow-400" /> Đang chọn</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-white/5 ring-1 ring-pink-500/50" /> Khuyến mãi</div>
      </div>

      <div className="glass-panel booking-panel rounded-3xl overflow-hidden border border-white/10 bg-white/2">
        <div className="overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-y hide-scrollbar">
          <table className="min-w-max w-full text-center">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="sticky left-0 z-20 bg-[#1f1428] px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-pink-200 border-r border-white/10">
                  Ngày
                </th>
                {slots.map((slot, i) => (
                  <th key={i} className="px-3 py-2.5 border-r border-white/10 text-[11px] font-bold text-white/80 min-w-[104px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-white/95 tracking-tight">{slot.label}</span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-white/40">
                        {slot.isOvernight && <span className="text-pink-300">🌙</span>}
                        {slot.duration}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dates.map((date, dayIndex) => (
                <tr key={date.iso} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="sticky left-0 z-10 bg-[#1b1023] px-3 py-2 text-center border-r border-white/10 font-bold text-xs text-white/80 whitespace-nowrap">
                    <span className={date.label === "Hôm nay" ? "text-pink-400 font-extrabold" : ""}>
                      {date.label} <span className="text-white/50">{date.dateLabel}</span>
                    </span>
                  </td>
                  {slots.map((slot, slotIndex) => {
                    const id = `${room.id}-${date.iso}-${slotIndex}`;
                    const booked = isSlotBooked(room.card_name, dayIndex, slotIndex);
                    const past = !booked && isSlotPast(dayIndex, slot.label);
                    const selected = selectedSlots.some((item) => item.id === id);
                    const promo = isSlotPromo(dayIndex);
                    const price = slot.isOvernight ? room.full_day_price : room.price_from;
                    return (
                      <td key={id} className="px-1 py-1 border-r border-white/5 align-middle min-w-[104px]">
                        <button
                          type="button"
                          disabled={booked || past}
                          onClick={() =>
                            toggleSlot({
                              id,
                              date: date.label === "Hôm nay" ? "Hôm nay" : `${date.label}, ${date.dateLabel}`,
                              dateIso: date.iso,
                              time: `${slot.label} (${slot.duration})`,
                              price,
                              position: dayIndex * slots.length + slotIndex,
                            })
                          }
                          title={booked ? "Đã đặt" : past ? "Đã qua" : `${slot.label} - ${money(price)}đ`}
                          className={`
                            mx-auto flex h-9 w-[92px] items-center justify-center rounded-xl border text-[10px] font-bold transition-all duration-200 outline-none
                            ${
                              booked
                                ? "bg-rose-500 border-transparent text-white/50 cursor-not-allowed"
                                : past
                                  ? "bg-white/5 border-transparent text-white/20 cursor-not-allowed opacity-40"
                                  : selected
                                    ? "bg-yellow-400 border-yellow-300 text-black font-black shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                                    : promo
                                      ? "border-transparent bg-white/5 hover:bg-white/10 ring-1 ring-pink-500/50 text-white cursor-pointer"
                                      : "border-rose-500/60 bg-white/5 hover:bg-white/10 hover:border-rose-400 text-white cursor-pointer"
                            }
                          `}
                        >
                          {booked ? "-" : `${money(price)}đ`}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RoomMenuOptions
        branchId={room.branch_id}
        onMenuItemsChange={(items, total) => {
          setSelectedMenuItems(items);
          setMenuTotal(total);
        }}
      />

      {/* Selected summary */}
      {selectedSlots.length > 0 && (
        <div className="mt-5 rounded-3xl p-6 border-2 border-white/20 bg-[#1b111f] shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
          <h3 className="text-base font-extrabold text-pink-200 border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
            <Sparkles size={16} /> Khung giờ đã chọn
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2 text-white/80">
              <CalendarDays size={15} className="text-pink-300" /> {summary?.date}
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Clock3 size={15} className="text-pink-300" /> {selectedSlots.map((s) => s.time).join(", ")}
            </div>
          </div>
          {selectedSlots.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-5 border-t border-white/5 pt-4 text-sm">
              <span className="text-white/70">Giá gốc: <span className="font-bold text-white">{money(subtotal)}đ</span></span>
              <span className="text-emerald-300">Ưu đãi: <span className="font-bold">-{money(subtotal * discountRate)}đ ({Math.round(discountRate * 100)}%)</span></span>
              <span className="text-cyan-300">Tặng thêm: <span className="font-bold">+{extraMinutes} phút</span></span>
            </div>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/10 pt-6">
        <div className="text-lg font-extrabold text-white flex items-baseline gap-2">
          <span>Tổng tạm tính:</span>
          <span className="text-2xl text-yellow-200">{money(comboTotal + menuTotal)}đ</span>
        </div>
        <button
          type="button"
          disabled={!selectedSlots.length}
          onClick={goToCheckout}
          className="primary-button !min-h-12 px-8 text-base font-extrabold uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Đặt phòng ngay
        </button>
      </div>

      <div className="mt-4 border-2 border-cyan-400 bg-cyan-950/20 rounded-2xl p-4 text-center shadow-[4px_4px_0px_#22d3ee]">
        <p className="text-xs md:text-sm font-black text-cyan-300 leading-relaxed">
          ** Giảm 5% + tặng 30 phút khi đặt 2 khung giờ liền kề, 10% + 60 phút khi đặt 3–4 khung giờ
        </p>
      </div>

      {/* Mobile sticky summary bar */}
      {selectedSlots.length > 0 && (
        <button
          type="button"
          onClick={goToCheckout}
          className="fixed inset-x-3 bottom-[4.6rem] z-50 flex items-center justify-between gap-3 rounded-2xl border border-yellow-300/60 bg-[#2a1730] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden"
        >
          <span className="text-left text-xs font-bold text-white/85">
            Đã chọn {selectedSlots.length} khung giờ
            <br />
            <span className="text-base font-black text-yellow-200">{money(comboTotal + menuTotal)}đ</span>
          </span>
          <span className="primary-button !min-h-9 px-4 text-xs">Đặt phòng ngay</span>
        </button>
      )}
    </section>
  );
}
