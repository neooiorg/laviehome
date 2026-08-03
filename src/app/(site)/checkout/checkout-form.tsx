"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IdCard, Mail, Tag, Upload, UserRound } from "lucide-react";

import { money } from "@/lib/format";

export type CheckoutPricing = {
  guestCount: number;
  surcharge: number;
  discountPercent: number;
  discountAmount: number;
  finalAmount: number;
};

type CheckoutFormProps = {
  bookingId: string;
  roomId: number | null;
  roomName: string;
  branchId: string;
  branchName: string;
  date: string;
  stayDate: string | null;
  timeRange: string;
  timeslotIds: string;
  /** Full quote (room + menu) — the total the customer pays. */
  price: number;
  /** Room-only portion — the discount code applies to this, never to menu items. */
  roomPrice: number;
  onPricingChange?: (pricing: CheckoutPricing) => void;
  onPreparePaymentReference?: () => string | null;
  onPaymentDetailsChanged?: () => void;
  onConfirmed?: (paymentReference?: string | null) => void;
  onlinePaymentEnabled?: boolean;
  paymentNeedsRefresh?: boolean;
};

type DiscountResult =
  | { valid: true; percent: number; description: string }
  | { valid: false; error: string };

export function CheckoutForm({
  bookingId,
  roomId,
  roomName,
  branchId,
  branchName,
  date,
  stayDate,
  timeRange,
  timeslotIds,
  price,
  roomPrice,
  onPricingChange,
  onPreparePaymentReference,
  onPaymentDetailsChanged,
  onConfirmed,
  onlinePaymentEnabled = true,
  paymentNeedsRefresh = false,
}: CheckoutFormProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [hasCar, setHasCar] = useState(false);
  const [hasDecoration, setHasDecoration] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [guestCount, setGuestCount] = useState(2);
  const [cccdFront, setCccdFront] = useState<string | null>(null);
  const [cccdBack, setCccdBack] = useState<string | null>(null);
  const [cccdFrontName, setCccdFrontName] = useState("");
  const [cccdBackName, setCccdBackName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const reportedDiscountUseRef = useRef<string | null>(null);

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleCccdFront(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCccdFrontName(file.name);
    setCccdFront(await readFileAsBase64(file));
    setSaved(false);
  }

  async function handleCccdBack(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCccdBackName(file.name);
    setCccdBack(await readFileAsBase64(file));
    setSaved(false);
  }

  const surcharge = guestCount === 3 ? 50000 : guestCount === 4 ? 100000 : 0;
  const discountPercent = discountResult?.valid ? discountResult.percent : 0;
  // Discount applies to the room only — never to menu items (đồ ăn, bao cao su, gel…).
  const discountAmount = Math.round((roomPrice * discountPercent) / 100);
  const finalAmount = price + surcharge - discountAmount;
  const appliedDiscountCode = discountResult?.valid ? discountCode.trim().toUpperCase() : null;
  const menuItemsTotal = Math.max(Math.round(price - roomPrice), 0);

  useEffect(() => {
    onPricingChange?.({ guestCount, surcharge, discountPercent, discountAmount, finalAmount });
  }, [discountAmount, discountPercent, finalAmount, guestCount, onPricingChange, surcharge]);

  async function applyDiscount() {
    const code = discountCode.trim();
    if (!code) return;

    setValidating(true);

    try {
      const res = await fetch(`/api/discount?code=${encodeURIComponent(code)}`);
      const data: DiscountResult = await res.json();
      setDiscountResult(data);
      setSaved(false);
      if (data.valid) onPaymentDetailsChanged?.();
    } catch {
      setDiscountResult({ valid: false, error: "Không thể kết nối máy chủ" });
    } finally {
      setValidating(false);
    }
  }

  function resetDiscount() {
    setDiscountCode("");
    setDiscountResult(null);
    setSaved(false);
    onPaymentDetailsChanged?.();
  }

  const buildBookingPayload = useCallback((nextPaymentReference?: string | null, clearPaymentReference = false) => {
    return {
      id: bookingId,
      room_id: roomId,
      room_name: roomName,
      branch_id: branchId || null,
      branch_name: branchName,
      stay_date: stayDate,
      date_label: date,
      time_range: timeRange,
      timeslot_ids: timeslotIds,
      quoted_amount: Math.max(Math.round(roomPrice), 0),
      menu_items_total: menuItemsTotal,
      customer_name: customerName.trim() || null,
      customer_phone: customerPhone.trim() || null,
      customer_email: customerEmail.trim() || null,
      guest_count: guestCount,
      notes: notes.trim() || null,
      has_car: hasCar,
      has_decoration: hasDecoration,
      discount_code: appliedDiscountCode,
      cccd_front: cccdFront,
      cccd_back: cccdBack,
      payment_reference: nextPaymentReference ?? null,
      clear_payment_reference: clearPaymentReference,
    };
  }, [
    appliedDiscountCode,
    bookingId,
    branchId,
    branchName,
    cccdBack,
    cccdFront,
    customerEmail,
    customerName,
    customerPhone,
    date,
    guestCount,
    hasCar,
    hasDecoration,
    menuItemsTotal,
    notes,
    roomId,
    roomName,
    roomPrice,
    stayDate,
    timeRange,
    timeslotIds,
  ]);

  const syncPricingWithServer = useCallback((amount: number) => {
    onPricingChange?.({
      guestCount,
      surcharge,
      discountPercent,
      discountAmount,
      finalAmount: amount,
    });
  }, [discountAmount, discountPercent, guestCount, onPricingChange, surcharge]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const nextPaymentReference = onlinePaymentEnabled ? onPreparePaymentReference?.() ?? bookingId : null;
      const payload = buildBookingPayload(nextPaymentReference, false);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.status === 409) {
        setConflictError(data.error ?? "Khung giờ đã được đặt. Vui lòng chọn khung giờ khác.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error ?? "Không thể lưu booking.");
      }

      setConflictError(null);

      if (typeof data.amount === "number") {
        syncPricingWithServer(data.amount);
      }

      if (discountResult?.valid && appliedDiscountCode && reportedDiscountUseRef.current !== appliedDiscountCode) {
        reportedDiscountUseRef.current = appliedDiscountCode;
        fetch("/api/discount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: appliedDiscountCode }),
        }).catch(() => {});
      }

      setSaved(true);
      onConfirmed?.(nextPaymentReference);
    } catch {
      if (onlinePaymentEnabled) {
        setConflictError("Không thể cập nhật mã thanh toán. Vui lòng bấm xác nhận lại sau vài giây.");
      } else {
        // Offline bookings can still be followed up manually by staff.
        onConfirmed?.(null);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid min-w-0 grid-cols-1 gap-6" onSubmit={handleSubmit}>
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
              value={customerName}
              onChange={(event) => {
                setCustomerName(event.target.value);
                setSaved(false);
              }}
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
              value={customerPhone}
              onChange={(event) => {
                setCustomerPhone(event.target.value);
                setSaved(false);
              }}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-white/72">
            Email nhận thông tin đặt phòng (*)
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
              <input
                className="field-input !pl-11"
                type="email"
                name="customer_email"
                placeholder="emailcuaban@gmail.com"
                required
                value={customerEmail}
                onChange={(event) => {
                  setCustomerEmail(event.target.value);
                  setSaved(false);
                }}
              />
            </div>
            <span className="text-xs font-semibold text-white/45">
              Lavie Home sẽ gửi mã nhận phòng, mật khẩu cửa và hướng dẫn check-in qua email này sau khi thanh toán thành công.
            </span>
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
                  className="block cursor-pointer rounded-2xl border-2 border-white/10 bg-white/5 p-4 transition duration-150 has-[:checked]:-translate-y-0.5 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/10 has-[:checked]:shadow-[4px_4px_0px_#f35abd] hover:border-white hover:bg-white/10"
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="guest_count"
                    value={value}
                    checked={guestCount === value}
                    onChange={() => {
                      setGuestCount(value as number);
                      setSaved(false);
                      onPaymentDetailsChanged?.();
                    }}
                  />
                  <span className="block font-extrabold text-white">{title}</span>
                  <span className="mt-1 block text-xs font-bold text-white/52">{note}</span>
                </label>
              ))}
            </div>
            <p className="text-xs font-semibold text-white/48">Trẻ em trên 10 tuổi tính như 1 slot người.</p>
          </div>

          <label className="grid gap-2 text-sm font-bold text-white/72">
            Ghi Chú/Yêu Cầu Riêng (Tuỳ Chọn)
            <textarea
              className="min-h-28 rounded-2xl border-2 border-white/15 bg-white/5 px-5 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/35 focus:border-pink-500 focus:bg-white/10 focus:shadow-[3px_3px_0px_#f35abd]"
              name="notes"
              placeholder="Ví dụ: đến muộn 10 phút, cần hỗ trợ thêm..."
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setSaved(false);
              }}
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-white/10 bg-white/5 p-4 text-sm font-bold text-white/72 transition-all duration-150 hover:border-white/20 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/5">
            <input
              className="mt-1 accent-pink-500"
              type="checkbox"
              name="has_car"
              checked={hasCar}
              onChange={(event) => {
                setHasCar(event.target.checked);
                setSaved(false);
              }}
            />
            <span>Đến bằng xe hơi (Để nhân viên hỗ trợ chỗ đỗ xe)</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-white/10 bg-white/5 p-4 text-sm font-bold text-white/72 transition-all duration-150 hover:border-white/20 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-500/5">
            <input
              className="mt-1 accent-pink-500"
              type="checkbox"
              name="has_decoration"
              checked={hasDecoration}
              onChange={(event) => {
                setHasDecoration(event.target.checked);
                setSaved(false);
              }}
            />
            <span>Gói trang trí Sinh nhật, Ngày lễ,... (tuỳ chọn, sẽ có nhân viên liên hệ tư vấn gói)</span>
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
              <img src={cccdFront} alt="CCCD mặt trước" className="aspect-[1.585/1] w-full rounded-xl bg-black/25 object-contain" />
            ) : (
              <Upload size={24} className="text-pink-300" />
            )}
            <span className={cccdFrontName ? "max-w-full truncate text-xs text-emerald-300" : ""}>
              {cccdFrontName || "Mặt Trước CCCD / Bằng Lái"}
            </span>
            <input type="file" accept="image/*" onChange={handleCccdFront} />
          </label>
          <label className="checkout-upload">
            {cccdBack ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cccdBack} alt="CCCD mặt sau" className="aspect-[1.585/1] w-full rounded-xl bg-black/25 object-contain" />
            ) : (
              <Upload size={24} className="text-pink-300" />
            )}
            <span className={cccdBackName ? "max-w-full truncate text-xs text-emerald-300" : ""}>
              {cccdBackName || "Mặt Sau CCCD / Bằng Lái"}
            </span>
            <input type="file" accept="image/*" onChange={handleCccdBack} />
          </label>
        </div>
        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm font-semibold leading-6 text-white/62 transition-colors hover:text-white">
          <input
            className="mt-1 accent-pink-500"
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          <span>
            Tôi đồng ý với <span className="font-bold text-yellow-200">Điều khoản và điều kiện</span> và đồng ý
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
            className="flex-1 rounded-xl border-2 border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-white outline-none transition placeholder:text-white/30 focus:border-yellow-400 focus:bg-white/10 disabled:opacity-50"
            placeholder="Nhập mã khuyến mãi..."
            maxLength={20}
            disabled={discountResult?.valid === true}
            value={discountCode}
            onChange={(event) => {
              setDiscountCode(event.target.value.toUpperCase());
              setDiscountResult(null);
              setSaved(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void applyDiscount();
              }
            }}
          />
          {discountResult?.valid ? (
            <button
              type="button"
              onClick={resetDiscount}
              className="rounded-xl border-2 border-white/20 bg-white/5 px-4 py-2.5 text-xs font-extrabold text-white/60 transition hover:bg-white/10"
            >
              Xoá
            </button>
          ) : (
            <button
              type="button"
              disabled={!discountCode.trim() || validating}
              onClick={() => void applyDiscount()}
              className="rounded-xl border-2 border-yellow-400/60 bg-yellow-400/10 px-4 py-2.5 text-xs font-extrabold text-yellow-300 transition hover:bg-yellow-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {validating ? "..." : "Áp Dụng"}
            </button>
          )}
        </div>

        <p className="mt-2 text-[11px] font-semibold text-white/45">
          * Mã giảm giá chỉ áp dụng cho tiền phòng, không áp dụng cho đồ ăn, tiện ích trong menu.
        </p>

        {(discountResult?.valid || surcharge > 0) && (
          <div className="mt-3 space-y-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
            {discountResult?.valid && (
              <p className="text-sm font-extrabold text-emerald-300">✓ {discountResult.description}</p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white/60">Giá phòng</span>
              <span className="font-bold text-white/60">{money(price)}đ</span>
            </div>
            {surcharge > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-orange-300">Phụ thu {guestCount} người</span>
                <span className="font-extrabold text-orange-300">+{money(surcharge)}đ</span>
              </div>
            )}
            {discountResult?.valid && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-emerald-300">Giảm {discountPercent}%</span>
                <span className="font-extrabold text-emerald-300">-{money(discountAmount)}đ</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-2 text-base">
              <span className="font-extrabold text-white">Tổng thanh toán</span>
              <span className="text-lg font-extrabold text-yellow-200">{money(finalAmount)}đ</span>
            </div>
          </div>
        )}

        {discountResult && !discountResult.valid && (
          <p className="mt-2 text-sm font-bold text-red-400">✕ {discountResult.error}</p>
        )}

        {!discountResult && (
          <p className="mt-2 text-[11px] font-semibold text-white/38">Nhập mã và nhấn Áp Dụng để kiểm tra ngay.</p>
        )}
      </section>

      {conflictError && (
        <div className="rounded-2xl border-2 border-red-500/60 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-300">
          ⚠️ {conflictError}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-2 block font-semibold text-white/70 underline"
          >
            Quay lại chọn khung giờ khác →
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || saved || !!conflictError || !acceptedTerms}
        className="primary-button w-full py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving
          ? "Đang lưu..."
          : onlinePaymentEnabled
            ? paymentNeedsRefresh
              ? "Cập Nhật Lại Mã Thanh Toán"
              : saved
              ? "Đã xác nhận — Chuyển đến thanh toán ↓"
              : "Xác Nhận & Chuyển Đến Thanh Toán"
            : saved
              ? "Đã xác nhận đặt phòng ✓"
              : "Xác Nhận Đặt Phòng"}
      </button>
    </form>
  );
}
