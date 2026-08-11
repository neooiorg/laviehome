"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Bolt,
  CalendarDays,
  ChevronUp,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import type { ElementType } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { BookingDateRangePicker } from "@/components/booking-date-range-picker";
import { CUSTOMER_CONTACT } from "@/config/customer-info";
import { compactPhone, money } from "@/lib/format";
import { parseAmenity, resolveAmenityIcon } from "@/lib/amenity-icons";
import { makeBookingReference } from "@/lib/booking-reference";
import {
  isSlotLabelStartPast,
  makeBookingDatesFromRange,
  makeDefaultBookingDateRange,
} from "@/lib/booking-slots";
import { RoomMenuOptions } from "@/app/(site)/rooms/[id]/_components/room-menu-options";
import { RoomPhoto } from "@/components/room-photo";
import { isStartInComboPromoWindows, tierForRun, type ComboPromoConfig } from "@/lib/combo-promo";
import type { MenuItem } from "@/lib/menu-actions";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const PLACEHOLDER_IMG = "https://placehold.co/420x300/1b1023/white?text=Anh+phong";

function safeImg(src: string) {
  return src && (src.startsWith("http") || src.startsWith("/")) ? src : PLACEHOLDER_IMG;
}

const roomSlots: Record<string, { label: string; duration: string; start?: string; end?: string; isOvernight?: boolean }[]> = {
  Honey: [
    { label: "9:00 - 12:00", duration: "3T", start: "09:00", end: "12:00" },
    { label: "12:30 - 15:30", duration: "3T", start: "12:30", end: "15:30" },
    { label: "16:00 - 19:00", duration: "3T", start: "16:00", end: "19:00" },
    { label: "19:30 - 8:20", duration: "12T 50", start: "19:30", end: "08:20", isOvernight: true }
  ],
  Squid: [
    { label: "9:30 - 12:30", duration: "3T", start: "09:30", end: "12:30" },
    { label: "13:00 - 16:00", duration: "3T", start: "13:00", end: "16:00" },
    { label: "16:30 - 19:30", duration: "3T", start: "16:30", end: "19:30" },
    { label: "20:00 - 8:50", duration: "12T 50", start: "20:00", end: "08:50", isOvernight: true }
  ],
  default: [
    { label: "9:00 - 12:00", duration: "3T", start: "09:00", end: "12:00" },
    { label: "12:30 - 15:30", duration: "3T", start: "12:30", end: "15:30" },
    { label: "16:00 - 19:00", duration: "3T", start: "16:00", end: "19:00" },
    { label: "19:30 - 8:20", duration: "12T 50", start: "19:30", end: "08:20", isOvernight: true }
  ]
};

type DisplaySlot = { label: string; duration: string; start?: string; end?: string; isOvernight?: boolean };

function getRoomSlots(roomName: string, storedSlots?: DisplaySlot[] | null): DisplaySlot[] {
  if (storedSlots && storedSlots.length > 0) return storedSlots;
  if (roomName.includes("Honey")) return roomSlots["Honey"];
  if (roomName.includes("Squid")) return roomSlots["Squid"];
  return roomSlots["default"];
}

function isSlotPromo(dayIndex: number) {
  // Monday (day 1) to Friday (day 5) are promo slots
  return dayIndex >= 1 && dayIndex <= 5;
}

// Customers may pick slots across multiple rooms, capped by distinct dates.
const MAX_DAYS = 7;

function isFullDaySelection(slots: SelectedSlot[], slotCount: number) {
  if (slotCount <= 1 || slots.length !== slotCount) return false;
  return new Set(slots.map((slot) => slot.position % slotCount)).size === slotCount;
}

type SelectedSlot = {
  id: string;
  room: Room;
  date: string;
  dateIso: string;
  time: string;
  start?: string;
  price: number;
  position: number;
};

type Branch = {
  id: number;
  name: string;
  active: number;
  hotline: string;
  google_maps_link: string;
  classic_booking_enabled: number;
};

type Room = {
  id: number;
  branch_id: number;
  card_name: string;
  branch_name: string;
  room_amenities: string[];
  price_from: number;
  price_to: number;
  full_day_price: number;
  main_image: string;
  is_classic: number;
  images: string[];
  time_slots?: DisplaySlot[] | null;
  slot_prices?: (number | null)[] | null;
};

export function LavieHomeApp({
  branches,
  rooms,
  menuItems,
  comboPromo,
}: {
  branches: Branch[];
  rooms: Room[];
  menuItems: MenuItem[];
  comboPromo: ComboPromoConfig;
}) {
  const [activeBranchId, setActiveBranchId] = useState(branches[0]?.id ?? 30);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItem[]>([]);
  const [menuTotal, setMenuTotal] = useState(0);
  const [modalRoom, setModalRoom] = useState<Room | null>(null);
  const [bookedSlotIds, setBookedSlotIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState(() => makeDefaultBookingDateRange(7));
  const bookingScrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const roomRowRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({ isDragging: false, moved: false, startX: 0, startScrollLeft: 0 });

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(".lavie-cyber-title",
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    )
    .fromTo(".lavie-cyber-p",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      "-=0.5"
    )
    .fromTo(".lavie-cyber-actions a",
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" },
      "-=0.4"
    )
    .fromTo(".lavie-cyber-mockup",
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.7)" },
      "-=0.6"
    );
  }, { scope: containerRef });

  useGSAP(() => {
    gsap.fromTo(".room-card-clone",
      { opacity: 0, y: 30, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }
    );
  }, { dependencies: [activeBranchId], scope: containerRef });
  const branchRooms = useMemo(
    () => rooms.filter((room) => room.branch_id === activeBranchId && room.is_classic === 0),
    [activeBranchId, rooms]
  );
  // Calendar includes all rooms of the branch (not just is_classic === 0) for branches like KCN Hong Loan
  const allBranchRooms = useMemo(
    () => rooms.filter((room) => room.branch_id === activeBranchId),
    [activeBranchId, rooms]
  );
  const featuredRooms = branchRooms.slice(0, 10);
  const heroMarqueeRooms = featuredRooms.slice(0, 8);
  const heroLoopRooms = [...heroMarqueeRooms, ...heroMarqueeRooms];
  const calendarRooms = (branchRooms.length > 0 ? branchRooms : allBranchRooms).slice(0, 8);
  const currentBranch = branches.find((branch) => branch.id === activeBranchId) ?? branches[0];
  const availableMenuItems = useMemo(
    () => menuItems.filter((item) => item.branch_id === activeBranchId && item.is_active),
    [activeBranchId, menuItems]
  );
  const dates = useMemo(() => makeBookingDatesFromRange(dateRange), [dateRange]);
  const bookedSlotIdSet = useMemo(() => new Set(bookedSlotIds), [bookedSlotIds]);

  const promoActive = comboPromo.enabled && comboPromo.tiers.length > 0;

  // Selected slots grouped by room + day so combo/full-day pricing never mixes
  // adjacent-looking slots from different rooms.
  const slotGroups = useMemo(() => {
    const groups = new Map<string, { roomId: number; roomName: string; date: string; dateIso: string; slots: SelectedSlot[] }>();
    for (const slot of selectedSlots) {
      const key = `${slot.room.id}-${slot.dateIso}`;
      const group = groups.get(key) ?? {
        roomId: slot.room.id,
        roomName: slot.room.card_name,
        date: slot.date,
        dateIso: slot.dateIso,
        slots: [],
      };
      group.slots.push(slot);
      groups.set(key, group);
    }
    return [...groups.values()]
      .map((group) => ({ ...group, slots: [...group.slots].sort((a, b) => a.position - b.position) }))
      .sort((a, b) => a.dateIso.localeCompare(b.dateIso) || a.roomId - b.roomId);
  }, [selectedSlots]);
  const selectedDateCount = useMemo(
    () => new Set(selectedSlots.map((slot) => slot.dateIso)).size,
    [selectedSlots]
  );
  const selectedRoomCount = useMemo(
    () => new Set(selectedSlots.map((slot) => slot.room.id)).size,
    [selectedSlots]
  );

  // Combo is scored per day: only adjacent slots within the same day earn the
  // discount + bonus minutes, and each day is tallied independently.
  const { subtotal, discountAmount, extraMinutes, fullDayCount, fullDayAmount } = useMemo(() => {
    let subtotal = 0;
    let discountAmount = 0;
    let extraMinutes = 0;
    let fullDayCount = 0;
    let fullDayAmount = 0;
    for (const group of slotGroups) {
      const groupRoom = group.slots[0]?.room;
      const groupSlotCount = groupRoom ? getRoomSlots(groupRoom.card_name, groupRoom.time_slots).length : 0;
      if (groupRoom && isFullDaySelection(group.slots, groupSlotCount)) {
        subtotal += groupRoom.full_day_price;
        fullDayAmount += groupRoom.full_day_price;
        fullDayCount++;
        continue;
      }

      let i = 0;
      while (i < group.slots.length) {
        let end = i;
        const promoEligible = isStartInComboPromoWindows(comboPromo, group.slots[i].start);
        while (
          end + 1 < group.slots.length &&
          group.slots[end + 1].position - group.slots[end].position === 1 &&
          isStartInComboPromoWindows(comboPromo, group.slots[end + 1].start) === promoEligible
        ) {
          end++;
        }
        const run = group.slots.slice(i, end + 1);
        const runTotal = run.reduce((sum, slot) => sum + slot.price, 0);
        const tier = promoEligible ? tierForRun(comboPromo, run.length) : null;
        subtotal += runTotal;
        if (tier) {
          discountAmount += runTotal * (tier.discountPercent / 100);
          extraMinutes += tier.bonusMinutes;
        }
        i = end + 1;
      }
    }
    return { subtotal, discountAmount, extraMinutes, fullDayCount, fullDayAmount };
  }, [slotGroups, comboPromo]);
  const comboTotal = Math.max(subtotal - discountAmount, 0);
  const grandTotal = comboTotal + menuTotal;
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

  function switchBranch(branchId: number) {
    setActiveBranchId(branchId);
    setSelectedSlots([]);
    setSelectedMenuItems([]);
    setMenuTotal(0);
  }

  useEffect(() => {
    setSelectedSlots([]);
  }, [dateRange]);

  // Pre-select branch from the URL (?branch=<id>) so links from a room detail
  // page open the booking calendar for the correct branch instead of the first one.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const branchParam = Number(params.get("branch"));
    if (!branchParam || Number.isNaN(branchParam)) return;
    if (!branches.some((b) => b.id === branchParam)) return;
    setActiveBranchId(branchParam);
    if (window.location.hash === "#booking") {
      // Wait for the branch calendar to render before scrolling into view.
      requestAnimationFrame(() => {
        document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [branches]);

  useEffect(() => {
    let ignore = false;

    async function loadAvailability() {
      try {
        const res = await fetch(`/api/booking-availability?branch_id=${activeBranchId}`);
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
  }, [activeBranchId]);

  function scrollBooking(direction: -1 | 1) {
    bookingScrollRef.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
  }

  function handleRoomRowPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const el = roomRowRef.current;
    if (!el || event.pointerType !== "mouse") return;
    dragState.current = { isDragging: true, moved: false, startX: event.clientX, startScrollLeft: el.scrollLeft };

    function onMouseMove(e: MouseEvent) {
      const state = dragState.current;
      if (!state.isDragging || !el) return;
      const delta = e.clientX - state.startX;
      if (Math.abs(delta) > 3) state.moved = true;
      el.scrollLeft = state.startScrollLeft - delta;
    }
    function onMouseUp() {
      dragState.current.isDragging = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function handleRoomRowPointerMove(_event: React.PointerEvent<HTMLDivElement>) { /* handled via window */ }

  function endRoomRowDrag(_event: React.PointerEvent<HTMLDivElement>) { /* handled via window */ }

  function handleRoomCardClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (dragState.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragState.current.moved = false;
    }
  }

  function toggleSlot(slot: SelectedSlot) {
    setSelectedSlots((current) => {
      if (current.some((item) => item.id === slot.id)) {
        return current.filter((item) => item.id !== slot.id);
      }
      // Free multi-room, multi-day selection, capped at a week of distinct dates.
      const days = new Set(current.map((item) => item.dateIso));
      if (!days.has(slot.dateIso) && days.size >= MAX_DAYS) return current;
      return [...current, slot].sort(
        (a, b) => a.dateIso.localeCompare(b.dateIso) || a.room.id - b.room.id || a.position - b.position
      );
    });
  }

  const selectedSummary = selectedSlots[0]
    ? {
        room: selectedRoomCount > 1 ? `${selectedRoomCount} phòng` : selectedSlots[0].room.card_name,
        date: selectedSlots[0].date,
        branch: selectedSlots[0].room.branch_name,
        time: selectedSlots.map((slot) => slot.time).join(", "),
      }
    : null;

  function formatCheckoutDate(iso: string) {
    const [year, month, day] = iso.split("-");
    return `${day}/${month}/${year}`;
  }

  function createCheckoutUrl() {
    if (!selectedSlots[0]) return "/checkout";

    const firstSlot = selectedSlots[0];
    const timeslotIds = selectedSlots.map((slot) => slot.id).join(",");
    const checkoutDate = formatCheckoutDate(firstSlot.dateIso);
    const roomNames = [...new Set(selectedSlots.map((slot) => slot.room.card_name))];
    const timeRange = slotGroups
      .map((group) => `${group.roomName} - ${group.date}: ${group.slots.map((slot) => slot.time).join(", ")}`)
      .join(" • ");
    const payload = {
      booking_id: makeBookingReference(firstSlot.room.branch_id),
      room_id: firstSlot.room.id,
      timeslot_ids: timeslotIds,
      room_name: roomNames.join(", "),
      branch_name: firstSlot.room.branch_name,
      branch_id: String(firstSlot.room.branch_id),
      date: checkoutDate,
      time_range: timeRange,
      price: grandTotal,
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

    return `/checkout/?${params.toString()}`;
  }

  function goToCheckout() {
    if (!selectedSlots.length) return;
    window.location.href = createCheckoutUrl();
  }

  return (
    <div id="top" className="site-shell text-white" ref={containerRef}>
      <SiteHeader />

      <main className="pt-[104px]">
        {/* Option 3: Neo-Brutalist Cyber-Pink (Chosen Hero Design) with original glowing background */}
        <section className="lavie-hero-section">
          <div className="lavie-hero-shell !min-h-0 pt-5 pb-10 sm:pt-7 sm:pb-12 lg:pt-8 lg:pb-16">
            <div className="mx-auto w-[min(100%-2rem,1360px)] grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center relative z-10">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-pink-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-md border border-white">
                    🔥 HOT DEALS
                  </span>
                  <span className="bg-purple-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-md border border-white">
                    🔒 100% BẢO MẬT
                  </span>
                </div>

                <h1 className="lavie-cyber-title text-5xl sm:text-6xl font-black text-white leading-none tracking-tight">
                  PHÒNG NGHỈ <br />
                  <span className="bg-yellow-300 text-[#100813] px-3 py-1.5 inline-block transform -rotate-1 font-black my-2 border-2 border-white shadow-[4px_4px_0px_#f43f5e]">
                    TỰ CHECK-IN
                  </span> <br />
                  RIÊNG TƯ 24/7.
                </h1>

                <p className="lavie-cyber-p text-white/80 text-sm md:text-base max-w-[50ch] font-semibold leading-relaxed">
                  Không làm phiền, nhận phòng tự động qua ứng dụng Zalo. Xem trước hình ảnh 100% thực tế của phòng trước khi xuống tiền đặt chỗ.
                </p>

                <div className="lavie-cyber-actions flex flex-col sm:flex-row gap-4 max-w-md pt-2">
                  <a href="#booking" className="bg-pink-500 hover:bg-pink-400 text-white font-extrabold text-center px-8 py-3.5 rounded-xl border-2 border-white shadow-[4px_4px_0px_white] hover:shadow-[2px_2px_0px_white] transition-all duration-150 inline-block">
                    CHỌN GIỜ ĐẶT PHÒNG
                  </a>
                  <a href="#rooms" className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-center px-6 py-3.5 rounded-xl border-2 border-white shadow-[4px_4px_0px_rgba(255,255,255,0.15)] hover:shadow-[2px_2px_0px_rgba(255,255,255,0.15)] transition-all duration-150 inline-block">
                    Danh sách phòng
                  </a>
                </div>
              </div>

              {/* Khung ảnh mockup bên phải dạng thẻ viền dày */}
              <div className="lavie-cyber-mockup relative p-2">
                <div className="border-4 border-white bg-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_rgba(243,90,189,0.5)] aspect-[4/3] relative">
                  {featuredRooms[0] && (
                    <RoomPhoto
                      src={safeImg(featuredRooms[0].main_image)}
                      alt="Preview Room"
                      sizes="(min-width: 1024px) 500px, 300px"
                    />
                  )}
                  {/* Floating Info Badge 1 */}
                  <div className="absolute top-4 left-4 bg-[#100813] border-2 border-white text-yellow-300 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-[3px_3px_0px_#fff]">
                    <Sparkles size={12} /> Bồn tắm & Máy chiếu 4K
                  </div>
                  {/* Floating Info Badge 2 */}
                  <div className="absolute bottom-4 right-4 bg-[#100813] border-2 border-white text-pink-300 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-[3px_3px_0px_#fff]">
                    ⭐ 4.9/5 (1.2k+ đánh giá)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(100%-2rem,1360px)] py-8">
          <div className="mb-6">
            <p className="eyebrow">Hệ thống cơ sở</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-[-0.025em] md:text-4xl">Chọn chi nhánh bạn muốn nghỉ</h2>
            <p className="mt-3 max-w-[62ch] text-sm font-semibold leading-6 text-white/62 md:text-[0.95rem]">
              Vui lòng chọn cơ sở cụ thể để cập nhật danh sách phòng và lịch trống theo thời gian thực.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {branches.map((branch) => {
              const parts = branch.name.split(" - ");
              const city = parts[0];
              const address = parts.slice(1).join(" - ") || "Chi nhánh";
              const isSelected = activeBranchId === branch.id;

              return (
                <button
                  key={branch.id}
                  className={`flex flex-col items-start text-left p-5 rounded-2xl border-2 transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-pink-500 bg-pink-500/10 text-white shadow-[4px_4px_0px_#f35abd] -translate-y-1"
                      : "border-white/10 bg-white/5 text-white/70 hover:-translate-y-1 hover:bg-white/10 hover:border-white hover:shadow-[4px_4px_0px_white]"
                  }`}
                  onClick={() => switchBranch(branch.id)}
                >
                  <span className={`text-[0.66rem] font-extrabold uppercase tracking-wider mb-2 px-2.5 py-1 rounded-lg ${
                    isSelected ? "bg-pink-500/30 text-pink-200" : "bg-white/10 text-white/60"
                  }`}>
                    {city}
                  </span>
                  <span className="text-sm font-bold leading-snug">
                    {address}
                  </span>
                </button>
              );
            })}
          </div>

        </section>

        <section id="rooms" className="mx-auto w-[min(100%-2rem,1360px)] py-8">
          <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="eyebrow">Danh sách phòng</p>
              <h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight tracking-[-0.025em] md:text-4xl">Phòng tại {currentBranch?.name}</h2>
              <p className="mt-3 max-w-[62ch] text-sm font-semibold leading-6 text-white/62 md:text-[0.95rem]">{branchRooms.length} phòng đang sẵn sàng.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={activeBranchId}
                onChange={(e) => switchBranch(Number(e.target.value))}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm cursor-pointer focus:outline-none focus:border-pink-400 hover:border-white/40 transition-colors"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id} className="bg-[#1b1023] text-white">
                    {branch.name}
                  </option>
                ))}
              </select>
              <div className="hidden gap-2 md:flex">
                <button className="icon-button" onClick={() => document.getElementById("room-row")?.scrollBy({ left: -420, behavior: "smooth" })} aria-label="Cuộn trái">
                  <ArrowLeft size={18} />
                </button>
                <button className="icon-button" onClick={() => document.getElementById("room-row")?.scrollBy({ left: 420, behavior: "smooth" })} aria-label="Cuộn phải">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div
            id="room-row"
            ref={roomRowRef}
            onPointerDown={handleRoomRowPointerDown}
            onClickCapture={handleRoomCardClickCapture}
            className="hide-scrollbar flex snap-x items-start gap-5 overflow-x-auto pb-6 cursor-grab select-none active:cursor-grabbing md:snap-none"
          >
            {featuredRooms.map((room) => (
              <article key={room.id} className="room-card-clone snap-center">
                <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-slate-900">
                  <RoomPhoto src={safeImg(room.main_image)} alt={`${room.card_name} room`} sizes="420px" />
                </div>
                <h3 className="mt-4 text-base font-extrabold leading-tight text-pink-100">{room.card_name}</h3>
                <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-hidden">
                  {room.room_amenities.slice(0, 8).map((amenity) => {
                    const Icon = resolveAmenityIcon(amenity);
                    return (
                      <span key={amenity} className="inline-flex items-center gap-1 rounded-xl border border-pink-300/40 bg-pink-300/10 px-2.5 py-1.5 text-[0.72rem] font-bold text-white">
                        <Icon size={13} /> {parseAmenity(amenity).text}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm font-bold text-white/75">
                  Từ <span className="text-yellow-200">{money(room.price_from)}đ</span> đến{" "}
                  <span className="text-pink-200">{money(room.price_to)}đ</span>
                </p>
                <p className="mt-1 text-sm font-bold text-white/65">Cả ngày: {money(room.full_day_price)}đ</p>
                <div className="flex-1" />
                <Link className="primary-button mt-4 w-full text-center" href={`/rooms/${room.id}`}>
                  Xem ảnh & Đặt phòng
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section id="booking" className="mx-auto w-[min(100%-2rem,1360px)] scroll-mt-28 py-8">
          <div className="mb-8 text-center flex flex-col items-center justify-center">
            <h2 className="text-3xl font-black leading-tight tracking-[-0.03em] md:text-5xl text-white">
              Lịch đặt phòng
            </h2>
            <p className="mt-3 text-pink-500 font-extrabold text-lg md:text-xl uppercase tracking-wider animate-pulse">
              Tất cả chi nhánh tại {currentBranch?.name.split(" - ")[0] || "Hà Nội"}
            </p>
            <div className="mt-4 inline-block bg-white text-pink-600 px-6 py-2.5 rounded-2xl font-black text-sm md:text-base border border-pink-200 shadow-lg uppercase tracking-wide">
              {currentBranch?.name.split(" - ").slice(1).join(" - ") || currentBranch?.name || "Chi nhánh"}
            </div>
          </div>

          <BookingDateRangePicker
            value={dateRange}
            onChange={setDateRange}
            className="mb-6 mx-auto w-full max-w-3xl"
            description="Chọn khoảng ngày muốn xem lịch trống và đặt phòng trước."
          />

          {/* Legends list */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm font-bold text-white/90">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-rose-500 border border-transparent shadow-sm" />
              <span>Đã Đặt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg border-2 border-rose-500 bg-white/5" />
              <span>Còn Trống</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg bg-yellow-400 text-black border border-yellow-300" />
              <span>Đang chọn</span>
            </div>
            {promoActive && (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-lg border-2 border-transparent bg-origin-border bg-gradient-to-r from-orange-400 to-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                <span>Khuyến mãi</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="glass-panel booking-panel rounded-3xl overflow-hidden border border-white/10 bg-white/2">
              {calendarRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/50">
                  <BedDouble size={36} className="text-white/20" />
                  <p className="text-base font-bold">Chi nhánh này chưa có phòng trong lịch đặt</p>
                  <p className="text-sm">Vui lòng chọn chi nhánh khác hoặc liên hệ hotline để đặt thủ công.</p>
                </div>
              ) : (
              <div ref={bookingScrollRef} className="booking-scroll hide-scrollbar overflow-x-auto overflow-y-hidden overscroll-x-contain touch-auto">
                <table className="booking-table min-w-max text-center">
                  <thead>
                    {/* Row 1: Tên phòng */}
                    <tr className="border-b border-white/10 bg-white/5">
                      <th colSpan={2} className="sticky left-0 z-30 w-[6.5rem] min-w-[6.5rem] bg-[#1f1428] py-1.5 px-2 text-center border-r border-white/10 text-[11px] font-black uppercase tracking-wider text-pink-200">
                        Tên phòng
                      </th>
                      {calendarRooms.map((room) => (
                        <th
                          key={room.id}
                          colSpan={getRoomSlots(room.card_name, room.time_slots).length}
                          className="py-1.5 px-2 text-center border-r border-white/10 text-[13px] font-extrabold text-pink-100"
                        >
                          {room.card_name.replace("Phòng ", "")}
                        </th>
                      ))}
                    </tr>
                    {/* Row 2: Thứ / Ngày / Slots */}
                    <tr className="border-b border-white/10 bg-white/3">
                      <th className="sticky left-0 z-30 w-[3.1rem] min-w-[3.1rem] bg-[#1f1428] py-0.5 px-1 border-r border-white/10 text-[11px] font-bold text-white/60 text-center">Thứ</th>
                      <th className="sticky left-[3.1rem] z-30 w-[3.4rem] min-w-[3.4rem] bg-[#1f1428] py-0.5 px-1 border-r border-white/10 text-[11px] font-bold text-white/60 text-center">Ngày</th>
                      {calendarRooms.map((room) =>
                        getRoomSlots(room.card_name, room.time_slots).map((slot, sIdx) => (
                          <th
                            key={`${room.id}-slot-head-${sIdx}`}
                            className="py-1 px-0.5 md:px-1 border-r border-white/10 text-[10px] font-medium text-white/70 text-center min-w-[54px] md:min-w-[82px]"
                          >
                            <div className="flex flex-col items-center justify-center gap-0">
                              <span className="font-semibold text-white/95 tracking-tighter text-[9px] leading-tight">{slot.label}</span>
                              <span className="flex items-center gap-0.5 text-[8px] font-bold text-white/40 tracking-tighter">
                                {slot.isOvernight && <span className="text-pink-300">🌙</span>}
                                {slot.duration}
                              </span>
                            </div>
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {dates.map((date, dayIndex) => (
                      <tr key={date.iso} className="border-b border-white/5 hover:bg-white/3 transition-colors duration-150">
                        <td className="sticky left-0 z-10 w-[3.1rem] min-w-[3.1rem] bg-[#1b1023] py-0.5 px-1 text-center border-r border-white/10 font-bold text-xs text-white/80">
                          <span className={date.label === "Hôm nay" ? "text-pink-400 font-extrabold" : ""}>
                            {date.label}
                          </span>
                        </td>
                        <td className="sticky left-[3.1rem] z-10 w-[3.4rem] min-w-[3.4rem] bg-[#1b1023] py-0.5 px-1 text-center border-r border-white/10 font-bold text-xs text-white/80">
                          <span className={date.label === "Hôm nay" ? "text-pink-400 font-extrabold" : ""}>
                            {date.dateLabel}
                          </span>
                        </td>
                        {calendarRooms.map((room) => {
                          const slots = getRoomSlots(room.card_name, room.time_slots);
                          return slots.map((slot, slotIndex) => {
                            const id = `${room.id}-${date.iso}-${slotIndex}`;
                            const booked = bookedSlotIdSet.has(id);
                            const past = !booked && isSlotLabelStartPast(date.iso, slot.label);
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
                              <td key={id} className="py-px px-0.5 md:px-1 text-center border-r border-white/5 align-middle min-w-[54px] md:min-w-[82px]">
                                <button
                                  disabled={booked || past}
                                  onClick={() =>
                                    toggleSlot({
                                      id,
                                      room,
                                      date: date.label === "Hôm nay" ? "Hôm nay" : `${date.label}, ${date.dateLabel}`,
                                      dateIso: date.iso,
                                      time: `${slot.label} (${slot.duration})`,
                                      start: slot.start,
                                      price,
                                      position: dayIndex * slots.length + slotIndex,
                                    })
                                  }
                                  className={`
                                    w-[46px] h-6 md:w-14 md:h-7 rounded-md transition-all duration-200 flex items-center justify-center relative cursor-pointer outline-none border mx-auto
                                    ${
                                      booked
                                        ? "bg-rose-500 border-transparent cursor-not-allowed shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
                                        : past
                                          ? "bg-rose-500 border-transparent cursor-not-allowed shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
                                          : selected
                                            ? "bg-yellow-400 border-yellow-300 text-black font-black shadow-[0_0_10px_rgba(234,179,8,0.4)] hover:bg-yellow-300"
                                            : promo
                                              ? "border-transparent bg-white/5 hover:bg-white/10 ring-1 ring-pink-500/50 shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                                              : "border-rose-500/60 bg-white/5 hover:bg-white/10 hover:border-rose-400"
                                    }
                                  `}
                                  title={booked ? "Đã đặt" : past ? "Đã qua" : `Khung giờ ${slot.label} - Giá: ${money(price)}đ`}
                                >
                                  {booked || past ? (
                                    <span className="text-[9px] font-bold text-white/50">-</span>
                                  ) : selected ? (
                                    <span className="text-[8px] font-black text-black leading-none">
                                      {money(price)}đ
                                    </span>
                                  ) : (
                                    <span className="opacity-0 hover:opacity-100 absolute inset-0 flex items-center justify-center text-[8px] font-extrabold bg-slate-900/90 text-white rounded-md transition-opacity duration-150">
                                      {money(price)}đ
                                    </span>
                                  )}
                                </button>
                              </td>
                            );
                          });
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            <RoomMenuOptions items={availableMenuItems} onMenuItemsChange={handleMenuItemsChange} />

            {/* Selected summary details block */}
            {selectedSlots.length > 0 && (
              <div id="booking-summary" className="scroll-mt-28 rounded-3xl p-6 border-2 border-white/20 bg-[#1b111f] shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
                <h3 className="text-base font-extrabold text-pink-200 border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                  <Sparkles size={16} /> Chi tiết khung giờ đã chọn
                  <span className="ml-auto text-xs font-bold text-white/50">
                    {selectedRoomCount} phòng · {selectedDateCount} ngày · {selectedSlots.length} khung giờ
                  </span>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 text-sm">
                  <SummaryRow icon={BedDouble} label="Phòng" value={selectedSummary?.room ?? "Chưa chọn"} />
                  <SummaryRow icon={MapPin} label="Chi nhánh" value={selectedSummary?.branch ?? currentBranch?.name ?? "Chưa chọn"} />
                </div>
                <div className="mt-4 grid gap-2 border-t border-white/5 pt-4 text-sm">
                  {slotGroups.map((group) => (
                    <div key={`${group.roomId}-${group.dateIso}`} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <div className="flex items-center gap-2 font-bold text-white/85 sm:w-44 sm:shrink-0">
                        <CalendarDays size={15} className="text-pink-300" /> {group.roomName} - {group.date}
                      </div>
                      <div className="flex items-start gap-2 text-white/70">
                        <Clock3 size={15} className="mt-0.5 shrink-0 text-pink-300" />
                        <span>{group.slots.map((s) => s.time).join(", ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 justify-between border-t border-white/5 pt-4 text-sm text-white/70">
                  <div className="flex flex-wrap gap-6">
                    <div>Tạm tính phòng: <span className="text-white font-bold">{money(subtotal)}đ</span></div>
                    {fullDayCount > 0 && (
                      <div className="text-yellow-200">
                        Giá ngày: <span className="font-bold">{fullDayCount} ngày · {money(fullDayAmount)}đ</span>
                      </div>
                    )}
                    {menuTotal > 0 && (
                      <div className="text-yellow-200">Menu items: <span className="font-bold">+{money(menuTotal)}đ</span></div>
                    )}
                    {discountAmount > 0 && (
                      <>
                        <div className="text-emerald-300">Ưu đãi: <span className="font-bold">-{money(discountAmount)}đ</span></div>
                        <div className="text-cyan-300">Tặng thêm: <span className="font-bold">+{extraMinutes} phút nghỉ</span></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/10 pt-6">
              <div className="text-xl font-extrabold text-white flex items-baseline gap-2">
                <span>Tổng tiền tạm tính:</span>
                <span className="text-2xl text-yellow-200">{money(grandTotal)} đ</span>
              </div>
              <button
                disabled={!selectedSlots.length}
                onClick={goToCheckout}
                className="primary-button !min-h-12 px-8 text-base font-extrabold uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Đặt phòng
              </button>
            </div>

            {/* Discount Policy Note with cyan border */}
            <div className="border-2 border-cyan-400 bg-cyan-950/20 rounded-2xl p-5 text-center shadow-[4px_4px_0px_#22d3ee]">
              <p className="text-sm md:text-base font-black text-cyan-300 leading-relaxed">
                {promoNote && <>** {promoNote} (tính riêng theo từng ngày). </>}
                Chọn đủ tất cả khung giờ trong một ngày sẽ tự tính theo giá ngày.{" "}
                Có thể chọn nhiều phòng và nhiều ngày, tối đa 1 tuần.
              </p>
            </div>
          </div>
        </section>

      </main>

      <div className="fixed bottom-7 right-5 z-40 hidden flex-col gap-3 md:flex">
        <a className="float-button bg-slate-700" href="#top" aria-label="Lên đầu trang">
          <ChevronUp size={22} />
        </a>
        <a className="float-button bg-emerald-500" href={`tel:${compactPhone(currentBranch?.hotline ?? CUSTOMER_CONTACT.phoneLocalCompact)}`} aria-label="Gọi ngay">
          <Phone size={22} />
        </a>
        <a className="float-button bg-blue-600" href={CUSTOMER_CONTACT.zaloUrl} aria-label="Zalo" target="_blank" rel="noopener noreferrer">
          <MessageCircle size={20} />
        </a>
      </div>

      {selectedSlots.length > 0 && (
        <>
          {/* Mobile floating bar */}
          <button
            onClick={goToCheckout}
            className="fixed inset-x-3 bottom-[4.6rem] z-50 flex items-center justify-between gap-3 rounded-2xl border border-yellow-300/60 bg-[#2a1730] px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden"
          >
            <span className="text-left text-xs font-bold text-white/85">
              Đã chọn {selectedSlots.length} khung giờ
              <br />
              <span className="text-base font-black text-yellow-200">{money(grandTotal)}đ</span>
            </span>
            <span className="primary-button !min-h-9 px-4 text-xs">Đặt phòng ngay</span>
          </button>
          {/* Desktop floating bar */}
          <div className="hidden md:flex fixed bottom-0 inset-x-0 z-40 items-center justify-between gap-4 border-t-2 border-yellow-300/30 bg-[#1b1024]/95 backdrop-blur-xl px-8 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
            <div className="flex items-baseline gap-4">
              <span className="text-sm font-bold text-white/60">
                {selectedSummary?.room} · {selectedDateCount > 1 ? `${selectedDateCount} ngày` : selectedSummary?.date} ·{" "}
                {selectedSlots.length} khung giờ
              </span>
              <span className="text-xl font-black text-yellow-200">{money(grandTotal)}đ</span>
              {discountAmount > 0 && (
                <span className="text-sm font-bold text-emerald-300">-{money(discountAmount)}đ + {extraMinutes} phút</span>
              )}
            </div>
            <button onClick={goToCheckout} className="primary-button !min-h-11 px-8 text-base font-extrabold uppercase tracking-wide cursor-pointer">
              Đặt phòng ngay
            </button>
          </div>
        </>
      )}

      <BottomNav hotline={currentBranch?.hotline ?? CUSTOMER_CONTACT.phoneLocalCompact} />

      {modalRoom ? <RoomModal room={modalRoom} onClose={() => setModalRoom(null)} onBook={() => setModalRoom(null)} /> : null}
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/5 px-3 py-3">
      <span className="flex shrink-0 items-center gap-2 text-white/60">
        <Icon size={16} className="text-pink-200" /> {label}
      </span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded ${color}`} /> {label}
    </span>
  );
}

function RoomModal({ room, onClose, onBook }: { room: Room; onClose: () => void; onBook: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-panel mx-auto my-8 max-w-6xl overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-pink-200">{room.card_name}</h2>
            <p className="text-sm text-white/55">{room.branch_name}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="hide-scrollbar flex snap-x gap-4 overflow-x-auto">
            {(room.images.filter((src) => src && (src.startsWith("http") || src.startsWith("/"))).length > 0
              ? room.images.filter((src) => src && (src.startsWith("http") || src.startsWith("/")))
              : [room.main_image]
            ).slice(0, 10).map((src) => (
              <div
                key={src}
                className="relative h-[360px] w-full min-w-full snap-center overflow-hidden rounded-2xl bg-slate-900 sm:h-[520px]"
              >
                <RoomPhoto src={safeImg(src)} alt={room.card_name} sizes="(max-width: 640px) 100vw, 900px" />
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="flex justify-between">
                <span className="text-white/60">Giá theo khung</span>
                <span className="font-extrabold text-yellow-200">
                  {money(room.price_from)}đ - {money(room.price_to)}đ
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-white/60">Cả ngày</span>
                <span className="font-extrabold text-pink-200">{money(room.full_day_price)}đ</span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {room.room_amenities.map((amenity) => {
                const Icon = resolveAmenityIcon(amenity);
                return (
                  <span key={amenity} className="inline-flex items-center gap-1.5 rounded-xl border border-pink-300/30 bg-pink-300/10 px-3 py-2 text-xs font-bold">
                    <Icon size={14} /> {parseAmenity(amenity).text}
                  </span>
                );
              })}
            </div>
            <button className="primary-button mt-6" onClick={onBook}>
              <Bolt size={16} /> Chọn phòng này
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
