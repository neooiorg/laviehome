"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Booking = {
  id: string;
  room_name: string;
  branch_name: string;
  customer_name: string;
  customer_phone: string;
  date_label: string;
  time_range: string;
  amount: number;
  status: string;
  guest_count: number;
  has_car: boolean;
  has_decoration: boolean;
  discount_code: string | null;
  notes: string | null;
  cccd_front: string | null;
  cccd_back: string | null;
  created_at: string;
};

const ADMIN_KEY = "lavie_admin_authed";

export default function AdminBookingsPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_KEY) === "1") {
      setAuthed(true);
      fetchBookings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchBookings() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings?secret=${encodeURIComponent(sessionStorage.getItem("lavie_admin_secret") ?? "")}`);
      if (res.status === 401) { setAuthed(false); sessionStorage.removeItem(ADMIN_KEY); return; }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBookings(data.bookings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("lavie_admin_secret", password);
    sessionStorage.setItem(ADMIN_KEY, "1");
    setAuthed(true);
    fetchBookings();
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0d0714] flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 rounded-2xl p-8 w-80 space-y-4">
          <h1 className="text-white font-extrabold text-xl text-center">Admin — Lavie Home</h1>
          <input
            type="password"
            placeholder="Mật khẩu admin"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white text-sm outline-none focus:border-pink-500"
            required
            autoFocus
          />
          <button type="submit" className="w-full rounded-xl bg-pink-600 py-3 text-white font-extrabold text-sm hover:bg-pink-500 transition">
            Đăng nhập
          </button>
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0714] text-white p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">📋 Quản lý Booking</h1>
          <button
            onClick={fetchBookings}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10 transition"
          >
            Làm mới
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}
        {loading && <p className="text-white/50">Đang tải...</p>}

        <div className="grid gap-4">
          {bookings.map(b => (
            <div key={b.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold text-pink-300 text-lg">{b.id}</p>
                  <p className="text-white/70 text-sm">{b.room_name} · {b.branch_name}</p>
                  <p className="text-white/50 text-xs">{b.date_label} {b.time_range}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-300 font-extrabold text-lg">{b.amount?.toLocaleString("vi-VN")}đ</p>
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${b.status === "Chờ thanh toán" ? "bg-yellow-500/20 text-yellow-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                    {b.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-1 text-sm">
                <p><span className="text-white/50">Khách:</span> <span className="font-bold">{b.customer_name || "—"}</span></p>
                <p><span className="text-white/50">SĐT:</span> <span className="font-bold">{b.customer_phone || "—"}</span></p>
                <p><span className="text-white/50">Số người:</span> {b.guest_count} {b.has_car ? "· 🚗 Xe hơi" : ""} {b.has_decoration ? "· 🎉 Trang trí" : ""}</p>
                {b.discount_code && <p><span className="text-white/50">Mã giảm:</span> <span className="text-emerald-300 font-bold">{b.discount_code}</span></p>}
                {b.notes && <p><span className="text-white/50">Ghi chú:</span> {b.notes}</p>}
              </div>

              {(b.cccd_front || b.cccd_back) && (
                <div>
                  <button
                    onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-200 transition"
                  >
                    {expanded === b.id ? "▲ Ẩn CCCD" : "▼ Xem CCCD / Bằng lái"}
                  </button>
                  {expanded === b.id && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {b.cccd_front && (
                        <div className="space-y-1">
                          <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Mặt Trước</p>
                          <a href={b.cccd_front} target="_blank" rel="noopener noreferrer">
                            <Image
                              src={b.cccd_front}
                              alt="CCCD mặt trước"
                              width={400}
                              height={250}
                              className="rounded-xl border border-white/20 object-cover w-full hover:opacity-90 transition"
                              unoptimized
                            />
                          </a>
                        </div>
                      )}
                      {b.cccd_back && (
                        <div className="space-y-1">
                          <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Mặt Sau</p>
                          <a href={b.cccd_back} target="_blank" rel="noopener noreferrer">
                            <Image
                              src={b.cccd_back}
                              alt="CCCD mặt sau"
                              width={400}
                              height={250}
                              className="rounded-xl border border-white/20 object-cover w-full hover:opacity-90 transition"
                              unoptimized
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-white/30 text-xs">{new Date(b.created_at).toLocaleString("vi-VN")}</p>
            </div>
          ))}
          {!loading && bookings.length === 0 && (
            <p className="text-white/40 text-center py-12">Chưa có booking nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}
