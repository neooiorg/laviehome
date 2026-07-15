"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Bolt,
  CalendarDays,
  CheckCircle2,
  ChevronUp,
  Clock3,
  DoorOpen,
  Film,
  Gift,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import type { ElementType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { compactPhone, money } from "@/lib/format";
import { RoomMenuOptions } from "@/app/(site)/rooms/[id]/_components/room-menu-options";
import type { MenuItem } from "@/lib/menu-actions";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const PLACEHOLDER_IMG = "https://placehold.co/420x300/1b1023/white?text=Anh+phong";

function safeImg(src: string) {
  return src && (src.startsWith("http") || src.startsWith("/")) ? src : PLACEHOLDER_IMG;
}

const slotLabels = ["08:00 - 11:00", "11:15 - 14:15", "14:30 - 17:30", "17:45 - 20:45", "21:00 - 00:00"];

const amenityIconMap: Record<string, React.ElementType> = {
  netflix: Film,
  phim: Film,
  chiếu: Film,
  giường: BedDouble,
  sofa: Home,
  "ghế": Home,
  "tình yêu": Heart,
  "gương": UserRound,
  "wc": DoorOpen,
  "check cam": ShieldCheck,
  "tặng": Gift,
};

function amenityIcon(label: string) {
  const lower = label.toLocaleLowerCase("vi-VN");
  const entry = Object.entries(amenityIconMap).find(([key]) => lower.includes(key));
  return entry?.[1] ?? CheckCircle2;
}

const BlindBagIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4C14 4 12 5.5 11.5 7.5C11 9.5 9 10 9 10C9 10 7.5 10.5 7 12C6.5 13.5 8 15 8 15C8 15 6 17 6 19.5C6 22 8 26 12 27.5C16 29 20 29 24 27.5C28 26 30 22 30 19.5C30 17 28 15 28 15C28 15 29.5 13.5 29 12C28.5 10.5 27 10 27 10C27 10 25 9.5 24.5 7.5C24 5.5 22 4 20 4H16Z" fill="#EF4444" />
    <path d="M9 10C10.5 10.5 11.5 11.5 12.5 12.5C14.5 11.5 17.5 11.5 19.5 12.5C20.5 11.5 21.5 10.5 23 10C22 12.5 21 13.5 20.5 14C19 14.5 13 14.5 11.5 14C11 13.5 10 12.5 9 10Z" fill="#F59E0B" />
    <circle cx="16" cy="13.5" r="2.5" fill="#F59E0B" />
    <path d="M13 13.5L10 16.5M19 13.5L22 16.5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 21.5C12 21.5 14 23.5 16 23.5C18 23.5 20 21.5 20 21.5" stroke="#FFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const roomSlots: Record<string, { label: string; duration: string; isOvernight?: boolean }[]> = {
  Honey: [
    { label: "9:00 - 12:00", duration: "3T" },
    { label: "12:30 - 15:30", duration: "3T" },
    { label: "16:00 - 19:00", duration: "3T" },
    { label: "19:30 - 8:20", duration: "12T 50", isOvernight: true }
  ],
  Squid: [
    { label: "9:30 - 12:30", duration: "3T" },
    { label: "13:00 - 16:00", duration: "3T" },
    { label: "16:30 - 19:30", duration: "3T" },
    { label: "20:00 - 8:50", duration: "12T 50", isOvernight: true }
  ],
  default: [
    { label: "9:00 - 12:00", duration: "3T" },
    { label: "12:30 - 15:30", duration: "3T" },
    { label: "16:00 - 19:00", duration: "3T" },
    { label: "19:30 - 8:20", duration: "12T 50", isOvernight: true }
  ]
};

function getRoomSlots(roomName: string) {
  if (roomName.includes("Honey")) return roomSlots["Honey"];
  if (roomName.includes("Squid")) return roomSlots["Squid"];
  return roomSlots["default"];
}

function makeDates() {
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return Array.from({ length: 9 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const weekday = weekdays[date.getDay()];
    return {
      iso: date.toISOString().slice(0, 10),
      label: index === 0 ? "Hôm nay" : weekday,
      dateLabel: `${day}-${month}`
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
  // Today (day 0) Honey's slots 0 and 1 are booked
  if (roomName.includes("Honey") && dayIndex === 0 && (slotIndex === 0 || slotIndex === 1)) {
    return true;
  }
  // Today (day 0) Squid's slots 0, 1, and 2 are booked
  if (roomName.includes("Squid") && dayIndex === 0 && (slotIndex === 0 || slotIndex === 1 || slotIndex === 2)) {
    return true;
  }
  // Monday (day 1) Squid's slots 1 and 2 are booked
  if (roomName.includes("Squid") && dayIndex === 1 && (slotIndex === 1 || slotIndex === 2)) {
    return true;
  }
  // General pseudo-random booked slots
  const hash = roomName.charCodeAt(roomName.length - 1) + dayIndex * 5 + slotIndex * 13;
  return hash % 9 === 0;
}

function isSlotPromo(roomName: string, dayIndex: number, slotIndex: number) {
  // Monday (day 1) to Friday (day 5) are promo slots
  return dayIndex >= 1 && dayIndex <= 5;
}

function isSlotBlindBag(roomName: string, dayIndex: number, slotIndex: number) {
  const hash = roomName.charCodeAt(roomName.length - 2) + dayIndex * 7 + slotIndex * 3;
  return hash % 5 === 1;
}

type SelectedSlot = {
  id: string;
  room: Room;
  date: string;
  dateIso: string;
  time: string;
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
};

export function LavieHomeApp({ branches, rooms }: { branches: Branch[]; rooms: Room[] }) {
  const [activeBranchId, setActiveBranchId] = useState(branches[0]?.id ?? 30);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItem[]>([]);
  const [menuTotal, setMenuTotal] = useState(0);
  const [modalRoom, setModalRoom] = useState<Room | null>(null);
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
  const dates = useMemo(() => makeDates(), []);

  const subtotal = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
  const discountRate = selectedSlots.length === 2 ? 0.05 : selectedSlots.length >= 3 ? 0.1 : 0;
  const extraMinutes = selectedSlots.length === 2 ? 30 : selectedSlots.length >= 3 ? 60 : 0;
  const comboTotal = subtotal - subtotal * discountRate;
  const grandTotal = Math.max(comboTotal, 0) + menuTotal;

  function switchBranch(branchId: number) {
    setActiveBranchId(branchId);
    setSelectedSlots([]);
    setSelectedMenuItems([]);
    setMenuTotal(0);
  }

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

      if (current.length >= 4) return current;
      if (current.length > 0) {
        const sameRoom = current.every((item) => item.room.id === slot.room.id && item.date === slot.date);
        const nextPositions = [...current.map((item) => item.position), slot.position].sort((a, b) => a - b);
        const sequential = nextPositions.every((position, index) => index === 0 || position - nextPositions[index - 1] === 1);
        if (!sameRoom || !sequential) return [slot];
      }

      return [...current, slot].sort((a, b) => a.position - b.position);
    });
  }

  const selectedSummary = selectedSlots[0]
    ? {
        room: selectedSlots[0].room.card_name,
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
    const payload = {
      timeslot_ids: timeslotIds,
      room_name: firstSlot.room.card_name,
      branch_name: firstSlot.room.branch_name,
      branch_id: String(firstSlot.room.branch_id),
      date: checkoutDate,
      time_range: selectedSlots.map((slot) => slot.time).join(", "),
      price: grandTotal,
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
          <div className="lavie-hero-shell !min-h-0 py-12 lg:py-16">
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
                    <Image
                      src={safeImg(featuredRooms[0].main_image)}
                      alt="Preview Room"
                      fill
                      sizes="(min-width: 1024px) 500px, 300px"
                      className="object-cover"
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

          {allBranchRooms[0] && (
            <div className="mt-5 relative aspect-[21/9] rounded-2xl overflow-hidden border border-white/10">
              <Image
                src={safeImg(allBranchRooms[0].main_image)}
                alt={currentBranch?.name ?? "Chi nhánh"}
                fill
                sizes="(min-width: 1024px) 1360px, 100vw"
                className="object-cover object-center transition-all duration-500"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-5">
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Chi nhánh đang xem</p>
                <p className="text-lg font-black text-white">{currentBranch?.name}</p>
              </div>
            </div>
          )}
        </section>

        <section id="rooms" className="mx-auto w-[min(100%-2rem,1360px)] py-8">
          <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="eyebrow">Danh sách phòng</p>
              <h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight tracking-[-0.025em] md:text-4xl">Phòng tại {currentBranch?.name}</h2>
              <p className="mt-3 max-w-[62ch] text-sm font-semibold leading-6 text-white/62 md:text-[0.95rem]">{branchRooms.length} phòng đang hiển thị từ dữ liệu gốc.</p>
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
            className="hide-scrollbar flex snap-x gap-5 overflow-x-auto pb-6 cursor-grab select-none active:cursor-grabbing md:snap-none"
          >
            {featuredRooms.map((room) => (
              <article key={room.id} className="room-card-clone snap-center">
                <Image
                  src={safeImg(room.main_image)}
                  alt={`${room.card_name} room`}
                  width={420}
                  height={300}
                  className="h-52 w-full rounded-2xl object-cover"
                  draggable={false}
                />
                <h3 className="mt-4 min-h-12 text-base font-extrabold leading-tight text-pink-100">{room.card_name}</h3>
                <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-hidden">
                  {room.room_amenities.slice(0, 8).map((amenity) => {
                    const Icon = amenityIcon(amenity);
                    return (
                      <span key={amenity} className="inline-flex items-center gap-1 rounded-xl border border-pink-300/40 bg-pink-300/10 px-2.5 py-1.5 text-[0.72rem] font-bold text-white">
                        <Icon size={13} /> {amenity}
                      </span>
                    );
                  })}
                </div>
                <p className="mt-4 text-sm font-bold text-white/75">
                  Từ <span className="text-yellow-200">{money(room.price_from)}đ</span> đến{" "}
                  <span className="text-pink-200">{money(room.price_to)}đ</span>
                </p>
                <p className="mt-1 text-sm font-bold text-white/65">Qua đêm: {money(room.full_day_price)}đ</p>
                <Link className="primary-button mt-5 w-full text-center" href={`/rooms/${room.id}`}>
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
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-lg border-2 border-transparent bg-origin-border bg-gradient-to-r from-orange-400 to-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
              <span>Khuyến mãi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <BlindBagIcon size={20} />
              </div>
              <span>Túi mù</span>
            </div>
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
              <div ref={bookingScrollRef} className="booking-scroll hide-scrollbar overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-y">
                <table className="booking-table min-w-max text-center">
                  <thead>
                    {/* Row 1: Tên phòng */}
                    <tr className="border-b border-white/10 bg-white/5">
                      <th colSpan={2} className="sticky left-0 z-30 w-[6.5rem] min-w-[6.5rem] bg-[#1f1428] p-3 text-center border-r border-white/10 text-xs font-black uppercase tracking-wider text-pink-200">
                        Tên phòng
                      </th>
                      {calendarRooms.map((room) => (
                        <th
                          key={room.id}
                          colSpan={getRoomSlots(room.card_name).length}
                          className="p-3 text-center border-r border-white/10 text-sm font-extrabold text-pink-100"
                        >
                          {room.card_name.replace("Phòng ", "")}
                        </th>
                      ))}
                    </tr>
                    {/* Row 2: Thứ / Ngày / Slots */}
                    <tr className="border-b border-white/10 bg-white/3">
                      <th className="sticky left-0 z-30 w-[3.1rem] min-w-[3.1rem] bg-[#1f1428] py-1.5 px-1 border-r border-white/10 text-[11px] font-bold text-white/60 text-center">Thứ</th>
                      <th className="sticky left-[3.1rem] z-30 w-[3.4rem] min-w-[3.4rem] bg-[#1f1428] py-1.5 px-1 border-r border-white/10 text-[11px] font-bold text-white/60 text-center">Ngày</th>
                      {calendarRooms.map((room) =>
                        getRoomSlots(room.card_name).map((slot, sIdx) => (
                          <th
                            key={`${room.id}-slot-head-${sIdx}`}
                            className="py-1.5 px-1 border-r border-white/10 text-[10px] font-medium text-white/70 text-center min-w-[82px]"
                          >
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <span className="font-semibold text-white/95 tracking-tighter text-[9.5px]">{slot.label}</span>
                              <span className="flex items-center gap-0.5 text-[8.5px] font-bold text-white/40 tracking-tighter">
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
                        <td className="sticky left-0 z-10 w-[3.1rem] min-w-[3.1rem] bg-[#1b1023] py-1.5 px-1 text-center border-r border-white/10 font-bold text-xs text-white/80">
                          <span className={date.label === "Hôm nay" ? "text-pink-400 font-extrabold" : ""}>
                            {date.label}
                          </span>
                        </td>
                        <td className="sticky left-[3.1rem] z-10 w-[3.4rem] min-w-[3.4rem] bg-[#1b1023] py-1.5 px-1 text-center border-r border-white/10 font-bold text-xs text-white/80">
                          <span className={date.label === "Hôm nay" ? "text-pink-400 font-extrabold" : ""}>
                            {date.dateLabel}
                          </span>
                        </td>
                        {calendarRooms.map((room) => {
                          const slots = getRoomSlots(room.card_name);
                          return slots.map((slot, slotIndex) => {
                            const id = `${room.id}-${date.iso}-${slotIndex}`;
                            const booked = isSlotBooked(room.card_name, dayIndex, slotIndex);
                            const past = !booked && isSlotPast(dayIndex, slot.label);
                            const selected = selectedSlots.some((item) => item.id === id);
                            const promo = isSlotPromo(room.card_name, dayIndex, slotIndex);
                            const hasBlindBag = isSlotBlindBag(room.card_name, dayIndex, slotIndex);
                            const price = slot.isOvernight ? room.full_day_price : room.price_from;

                            return (
                              <td key={id} className="py-1 px-1 text-center border-r border-white/5 align-middle min-w-[82px]">
                                <button
                                  disabled={booked || past}
                                  onClick={() =>
                                    toggleSlot({
                                      id,
                                      room,
                                      date: date.label === "Hôm nay" ? "Hôm nay" : `${date.label}, ${date.dateLabel}`,
                                      dateIso: date.iso,
                                      time: `${slot.label} (${slot.duration})`,
                                      price,
                                      position: dayIndex * slots.length + slotIndex,
                                    })
                                  }
                                  className={`
                                    w-14 h-9 rounded-xl transition-all duration-200 flex items-center justify-center relative cursor-pointer outline-none border mx-auto
                                    ${
                                      booked
                                        ? "bg-rose-500 border-transparent cursor-not-allowed shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"
                                        : past
                                          ? "bg-white/5 border-transparent cursor-not-allowed opacity-30"
                                          : selected
                                            ? "bg-yellow-400 border-yellow-300 text-black font-black shadow-[0_0_10px_rgba(234,179,8,0.4)] hover:bg-yellow-300"
                                            : promo
                                              ? "border-transparent bg-white/5 hover:bg-white/10 ring-1 ring-pink-500/50 shadow-[0_0_8px_rgba(244,63,94,0.15)]"
                                              : "border-rose-500/60 bg-white/5 hover:bg-white/10 hover:border-rose-400"
                                    }
                                  `}
                                  title={booked ? "Đã đặt" : past ? "Đã qua" : `Khung giờ ${slot.label} - Giá: ${money(price)}đ`}
                                >
                                  {booked ? (
                                    <span className="text-[10px] font-bold text-white/50">-</span>
                                  ) : selected ? (
                                    <span className="text-[9.5px] font-black text-black">
                                      {money(price)}đ
                                    </span>
                                  ) : (
                                    <>
                                      {hasBlindBag && (
                                        <div className="absolute inset-0 flex items-center justify-center animate-float">
                                          <BlindBagIcon size={18} />
                                        </div>
                                      )}
                                      <span className="opacity-0 hover:opacity-100 absolute inset-0 flex items-center justify-center text-[9px] font-extrabold bg-slate-900/90 text-white rounded-xl transition-opacity duration-150">
                                        {money(price)}đ
                                      </span>
                                    </>
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

            <RoomMenuOptions
              branchId={activeBranchId}
              onMenuItemsChange={(items, total) => {
                setSelectedMenuItems(items);
                setMenuTotal(total);
              }}
            />

            {/* Selected summary details block */}
            {selectedSlots.length > 0 && (
              <div id="booking-summary" className="scroll-mt-28 rounded-3xl p-6 border-2 border-white/20 bg-[#1b111f] shadow-[6px_6px_0px_rgba(255,255,255,0.05)]">
                <h3 className="text-base font-extrabold text-pink-200 border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                  <Sparkles size={16} /> Chi tiết khung giờ đã chọn
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <SummaryRow icon={BedDouble} label="Phòng" value={selectedSummary?.room ?? "Chưa chọn"} />
                  <SummaryRow icon={MapPin} label="Chi nhánh" value={selectedSummary?.branch ?? currentBranch?.name ?? "Chưa chọn"} />
                  <SummaryRow icon={CalendarDays} label="Ngày" value={selectedSummary?.date ?? "Chưa chọn"} />
                  <SummaryRow icon={Clock3} label="Khung giờ" value={selectedSummary?.time ?? "Chưa chọn"} />
                </div>
                <div className="mt-4 flex flex-wrap gap-4 justify-between border-t border-white/5 pt-4 text-sm text-white/70">
                  <div className="flex gap-6">
                    <div>Giá gốc: <span className="text-white font-bold">{money(subtotal)}đ</span></div>
                    {menuTotal > 0 && (
                      <div className="text-yellow-200">Menu items: <span className="font-bold">+{money(menuTotal)}đ</span></div>
                    )}
                    {selectedSlots.length > 1 && (
                      <>
                        <div className="text-emerald-300">Ưu đãi: <span className="font-bold">-{money(subtotal * discountRate)}đ ({Math.round(discountRate * 100)}%)</span></div>
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
                ** Khách hàng được giảm 5% và tặng thêm 30 Phút khi book 2 khung giờ, 10% và 60 Phút khi book 3 hoặc 4 khung giờ
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="w-full border-t-2 border-white/10 bg-[#140a16] mt-16 pb-20 md:pb-6">
        <div className="mx-auto w-[min(100%-2rem,1360px)] py-12 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
          {/* Slogan and Brand Column */}
          <div className="space-y-4">
            <div className="block">
              <BrandWordmark />
            </div>
            <p className="text-xs text-white/60 font-semibold leading-relaxed max-w-[32ch]">
              Không gian nghỉ ngơi riêng tư hoàn hảo với quy trình tự động check-in 24/7 siêu tốc. Tiện nghi, hiện đại và bảo mật tuyệt đối.
            </p>
            <div className="flex gap-3">
              <span className="bg-pink-600/10 text-pink-300 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border border-pink-500/30">
                Bảo mật 100%
              </span>
              <span className="bg-yellow-500/10 text-yellow-300 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border border-yellow-500/30">
                Ảnh thực tế
              </span>
            </div>
          </div>

          {/* Quick links Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">
              Liên kết nhanh
            </h4>
            <ul className="space-y-2 text-xs font-bold text-white/70">
              <li>
                <a href="#top" className="hover:text-pink-300 transition-colors">
                  Trang chủ
                </a>
              </li>
              <li>
                <Link href="/checking" className="hover:text-pink-300 transition-colors">
                  Tra cứu đặt phòng
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-pink-300 transition-colors">
                  Hệ thống chi nhánh
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Hotline / Zalo Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white/50 uppercase tracking-widest">
              Chi nhánh đang chọn
            </h4>
            <div className="space-y-2 text-xs font-bold">
              <p className="text-white text-xs font-black mb-1">
                {currentBranch?.name ?? "Lavie Home"}
              </p>
              <a 
                href={`tel:${compactPhone(currentBranch?.hotline ?? "0909123456")}`}
                className="flex items-center gap-2 text-pink-300 hover:text-pink-400 transition-colors"
              >
                <Phone size={14} />
                Hotline: {currentBranch?.hotline ?? "0909 123 456"}
              </a>
              <a 
                href={`https://zalo.me/${compactPhone(currentBranch?.hotline ?? "0909123456")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-300 hover:text-blue-400 transition-colors"
              >
                <MessageCircle size={14} />
                Nhắn Zalo hỗ trợ 24/7
              </a>
              {currentBranch?.google_maps_link && (
                <a 
                  href={currentBranch.google_maps_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-yellow-200 hover:text-yellow-300 transition-colors"
                >
                  <MapPin size={14} />
                  Xem bản đồ chỉ đường
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom copyright area */}
        <div className="border-t border-white/5 py-6 text-center text-[10px] font-bold text-white/40 uppercase tracking-widest">
          © 2025 Lavie Home. Tất cả quyền được bảo lưu.
        </div>
      </footer>

      <div className="fixed bottom-7 right-5 z-40 hidden flex-col gap-3 md:flex">
        <a className="float-button bg-slate-700" href="#top" aria-label="Lên đầu trang">
          <ChevronUp size={22} />
        </a>
        <a className="float-button bg-emerald-500" href={`tel:${compactPhone(currentBranch?.hotline ?? "0909123456")}`} aria-label="Gọi ngay">
          <Phone size={22} />
        </a>
        <a className="float-button bg-blue-600" href={`https://zalo.me/${compactPhone(currentBranch?.hotline ?? "0909123456")}`} aria-label="Zalo" target="_blank" rel="noopener noreferrer">
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
                {selectedSummary?.room} · {selectedSummary?.date} · {selectedSummary?.time}
              </span>
              <span className="text-xl font-black text-yellow-200">{money(grandTotal)}đ</span>
              {selectedSlots.length > 1 && (
                <span className="text-sm font-bold text-emerald-300">-{Math.round(discountRate * 100)}% + {extraMinutes} phút</span>
              )}
            </div>
            <button onClick={goToCheckout} className="primary-button !min-h-11 px-8 text-base font-extrabold uppercase tracking-wide cursor-pointer">
              Đặt phòng ngay
            </button>
          </div>
        </>
      )}

      <BottomNav hotline={currentBranch?.hotline ?? "0909123456"} />

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
              <Image
                key={src}
                src={safeImg(src)}
                alt={room.card_name}
                width={900}
                height={650}
                className="h-[360px] w-full min-w-full snap-center rounded-2xl object-cover sm:h-[520px]"
              />
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
                <span className="text-white/60">Qua đêm</span>
                <span className="font-extrabold text-pink-200">{money(room.full_day_price)}đ</span>
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {room.room_amenities.map((amenity) => {
                const Icon = amenityIcon(amenity);
                return (
                  <span key={amenity} className="inline-flex items-center gap-1.5 rounded-xl border border-pink-300/30 bg-pink-300/10 px-3 py-2 text-xs font-bold">
                    <Icon size={14} /> {amenity}
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
