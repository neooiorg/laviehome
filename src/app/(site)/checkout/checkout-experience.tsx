"use client";

import { useCallback, useState } from "react";
import type { ElementType } from "react";
import {
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Home,
  Lock,
  MapPin,
} from "lucide-react";
import { CheckoutPaymentBox } from "@/components/checkout-payment-box";
import { CheckoutForm, type CheckoutPricing } from "./checkout-form";
import { money } from "@/lib/format";

type CheckoutExperienceProps = {
  transferCode: string;
  roomName: string;
  branchName: string;
  date: string;
  timeRange: string;
  price: number;
};

export function CheckoutExperience({
  transferCode,
  roomName,
  branchName,
  date,
  timeRange,
  price,
}: CheckoutExperienceProps) {
  const [pricing, setPricing] = useState<CheckoutPricing>({
    guestCount: 2,
    surcharge: 0,
    discountPercent: 0,
    discountAmount: 0,
    finalAmount: price,
  });

  const handlePricingChange = useCallback((next: CheckoutPricing) => {
    setPricing(next);
  }, []);

  return (
    <section className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <div className="grid gap-6">
        <CheckoutForm bookingId={transferCode} price={price} onPricingChange={handlePricingChange} />
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
              <span className="font-bold text-white/80">{money(price)}đ</span>
            </div>
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
          <a className="primary-button mt-5 w-full text-center block py-3.5" href="#payment">
            <CreditCard size={17} /> Xem Thông Tin Thanh Toán
          </a>
        </section>

        <CheckoutPaymentBox
          price={pricing.finalAmount}
          transferCode={transferCode}
        />
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
