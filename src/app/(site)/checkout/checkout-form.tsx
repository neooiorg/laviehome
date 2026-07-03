"use client";

import { useState } from "react";
import { IdCard, Tag, Upload, UserRound } from "lucide-react";
import { money } from "@/lib/format";

type CheckoutFormProps = {
  bookingId: string;
  price: number;
};

type DiscountResult =
  | { valid: true; percent: number; description: string }
  | { valid: false; error: string };

export function CheckoutForm({ bookingId, price }: CheckoutFormProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [guestCount, setGuestCount] = useState(2);
  const [cccdFront, setCccdFront] = useState<string | null>(null);
  const [cccdBack, setCccdBack] = useState<string | null>(null);
  const [cccdFrontName, setCccdFrontName] = useState("");
  const [cccdBackName, setCccdBackName] = useState("");

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleCccdFront(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCccdFrontName(file.name);
    const b64 = await readFileAsBase64(file);
    setCccdFront(b64);
  }

  async function handleCccdBack(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCccdBackName(file.name);
    const b64 = await readFileAsBase64(file);
    setCccdBack(b64);
  }

  const surcharge = guestCount === 3 ? 50000 : guestCount === 4 ? 100000 : 0;
  const discountPercent = discountResult?.valid ? discountResult.percent : 0;
  const discountAmount = Math.round(price * discountPercent / 100);
  const finalAmount = price + surcharge - discountAmount;

  async function applyDiscount() {
    const code = discountCode.trim();
    if (!code) return;
    setValidating(true);
    try {
      const res = await fetch(`/api/discount?code=${encodeURIComponent(code)}`);
      const data: DiscountResult = await res.json();
      setDiscountResult(data);
    } catch {
      setDiscountResult({ valid: false, error: "Không thể kết nối máy chủ" });
    } finally {
      setValidating(false);
    }
  }

  function resetDiscount() {
    setDiscountCode("");
    setDiscountResult(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.currentTarget);

    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          customer_name: fd.get("customer_name"),
          customer_phone: fd.get("customer_phone"),
          guest_count: guestCount,
          notes: fd.get("notes"),
          has_car: fd.get("has_car") === "on",
          has_decoration: fd.get("has_decoration") === "on",
          discount_code: discountResult?.valid ? discountCode : null,
          amount: finalAmount,
          cccd_front: cccdFront,
          cccd_back: cccdBack,
        }),
      });

      // Increment used_count for the applied code
      if (discountResult?.valid && discountCode) {
        fetch("/api/discount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: discountCode }),
        }).catch(() => {});
      }

      setSaved(true);
      document.getElementById("payment")?.scrollIntoView({ behavior: "smooth" });
    } catch {
      document.getElementById("payment")?.scrollIntoView({ behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <section className="section-card p-6 md:p-8">
        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-[-0.025em]">
          <UserRound className="text-pink-200" size={21} /> Thông Tin Người Đặt
        </h2>
        <div className="mt-6 grid gap-5">
          <label className="grid gap-2 text-sm font-bold text-white/72">
            Họ và Tên (*)
            <input
              className="field-input !pl-5"
              name="customer_name"
              placeholder="Nhập họ và tên"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-white/72">
            Số Điện Thoại (*)
            <input
              className="field-input !pl-5"
              inputMode="tel"
              name="customer_phone"
              placeholder="Số điện thoại nhận mã mở khóa"
              required
            />
          </label>

          <div className="grid gap-3">
            <p className="text-sm font-bold text-white/72">Số Lượng Người</p>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                [2, "Đi 2 người", "Mặc định"],
                [3, "Đi 3 người", "Phụ thu 50.000đ"],
                [4, "Đi 4 người", "Phụ thu 100.000đ"],
              ].map(([value, title, note]) => (
                <label
                  key={value}
                  className="cursor-pointer rounded-2xl border-2 border-white/10 bg-white/5 p-4 transition duration-150 block has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/10 has-[:checked]:shadow-[4px_4px_0px_#f35abd] has-[:checked]:-translate-y-0.5 hover:border-white hover:bg-white/10"
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="guest_count"
                    value={value}
                    checked={guestCount === value}
                    onChange={() => setGuestCount(value as number)}
                  />
                  <span className="block font-extrabold text-white">{title}</span>
                  <span className="mt-1 block text-xs font-bold text-white/52">{note}</span>
                </label>
              ))}
            </div>
            <p className="text-xs font-semibold text-white/48">Trẻ em trên 10 tuổi tính như 1 slot ngồi.</p>
          </div>

          <label className="grid gap-2 text-sm font-bold text-white/72">
            Ghi Chú/Yêu Cầu Riêng (Tuỳ Chọn)
            <textarea
              className="min-h-28 rounded-2xl border-2 border-white/15 bg-white/5 px-5 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/35 focus:border-pink-500 focus:bg-white/10 focus:shadow-[3px_3px_0px_#f35abd]"
              name="notes"
              placeholder="Ví dụ: đến muộn 10 phút, cần hỗ trợ thêm..."
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border-2 border-white/10 bg-white/5 p-4 text-sm font-bold text-white/72 hover:border-white/20 transition-all duration-150 cursor-pointer has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/5">
            <input className="mt-1 accent-pink-500" type="checkbox" name="has_car" />
            <span>Đến bằng xe hơi (Để nhân viên hỗ trợ chỗ đỗ xe)</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border-2 border-white/10 bg-white/5 p-4 text-sm font-bold text-white/72 hover:border-white/20 transition-all duration-150 cursor-pointer has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/5">
            <input className="mt-1 accent-pink-500" type="checkbox" name="has_decoration" />
            <span>Gói trang trí Sinh nhật, Ngày Lễ,... (tuỳ chọn, sẽ có nhân viên liên hệ tư vấn gói)</span>
          </label>
        </div>
      </section>

      <section className="section-card p-6 md:p-8">
        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-[-0.025em]">
          <IdCard className="text-pink-200" size={21} /> Xác Thực Căn Cước
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-white/58">
          Dữ liệu thẻ CCCD của bạn sẽ được mã hoá và tự động xoá sau khi check-out.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="checkout-upload">
            {cccdFront ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cccdFront} alt="CCCD mặt trước" className="h-24 w-full object-cover rounded-xl" />
            ) : (
              <Upload size={24} className="text-pink-300" />
            )}
            <span className={cccdFrontName ? "text-emerald-300 text-xs truncate max-w-full" : ""}>
              {cccdFrontName || "Mặt Trước CCCD / Bằng Lái"}
            </span>
            <input type="file" accept="image/*" onChange={handleCccdFront} />
          </label>
          <label className="checkout-upload">
            {cccdBack ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cccdBack} alt="CCCD mặt sau" className="h-24 w-full object-cover rounded-xl" />
            ) : (
              <Upload size={24} className="text-pink-300" />
            )}
            <span className={cccdBackName ? "text-emerald-300 text-xs truncate max-w-full" : ""}>
              {cccdBackName || "Mặt Sau CCCD / Bằng Lái"}
            </span>
            <input type="file" accept="image/*" onChange={handleCccdBack} />
          </label>
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm font-semibold leading-6 text-white/62 cursor-pointer hover:text-white transition-colors">
          <input className="mt-1 accent-pink-500" type="checkbox" required />
          <span>
            Tôi đồng ý với{" "}
            <span className="text-yellow-200 font-bold">Điều khoản và điều kiện</span> và đồng ý
            bảo lãnh cho bạn cùng phòng.
          </span>
        </label>
      </section>

      <section className="section-card p-6 md:p-8">
        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-[-0.025em]">
          <Tag className="text-pink-200" size={21} /> Mã Giảm Giá
        </h2>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-xl border-2 border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-yellow-400 focus:bg-white/10 transition uppercase tracking-widest disabled:opacity-50"
            placeholder="Nhập mã khuyến mãi..."
            maxLength={20}
            disabled={discountResult?.valid === true}
            value={discountCode}
            onChange={(e) => {
              setDiscountCode(e.target.value.toUpperCase());
              setDiscountResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyDiscount())}
          />
          {discountResult?.valid ? (
            <button
              type="button"
              onClick={resetDiscount}
              className="rounded-xl border-2 border-white/20 bg-white/5 px-4 py-2.5 text-xs font-extrabold text-white/60 hover:bg-white/10 transition"
            >
              Xoá
            </button>
          ) : (
            <button
              type="button"
              disabled={!discountCode.trim() || validating}
              onClick={applyDiscount}
              className="rounded-xl border-2 border-yellow-400/60 bg-yellow-400/10 px-4 py-2.5 text-xs font-extrabold text-yellow-300 hover:bg-yellow-400/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {validating ? "..." : "Áp Dụng"}
            </button>
          )}
        </div>

        {(discountResult?.valid || surcharge > 0) && (
          <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 space-y-1">
            {discountResult?.valid && (
              <p className="text-sm font-extrabold text-emerald-300">
                ✓ {discountResult.description}
              </p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 font-semibold">Giá phòng</span>
              <span className="font-bold text-white/60">{money(price)}đ</span>
            </div>
            {surcharge > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-orange-300 font-semibold">Phụ thu {guestCount} người</span>
                <span className="font-extrabold text-orange-300">+{money(surcharge)}đ</span>
              </div>
            )}
            {discountResult?.valid && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-300 font-semibold">Giảm {discountPercent}%</span>
                <span className="font-extrabold text-emerald-300">-{money(discountAmount)}đ</span>
              </div>
            )}
            <div className="flex items-center justify-between text-base border-t border-white/10 pt-2 mt-1">
              <span className="font-extrabold text-white">Tổng thanh toán</span>
              <span className="font-extrabold text-yellow-200 text-lg">{money(finalAmount)}đ</span>
            </div>
          </div>
        )}

        {discountResult && !discountResult.valid && (
          <p className="mt-2 text-sm font-bold text-red-400">
            ✗ {discountResult.error}
          </p>
        )}

        {!discountResult && (
          <p className="mt-2 text-[11px] text-white/38 font-semibold">
            Nhập mã và nhấn Áp Dụng để kiểm tra ngay.
          </p>
        )}
      </section>

      <button
        type="submit"
        disabled={saving || saved}
        className="primary-button w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "Đang lưu..." : saved ? "Đã xác nhận — Chuyển đến thanh toán ↓" : "Xác Nhận & Chuyển Đến Thanh Toán"}
      </button>
    </form>
  );
}
