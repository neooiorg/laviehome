"use client";

import { useCallback, useEffect, useState } from "react";
import type { ElementType } from "react";
import {
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Home,
  Lock,
  MapPin,
  QrCode,
  ShoppingBag,
} from "lucide-react";
import { CheckoutPaymentBox } from "@/components/checkout-payment-box";
import { CheckoutForm, type CheckoutPricing } from "./checkout-form";
import { money } from "@/lib/format";

type CheckoutMenuItem = {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
};

type CheckoutExperienceProps = {
  transferCode: string;
  roomName: string;
  branchName: string;
  date: string;
  timeRange: string;
  price: number;
  roomPrice: number;
  menuItems: CheckoutMenuItem[];
};

export function CheckoutExperience({
  transferCode,
  roomName,
  branchName,
  date,
  timeRange,
  price,
  roomPrice,
  menuItems,
}: CheckoutExperienceProps) {
  const [pricing, setPricing] = useState<CheckoutPricing>({
    guestCount: 2,
    surcharge: 0,
    discountPercent: 0,
    discountAmount: 0,
    finalAmount: price,
  });
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  const handlePricingChange = useCallback((next: CheckoutPricing) => {
    setPricing(next);
  }, []);

  const handleConfirmed = useCallback(() => setConfirmed(true), []);

  // Reveal + scroll to the payment QR only after the customer confirms their
  // details, so the page doesn't show a payment box before there's anything to pay.
  useEffect(() => {
    if (!confirmed) return;
    const id = window.setTimeout(() => {
      document.getElementById("payment")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(id);
  }, [confirmed]);

  const hasValidImage = (item: CheckoutMenuItem) =>
    !!item.image_url &&
    !failedImages.has(item.id) &&
    (item.image_url.startsWith("http") || item.image_url.startsWith("/"));

  return (
    <section className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <div className="grid gap-6">
        <CheckoutForm
          bookingId={transferCode}
          price={price}
          onPricingChange={handlePricingChange}
          onConfirmed={handleConfirmed}
        />
      </div>

      <aside className="grid h-fit gap-6 lg:sticky lg:top-28">
        <section className="section-card p-6 md:p-8">
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em]">
            <FileText className="text-yellow-200" size={21} /> Tóm Tắt Đặt Phòng
          </h2>
          <div className="mt-5 grid gap-3 text-sm">
            <CheckoutLine icon={Home} label="Phòng" value={roomName} />
            <CheckoutLine icon={MapPin} label="Chi nhánh" value={branchName} />
            <CheckoutLine icon={CalendarDays} label="Lịch Đặt" value={date} />
            <CheckoutLine icon={Clock3} label="Khung giờ" value={timeRange} />
          </div>
          <div className="mt-5 border-t border-white/10 pt-5 space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-white/62">
              <span>Giá phòng</span>
              <span className="font-bold text-white/80">{money(roomPrice)}đ</span>
            </div>
            {menuItems.length > 0 && (
              <div className="space-y-2.5 rounded-2xl bg-white/5 px-4 py-3.5">
                <p className="flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-white/38">
                  <ShoppingBag size={14} className="text-pink-200" /> Menu đã chọn ({menuItems.length})
                </p>
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {hasValidImage(item) ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url!}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={() => setFailedImages((prev) => new Set([...prev, item.id]))}
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
                        🛒
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white/85">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 truncate text-xs font-semibold text-white/40">{item.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-sm font-bold text-white/80">
                      {money(item.price)}đ
                    </span>
                  </div>
                ))}
              </div>
            )}
            {pricing.surcharge > 0 && (
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-orange-300">Phụ thu {pricing.guestCount} người</span>
                <span className="text-orange-300">+{money(pricing.surcharge)}đ</span>
              </div>
            )}
            {pricing.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-emerald-300">Giảm {pricing.discountPercent}%</span>
                <span className="text-emerald-300">-{money(pricing.discountAmount)}đ</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm font-bold text-white/62">
              <span>Tạm Tính</span>
              <span className="text-xl font-extrabold text-yellow-200">{money(pricing.finalAmount)}đ</span>
            </div>
            <p className="flex items-center gap-2 text-xs font-semibold text-white/48">
              <Lock size={14} className="text-cyan-300" /> Giao dịch bảo mật bằng mã hoá SSL.
            </p>
          </div>
          {confirmed ? (
            <a className="primary-button mt-5 w-full text-center block py-3.5" href="#payment">
              <CreditCard size={17} /> Xem Thông Tin Thanh Toán
            </a>
          ) : (
            <p className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-xs font-semibold text-white/50">
              <Lock size={14} className="text-white/40" /> Điền thông tin & bấm “Xác nhận” để hiện mã thanh toán
            </p>
          )}
        </section>

        {confirmed ? (
          <CheckoutPaymentBox price={pricing.finalAmount} transferCode={transferCode} />
        ) : (
          <section className="section-card p-6 md:p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-white/40">
              <QrCode size={26} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold tracking-[-0.02em] text-white">Thanh toán đặt phòng</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
              Vui lòng điền thông tin người đặt rồi bấm{" "}
              <span className="font-bold text-white/80">“Xác Nhận &amp; Chuyển Đến Thanh Toán”</span> để hiển thị mã QR
              thanh toán.
            </p>
          </section>
        )}
      </aside>
    </section>
  );
}

function CheckoutLine({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-3">
      <p className="flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-white/38">
        <Icon size={15} className="text-pink-200" /> {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-white/88">{value}</p>
    </div>
  );
}
