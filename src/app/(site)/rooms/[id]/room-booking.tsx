"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Sparkles } from "lucide-react";

import { makeBookingReference } from "@/lib/booking-reference";
import { money } from "@/lib/format";
import { formatCheckoutDate, getRoomSlots, isSlotPast, makeBookingDates, type RoomSlot } from "@/lib/booking-slots";
import { tierForRun, type ComboPromoConfig } from "@/lib/combo-promo";
import type { MenuItem } from "@/lib/menu-actions";
import { RoomMenuOptions } from "./_components/room-menu-options";

type BookingRoom = {
  id: number;
  branch_id: number;
  card_name: string;
  branch_name: string;
  price_from: number;
  full_day_price: number;
  slot_prices?: (number | null)[] | null;
  time_slots?: RoomSlot[] | null;
};

type SelectedSlot = {
  id: string;
  date: string;
  dateIso: string;
  time: string;
  price: number;
  position: number;
};

function isSlotPromo(dayIndex: number) {
  return dayIndex >= 1 && dayIndex <= 5;
}

// Customers may pick slots across at most one week.
const MAX_DAYS = 7;

export function RoomBooking({
  room,
  menuItems,
  comboPromo,
}: {
  room: BookingRoom;
  menuItems: MenuItem[];
  comboPromo: ComboPromoConfig;
}) {
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItem[]>([]);
  const [menuTotal, setMenuTotal] = useState(0);
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);
  const dates = useMemo(() => makeBookingDates(), []);
  const slots = useMemo(() => getRoomSlots(room.card_name, room.time_slots), [room.card_name, room.time_slots]);
  const bookedSlotIdSet = useMemo(() => new Set(bookedSlotIds), [bookedSlotIds]);

  useEffect(() => {
    let ignore = false;

    async function loadAvailability() {
      try {
        const res = await fetch(`/api/booking-availability?room_id=${room.id}`);
        const data = (await res.json()) as { bookedSlotIds?: string[] };
        if (!ignore) {
          setBookedSlotIds(Array.isArray(data.bookedSlotIds) ? data.bookedSlotIds : []);
        }
      } catch {
        if (!ignore) {
          setBookedSlotIds([]);
        }
      }
    }

    void loadAvailability();

    return () => {
      ignore = true;
    };
  }, [room.id]);

  // Slots grouped by day (in date order), so both the summary and the combo
  // pricing can reason about one day at a time.
  const slotsByDay = useMemo(() => {
    const groups = new Map<string, { date: string; dateIso: string; slots: SelectedSlot[] }>();
    for (const slot of selectedSlots) {
      const group = groups.get(slot.dateIso) ?? { date: slot.date, dateIso: slot.dateIso, slots: [] };
      group.slots.push(slot);
      groups.set(slot.dateIso, group);
    }
    return [...groups.values()]
      .map((group) => ({ ...group, slots: [...group.slots].sort((a, b) => a.position - b.position) }))
      .sort((a, b) => a.slots[0].position - b.slots[0].position);
  }, [selectedSlots]);

  // Combo is scored per day: only slots that are adjacent *within the same day*
  // earn the discount + bonus minutes. Each day is tallied independently.
  const { subtotal, discountAmount, extraMinutes } = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let extraMinutes = 0;
    for (const group of slotsByDay) {
      let i = 0;
      while (i < group.slots.length) {
        let end = i;
        while (end + 1 < group.slots.length && group.slots[end + 1].position - group.slots[end].position === 1) end++;
        const run = group.slots.slice(i, end + 1);
        const runTotal = run.reduce((sum, slot) => sum + slot.price, 0);
        const tier = tierForRun(comboPromo, run.length);
        subtotal += runTotal;
        if (tier) {
          discountAmount += runTotal * (tier.discountPercent / 100);
          extraMinutes += tier.bonusMinutes;
        }
        i = end + 1;
      }
    }
    return { subtotal, discountAmount, extraMinutes };
  }, [slotsByDay, comboPromo]);
  const comboTotal = Math.max(subtotal - discountAmount, 0);
  const promoActive = comboPromo.enabled && comboPromo.tiers.length > 0;
  const promoNote = promoActive
    ? comboPromo.tiers
        .map(
          (tier) =>
            `Giảm ${tier.discountPercent}%${tier.bonusMinutes ? ` + tặng ${tier.bonusMinutes} phút` : ""} khi đặt ${tier.minSlots}+ khung giờ liền kề`
        )
        .join(", ")
    : null;
  const handleMenuItemsChange = useCallback((items: MenuItem[], total: number) => {
    setSelectedMenuItems(items);
    setMenuTotal(total);
  }, []);

  function toggleSlot(slot: SelectedSlot) {
    setSelectedSlots((current) => {
      if (current.some((item) => item.id === slot.id)) {
        return current.filter((item) => item.id !== slot.id);
      }
      // Free multi-day selection, capped at a week. A new day is only allowed
      // while fewer than MAX_DAYS distinct days are already picked.
      const days = new Set(current.map((item) => item.dateIso));
      if (!days.has(slot.dateIso) && days.size >= MAX_DAYS) return current;
      return [...current, slot].sort((a, b) => a.position - b.position);
    });
  }

  function goToCheckout() {
    if (!selectedSlots.length) return;
    const first = selectedSlots[0];
    const totalWithMenu = comboTotal + menuTotal;
    // When more than one day is picked, prefix each day's times with its label so
    // the multi-day breakdown survives into checkout (which stores one stay_date).
    const timeRange =
      slotsByDay.length > 1
        ? slotsByDay.map((group) => `${group.date}: ${group.slots.map((slot) => slot.time).join(", ")}`).join(" • ")
        : selectedSlots.map((slot) => slot.time).join(", ");
    const payload = {
      booking_id: makeBookingReference(room.branch_id),
      room_id: room.id,
      timeslot_ids: selectedSlots.map((slot) => slot.id).join(","),
      room_name: room.card_name,
      branch_name: room.branch_name,
      branch_id: String(room.branch_id),
      date: formatCheckoutDate(first.dateIso),
      time_range: timeRange,
      price: totalWithMenu,
      menu_item_ids: selectedMenuItems.map((item) => item.id).join(","),
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const params = new URLSearchParams({
      data: encoded,
      booking_id: payload.booking_id,
      room_id: String(payload.room_id),
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

  return (
    <section id="booking" className="scroll-mt-28 mt-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <h2 className="text-2xl md:text-3xl font-black tracking-[-0.02em] text-white">Chọn khung giờ & đặt ngay</h2>
        <p className="mt-2 text-pink-300 font-bold text-sm uppercase tracking-wider">
          {room.card_name} — {room.branch_name}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-5 mb-6 text-xs font-bold text-white/85">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-rose-500" /> Đã đặt
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md border-2 border-rose-500 bg-white/5" /> Còn trống
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-md bg-yellow-400" /> Đang chọn
        </div>
        {promoActive && (
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-white/5 ring-1 ring-pink-500/50" /> Khuyến mãi
          </div>
        )}
      </div>

      <div className="glass-panel booking-panel rounded-3xl overflow-hidden border border-white/10 bg-white/2">
        <div className="overflow-x-auto overflow-y-hidden overscroll-x-contain touch-auto hide-scrollbar">
          <table className="min-w-max w-full text-center">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="sticky left-0 z-20 bg-[#1f1428] px-2 py-1.5 md:px-3 md:py-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-wider text-pink-200 border-r border-white/10">
                  Ngày
                </th>
                {slots.map((slot, i) => (
                  <th key={i} className="px-1.5 py-1 md:px-3 md:py-1.5 border-r border-white/10 text-[10px] md:text-[11px] font-bold text-white/80 min-w-[70px] md:min-w-[104px]">
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
                  <td className="sticky left-0 z-10 bg-[#1b1023] px-2 py-0.5 md:px-3 md:py-1 text-center border-r border-white/10 font-bold text-[11px] md:text-xs text-white/80 whitespace-nowrap">
                    <span className={date.label === "Hôm nay" ? "text-pink-400 font-extrabold" : ""}>
                      {date.label} <span className="text-white/50">{date.dateLabel}</span>
                    </span>
                  </td>
                  {slots.map((slot, slotIndex) => {
                    const id = `${room.id}-${date.iso}-${slotIndex}`;
                    const booked = bookedSlotIdSet.has(id);
                    const past = !booked && isSlotPast(dayIndex, slot.label);
                    const selected = selectedSlots.some((item) => item.id === id);
                    const promo = promoActive && isSlotPromo(dayIndex);
                    const slotPrice = room.slot_prices?.[slotIndex];
                    const price =
                      typeof slotPrice === "number" && slotPrice > 0
                        ? slotPrice
                        : slot.isOvernight
                          ? room.full_day_price
                          : room.price_from;

                    return (
                      <td key={id} className="px-0.5 py-px md:px-1 border-r border-white/5 align-middle min-w-[70px] md:min-w-[104px]">
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
                            mx-auto flex h-6 w-[62px] md:h-7 md:w-[92px] items-center justify-center rounded-md border text-[9px] font-bold transition-all duration-200 outline-none
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

      <RoomMenuOptions items={menuItems} onMenuItemsChange={handleMenuItemsChange} />

      {selectedSlots.length > 0 && (
        <div className="mt-5 rounded-3xl p-6 border-2 border-white/20 bg-[#1b111f] shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
          <h3 className="text-base font-extrabold text-pink-200 border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
            <Sparkles size={16} /> Khung giờ đã chọn
            <span className="ml-auto text-xs font-bold text-white/50">
              {slotsByDay.length} ngày · {selectedSlots.length} khung giờ
            </span>
          </h3>
          <div className="grid gap-3 text-sm">
            {slotsByDay.map((group) => (
              <div key={group.dateIso} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex items-center gap-2 font-bold text-white/85 sm:w-40 sm:shrink-0">
                  <CalendarDays size={15} className="text-pink-300" /> {group.date}
                </div>
                <div className="flex items-start gap-2 text-white/70">
                  <Clock3 size={15} className="mt-0.5 shrink-0 text-pink-300" />
                  <span>{group.slots.map((s) => s.time).join(", ")}</span>
                </div>
              </div>
            ))}
          </div>
          {discountAmount > 0 && (
            <div className="mt-4 flex flex-wrap gap-5 border-t border-white/5 pt-4 text-sm">
              <span className="text-white/70">
                Giá gốc: <span className="font-bold text-white">{money(subtotal)}đ</span>
              </span>
              <span className="text-emerald-300">
                Ưu đãi: <span className="font-bold">-{money(discountAmount)}đ</span>
              </span>
              <span className="text-cyan-300">
                Tặng thêm: <span className="font-bold">+{extraMinutes} phút</span>
              </span>
            </div>
          )}
        </div>
      )}

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
          {promoNote && <>** {promoNote} (tính riêng theo từng ngày). </>}
          Có thể chọn nhiều ngày, tối đa 1 tuần.
        </p>
      </div>

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
