"use client";

import { useRef, useState } from "react";
import { Calendar, CheckCircle2, Clock, Hash, Home, Phone, Search, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { money } from "@/lib/format";

gsap.registerPlugin(useGSAP);

type Booking = {
  id: string;
  room_name: string;
  branch_name: string;
  date_label: string;
  time_range: string;
  amount: number;
  status: string;
  guest_count: number;
  created_at: string;
};

function statusColor(status: string) {
  if (status === "Đã xác nhận") return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (status === "Đã huỷ") return "text-red-400 border-red-500/30 bg-red-500/10";
  return "text-yellow-300 border-yellow-400/30 bg-yellow-400/10";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Đã xác nhận") return <CheckCircle2 size={15} className="text-emerald-400" />;
  if (status === "Đã huỷ") return <XCircle size={15} className="text-red-400" />;
  return <Clock size={15} className="text-yellow-300" />;
}

export default function CheckingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState("");

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(".page-panel",
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    ).fromTo(".animate-item",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" },
      "-=0.4"
    );
  }, { scope: containerRef });

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!phone.trim() && !code.trim()) {
      setError("Vui lòng nhập số điện thoại hoặc mã đặt phòng.");
      return;
    }

    setLoading(true);
    setError("");
    setBookings(null);

    try {
      const params = new URLSearchParams();
      if (phone.trim()) params.set("phone", phone.trim());
      if (code.trim()) params.set("code", code.trim());
      if (date) params.set("date", date);

      const res = await fetch(`/api/bookings?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setBookings(data.bookings ?? []);
      }
    } catch {
      setError("Không thể kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="site-shell min-h-dvh text-white" ref={containerRef}>
      <SiteHeader />
      <div className="mx-auto w-[min(100%-2rem,640px)] pb-16 pt-32">
        <section className="page-panel p-6 md:p-8">
          <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.025em] md:text-3xl text-center text-pink-100 mb-6 animate-item">
            Tra cứu đặt phòng
          </h1>

          <form className="grid gap-4" onSubmit={handleSearch}>
            <label className="grid gap-2 text-sm font-bold text-white/72 animate-item">
              Số điện thoại
              <span className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={18} />
                <input
                  type="tel"
                  className="field-input"
                  placeholder="Nhập số điện thoại đã đặt phòng"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </span>
            </label>

            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-white/35 animate-item">
              <span className="h-px flex-1 bg-white/10" /> hoặc <span className="h-px flex-1 bg-white/10" />
            </div>

            <label className="grid gap-2 text-sm font-bold text-white/72 animate-item">
              Mã đặt phòng
              <span className="relative">
                <Hash className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={18} />
                <input
                  type="text"
                  className="field-input uppercase tracking-widest"
                  placeholder="VD: LVH01000123"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </span>
            </label>

            <label className="grid gap-2 text-sm font-bold text-white/72 animate-item">
              Ngày đặt phòng (Tuỳ chọn)
              <span className="relative">
                <Calendar className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-pink-200" size={18} />
                <input
                  type="text"
                  className="field-input"
                  placeholder="VD: Thứ 7, 05/07"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </span>
            </label>

            <button
              className="primary-button mt-4 w-full animate-item"
              type="submit"
              disabled={loading}
            >
              <Search size={17} /> {loading ? "Đang tra cứu..." : "Tra cứu"}
            </button>
          </form>
        </section>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
            {error}
          </div>
        )}

        {bookings !== null && (
          <div className="mt-6 grid gap-4">
            {bookings.length === 0 ? (
              <div className="section-card p-6 text-center text-sm font-semibold text-white/50">
                Không tìm thấy đơn đặt phòng nào với số điện thoại này.
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="section-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-white/40">Mã đặt phòng</p>
                      <p className="mt-0.5 font-extrabold text-pink-300 select-all">{b.id}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ${statusColor(b.status)}`}>
                      <StatusIcon status={b.status} /> {b.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex items-center gap-2 text-white/70">
                      <Home size={14} className="text-pink-200 shrink-0" />
                      <span className="font-semibold">{b.room_name} — {b.branch_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Calendar size={14} className="text-pink-200 shrink-0" />
                      <span className="font-semibold">{b.date_label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Clock size={14} className="text-pink-200 shrink-0" />
                      <span className="font-semibold">{b.time_range}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-xs font-semibold text-white/40">
                      {b.guest_count} người · {new Date(b.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="font-extrabold text-yellow-200">{money(b.amount)}đ</span>
                  </div>

                  {b.status === "Chờ thanh toán" && (
                    <a
                      href={`/#booking`}
                      className="mt-4 block w-full rounded-xl border-2 border-yellow-400/40 bg-yellow-400/10 py-2.5 text-center text-xs font-extrabold text-yellow-300 hover:bg-yellow-400/20 transition"
                    >
                      Chuyển khoản ngay để xác nhận
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
