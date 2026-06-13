"use client";

import Image from "next/image";
import Link from "next/link";
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
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import type { ElementType } from "react";
import { useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { activeBranches, compactPhone, money, Room, roomsByBranch } from "@/lib/tete-data";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

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

function makeDates() {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      iso: date.toISOString().slice(0, 10),
      label: index === 0 ? "Hôm nay" : formatter.format(date),
    };
  });
}

function isBooked(roomId: number, dayIndex: number, slotIndex: number) {
  return (roomId + dayIndex * 3 + slotIndex * 5) % 7 === 0;
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

export function LavieHomeApp() {
  const [activeBranchId, setActiveBranchId] = useState(activeBranches[0]?.id ?? 30);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [modalRoom, setModalRoom] = useState<Room | null>(null);
  const bookingScrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".lavie-hero-copy h1", {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: "power3.out",
    })
    .from(".lavie-hero-copy p", {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power3.out",
    }, "-=0.5")
    .from(".lavie-hero-actions a", {
      opacity: 0,
      y: 15,
      duration: 0.5,
      stagger: 0.1,
      ease: "power3.out",
    }, "-=0.4")
    .from(".lavie-marquee-card", {
      opacity: 0,
      scale: 0.8,
      rotation: -10,
      duration: 0.8,
      stagger: 0.05,
      ease: "back.out(1.7)",
    }, "-=0.6");
  }, { scope: containerRef });

  useGSAP(() => {
    gsap.fromTo(".room-card-clone",
      { opacity: 0, y: 30, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power3.out" }
    );
  }, { dependencies: [activeBranchId], scope: containerRef });
  const branchRooms = useMemo(() => roomsByBranch(activeBranchId), [activeBranchId]);
  const featuredRooms = branchRooms.slice(0, 10);
  const heroMarqueeRooms = featuredRooms.slice(0, 8);
  const heroLoopRooms = [...heroMarqueeRooms, ...heroMarqueeRooms];
  const calendarRooms = branchRooms.slice(0, 8);
  const currentBranch = activeBranches.find((branch) => branch.id === activeBranchId) ?? activeBranches[0];
  const dates = useMemo(() => makeDates(), []);

  const subtotal = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
  const discountRate = selectedSlots.length === 2 ? 0.1 : selectedSlots.length === 3 ? 0.2 : 0;
  const comboTotal =
    selectedSlots.length === 4 && selectedSlots[0]
      ? selectedSlots[0].price + Math.min(selectedSlots[0].room.full_day_price, selectedSlots[0].price * 2)
      : subtotal - subtotal * discountRate;

  function switchBranch(branchId: number) {
    setActiveBranchId(branchId);
    setSelectedSlots([]);
  }

  function scrollBooking(direction: -1 | 1) {
    bookingScrollRef.current?.scrollBy({ left: direction * 420, behavior: "smooth" });
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
      price: Math.max(comboTotal, 0),
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

      <main className="pt-[68px]">
        <section className="lavie-hero-section">
          <div className="lavie-hero-shell">
            <div className="lavie-hero-copy">
              <div className="lavie-hero-kicker">
                <Sparkles size={15} />
                Lavie Home self check-in 24/7
              </div>
              <h1>
                Phòng nghỉ riêng tư,
                <span> tự check-in 24/7.</span>
              </h1>
              <p>
                Xem phòng thực tế, chọn giờ nghỉ linh hoạt và nhận thông tin phòng tự động qua điện thoại.
              </p>
              <div className="lavie-hero-actions">
                <a className="primary-button px-6" href="#booking">
                  Đặt phòng ngay
                </a>
                <a className="lavie-hero-secondary" href="#rooms">
                  Xem phòng trống
                </a>
              </div>
            </div>

            {heroLoopRooms.length ? (
              <div className="lavie-hero-marquee" aria-label="Phòng nổi bật">
                <div className="lavie-hero-marquee-track">
                  {heroLoopRooms.map((room, index) => (
                    <article key={`${room.id}-${index}`} className={`lavie-marquee-card variant-${index % 4}`}>
                      <Image
                        src={room.main_image}
                        alt={`${room.card_name} tại ${room.branch_name}`}
                        fill
                        priority={index < 4}
                        sizes="(min-width: 1024px) 210px, 150px"
                        className="object-cover"
                      />
                      <span>{room.card_name.replace("Phòng ", "")}</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {activeBranches.map((branch) => {
              const parts = branch.name.split(" - ");
              const city = parts[0];
              const address = parts.slice(1).join(" - ") || "Chi nhánh";
              const isSelected = activeBranchId === branch.id;
              
              return (
                <button
                  key={branch.id}
                  className={`flex flex-col items-start text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-pink-300 bg-gradient-to-br from-pink-500/20 to-yellow-500/5 text-white shadow-[0_0_20px_rgba(243,90,189,0.15)]"
                      : "border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:bg-white/8 hover:border-white/20"
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
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Danh sách phòng</p>
              <h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight tracking-[-0.025em] md:text-4xl">Phòng tại {currentBranch?.name}</h2>
              <p className="mt-3 max-w-[62ch] text-sm font-semibold leading-6 text-white/62 md:text-[0.95rem]">{branchRooms.length} phòng đang hiển thị từ dữ liệu gốc.</p>
            </div>
            <div className="hidden gap-2 md:flex">
              <button className="icon-button" onClick={() => document.getElementById("room-row")?.scrollBy({ left: -420, behavior: "smooth" })} aria-label="Cuộn trái">
                <ArrowLeft size={18} />
              </button>
              <button className="icon-button" onClick={() => document.getElementById("room-row")?.scrollBy({ left: 420, behavior: "smooth" })} aria-label="Cuộn phải">
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div id="room-row" className="hide-scrollbar flex snap-x gap-5 overflow-x-auto pb-6">
            {featuredRooms.map((room) => (
              <article key={room.id} className="room-card-clone snap-center">
                <Image
                  src={room.main_image}
                  alt={`${room.card_name} room`}
                  width={420}
                  height={300}
                  className="h-52 w-full rounded-2xl object-cover"
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
                <button className="primary-button mt-5 w-full" onClick={() => setModalRoom(room)}>
                  <Sparkles size={16} /> Xem ảnh & Đặt phòng
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="booking" className="mx-auto w-[min(100%-2rem,1360px)] scroll-mt-28 py-8">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Check-in tự động</p>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-[-0.025em] md:text-4xl">Đặt phòng siêu tốc</h2>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <p className="max-w-md text-sm font-semibold leading-6 text-white/62 md:text-right md:text-[0.95rem]">Chọn khung giờ và ngày bạn muốn check-in bên dưới nhé.</p>
              <div className="hidden gap-2 md:flex">
                <button className="icon-button" onClick={() => scrollBooking(-1)} aria-label="Cuộn bảng sang trái">
                  <ArrowLeft size={18} />
                </button>
                <button className="icon-button" onClick={() => scrollBooking(1)} aria-label="Cuộn bảng sang phải">
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="glass-panel booking-panel self-start rounded-3xl">
              <div ref={bookingScrollRef} className="booking-scroll">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th className="booking-date-head">Ngày / giờ</th>
                      {calendarRooms.map((room) => (
                        <th key={room.id} className="booking-room-head" data-room-name={room.card_name}>
                          {room.card_name.replace("Phòng ", "")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dates.map((date, dayIndex) =>
                      slotLabels.map((slot, slotIndex) => (
                        <tr key={`${date.iso}-${slot}`}>
                          <td className="booking-date-cell">
                            <span className="block text-yellow-200">{date.label}</span>
                            <span className="text-white/70">{slot}</span>
                          </td>
                          {calendarRooms.map((room) => {
                            const id = `${room.id}-${date.iso}-${slotIndex}`;
                            const booked = isBooked(room.id, dayIndex, slotIndex);
                            const selected = selectedSlots.some((item) => item.id === id);
                            const discounted = slotIndex >= 2;
                            return (
                              <td key={id} className="slot-cell">
                                <button
                                  disabled={booked}
                                  className={`booking-slot ${
                                    booked
                                      ? "is-booked"
                                      : selected
                                        ? "is-selected"
                                        : discounted
                                          ? "is-discounted"
                                          : "is-open"
                                  }`}
                                  onClick={() =>
                                    toggleSlot({
                                      id,
                                      room,
                                      date: date.label,
                                      dateIso: date.iso,
                                      time: slot,
                                      price: room.price_from,
                                      position: dayIndex * slotLabels.length + slotIndex,
                                    })
                                  }
                                >
                                  {booked ? "Đã đặt" : `${money(room.price_from)}đ`}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="glass-panel sticky top-24 self-start rounded-3xl p-5">
              <h3 className="border-b border-pink-300/20 pb-4 text-center text-base font-extrabold text-pink-200">
                Thông Tin Đặt Phòng
              </h3>
              <div className="mt-4 grid gap-3 text-sm">
                <SummaryRow icon={BedDouble} label="Phòng" value={selectedSummary?.room ?? "Chưa chọn"} />
                <SummaryRow icon={MapPin} label="Chi nhánh" value={selectedSummary?.branch ?? currentBranch?.name ?? "Chưa chọn"} />
                <SummaryRow icon={CalendarDays} label="Ngày" value={selectedSummary?.date ?? "Chưa chọn"} />
                <SummaryRow icon={Clock3} label="Khung giờ" value={selectedSummary?.time ?? "Chưa chọn"} />
              </div>
              <div className="mt-5 border-t border-white/10 pt-4 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Giá gốc</span>
                  <span>{money(subtotal)}đ</span>
                </div>
                {selectedSlots.length > 1 ? (
                  <div className="mt-2 flex justify-between text-emerald-300">
                    <span>Ưu đãi</span>
                    <span>{selectedSlots.length === 4 ? "Combo 4 khung" : `${Math.round(discountRate * 100)}%`}</span>
                  </div>
                ) : null}
                <div className="mt-4 flex justify-between text-base font-extrabold">
                  <span>Tổng cộng</span>
                  <span className="text-yellow-200">{money(Math.max(comboTotal, 0))}đ</span>
                </div>
              </div>
              <button
                className="primary-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!selectedSlots.length}
                onClick={goToCheckout}
              >
                <Bolt size={16} /> Xác nhận đặt phòng
              </button>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-white/75">
                <Legend color="bg-white" label="Còn trống" />
                <Legend color="bg-yellow-300" label="Đang chọn" />
                <Legend color="bg-red-500" label="Đã đặt" />
                <Legend color="bg-emerald-100" label="Đang giảm giá" />
              </div>
              <p className="mt-5 text-center text-xs leading-5 text-white/55">
                Khách hàng được giảm thêm 10% hoặc 20% trên tổng hoá đơn khi chọn book 2, 3 khung giờ.
              </p>
            </aside>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-white/55">
        © 2025 Lavie Home. Đặt phòng riêng tư, tự check-in 24/7.
      </footer>

      <div className="fixed bottom-7 right-5 z-40 hidden flex-col gap-3 md:flex">
        <a className="float-button bg-slate-700" href="#top" aria-label="Lên đầu trang">
          <ChevronUp size={22} />
        </a>
        <a className="float-button bg-emerald-500" href={`tel:${compactPhone(currentBranch?.hotline ?? "0845828676")}`} aria-label="Gọi ngay">
          <Phone size={22} />
        </a>
        <a className="float-button bg-blue-600" href={`https://zalo.me/${compactPhone(currentBranch?.hotline ?? "0845828676")}`} aria-label="Zalo">
          <MessageCircle size={20} />
        </a>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/10 bg-[#1b1024]/95 px-2 py-2 backdrop-blur-xl md:hidden">
        <a className="bottom-link" href="#rooms">
          <Home size={18} /> Trang chủ
        </a>
        <Link className="bottom-link" href="/checking">
          <Search size={18} /> Tra cứu
        </Link>
        <a className="bottom-link" href={`tel:${compactPhone(currentBranch?.hotline ?? "0845828676")}`}>
          <Phone size={18} /> Gọi ngay
        </a>
        <Link className="bottom-link" href="/contacts">
          <MapPin size={18} /> Địa chỉ
        </Link>
      </nav>

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
            {room.images.slice(0, 10).map((src) => (
              <Image
                key={src}
                src={src}
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
