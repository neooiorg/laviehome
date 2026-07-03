import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CalendarMini, User } from "@medusajs/icons";
import { useEffect, useState } from "react";

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

export const config = defineRouteConfig({
  label: "Đặt Phòng",
  icon: CalendarMini,
});

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/admin/bookings")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setBookings(d.bookings ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ui-fg-base">Quản lý Đặt Phòng</h1>
        <button
          onClick={() => { setLoading(true); setError(""); fetch("/admin/bookings").then(r => r.json()).then(d => setBookings(d.bookings ?? [])).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
          className="text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-ui-bg-field border border-ui-border-error px-4 py-3 text-sm text-ui-fg-error">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-ui-fg-subtle text-sm">Đang tải...</p>
      ) : bookings.length === 0 ? (
        <p className="text-ui-fg-subtle text-sm text-center py-16">Chưa có booking nào.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-ui-border-base bg-ui-bg-base shadow-borders-base p-5 flex flex-col gap-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-mono font-semibold text-ui-fg-muted">{b.id}</span>
                  <span className="font-semibold text-ui-fg-base">{b.room_name}</span>
                  <span className="text-xs text-ui-fg-subtle">{b.branch_name} · {b.date_label} {b.time_range}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg font-bold text-ui-fg-base">{b.amount?.toLocaleString("vi-VN")}đ</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    b.status === "Chờ thanh toán"
                      ? "bg-ui-tag-orange-bg text-ui-tag-orange-text"
                      : "bg-ui-tag-green-bg text-ui-tag-green-text"
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div className="flex items-center gap-1.5 text-ui-fg-subtle">
                  <User className="shrink-0" />
                  <span className="font-medium text-ui-fg-base">{b.customer_name || "—"}</span>
                </div>
                <div className="text-ui-fg-subtle">
                  SĐT: <span className="font-medium text-ui-fg-base">{b.customer_phone || "—"}</span>
                </div>
                <div className="text-ui-fg-subtle">
                  Số người: <span className="font-medium text-ui-fg-base">{b.guest_count}</span>
                  {b.has_car && " · 🚗"}
                  {b.has_decoration && " · 🎉"}
                </div>
                {b.discount_code && (
                  <div className="text-ui-fg-subtle">
                    Mã giảm: <span className="font-medium text-ui-tag-green-text">{b.discount_code}</span>
                  </div>
                )}
                {b.notes && (
                  <div className="col-span-2 text-ui-fg-subtle">
                    Ghi chú: <span className="text-ui-fg-base">{b.notes}</span>
                  </div>
                )}
              </div>

              {/* CCCD section */}
              {(b.cccd_front || b.cccd_back) && (
                <div className="border-t border-ui-border-base pt-3">
                  <button
                    onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                    className="text-xs font-semibold text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-colors"
                  >
                    {expanded === b.id ? "▲ Ẩn CCCD / Bằng lái" : "▼ Xem CCCD / Bằng lái"}
                  </button>
                  {expanded === b.id && (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {b.cccd_front && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wider">Mặt Trước</span>
                          <a href={b.cccd_front} target="_blank" rel="noopener noreferrer">
                            <img
                              src={b.cccd_front}
                              alt="CCCD mặt trước"
                              className="w-full rounded-lg border border-ui-border-base object-cover hover:opacity-90 transition-opacity cursor-pointer"
                            />
                          </a>
                        </div>
                      )}
                      {b.cccd_back && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wider">Mặt Sau</span>
                          <a href={b.cccd_back} target="_blank" rel="noopener noreferrer">
                            <img
                              src={b.cccd_back}
                              alt="CCCD mặt sau"
                              className="w-full rounded-lg border border-ui-border-base object-cover hover:opacity-90 transition-opacity cursor-pointer"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-ui-fg-muted">{new Date(b.created_at).toLocaleString("vi-VN")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
