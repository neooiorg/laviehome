"use client";

import { useCallback, useEffect, useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Home,
  Lock,
  MapPin,
  Phone,
  QrCode,
  Search,
  ShoppingBag,
  TriangleAlert,
} from "lucide-react";
import { CheckoutPaymentBox } from "@/components/checkout-payment-box";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
  onlinePaymentEnabled: boolean;
  hotline: string;
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
  onlinePaymentEnabled,
  hotline,
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
  const [successOpen, setSuccessOpen] = useState(false);

  const handlePricingChange = useCallback((next: CheckoutPricing) => {
    setPricing(next);
  }, []);

  const handleConfirmed = useCallback(() => {
    setConfirmed(true);
    // When online payment is off, confirming the details is the end of the flow:
    // pop a success dialog telling the customer staff will reach out. When it's
    // on, we instead reveal the QR (handled by the scroll effect below).
    if (!onlinePaymentEnabled) setSuccessOpen(true);
  }, [onlinePaymentEnabled]);

  // Reveal + scroll to the payment QR only after the customer confirms their
  // details (online-payment flow only).
  useEffect(() => {
    if (!confirmed || !onlinePaymentEnabled) return;
    const id = window.setTimeout(() => {
      document.getElementById("payment")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(id);
  }, [confirmed, onlinePaymentEnabled]);

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
          {!onlinePaymentEnabled ? (
            <p className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3.5 text-center text-xs font-semibold text-amber-200">
              <TriangleAlert size={14} /> Thanh toán online tạm ngưng — nhân viên sẽ liên hệ thu tiền
            </p>
          ) : confirmed ? (
            <a className="primary-button mt-5 w-full text-center block py-3.5" href="#payment">
              <CreditCard size={17} /> Xem Thông Tin Thanh Toán
            </a>
          ) : (
            <p className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-xs font-semibold text-white/50">
              <Lock size={14} className="text-white/40" /> Điền thông tin & bấm “Xác nhận” để hiện mã thanh toán
            </p>
          )}
        </section>

        {!onlinePaymentEnabled ? (
          <section id="payment" className="section-card p-6 md:p-8 text-center scroll-mt-28">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
              <TriangleAlert size={26} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold tracking-[-0.02em] text-white">Thanh toán online tạm ngưng</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/60">
              {confirmed
                ? "Đặt phòng của bạn đã được ghi nhận. Nhân viên Lavie Home sẽ liên hệ để xác nhận và hướng dẫn thanh toán."
                : "Vui lòng điền thông tin và bấm “Xác Nhận” để giữ phòng. Nhân viên sẽ liên hệ hướng dẫn thanh toán."}
            </p>
            <a
              href={`tel:${hotline.replace(/[^0-9+]/g, "")}`}
              className="primary-button mt-5 w-full text-center block py-3.5"
            >
              <Phone size={17} /> Gọi hotline {hotline}
            </a>
          </section>
        ) : confirmed ? (
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

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="border-white/10 bg-[#1b111f] text-white sm:max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 size={36} />
            </div>
            <DialogTitle className="mt-4 text-xl font-extrabold tracking-[-0.02em] text-white">
              Đặt phòng thành công!
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm font-semibold leading-6 text-white/60">
              Thông tin của bạn đã được ghi nhận với mã{" "}
              <span className="font-extrabold text-pink-300">{transferCode}</span>. Nhân viên Lavie Home sẽ{" "}
              <span className="font-bold text-white/80">chủ động liên hệ</span> để xác nhận và hướng dẫn thanh toán.
            </DialogDescription>
            <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
              <Link href="/" className="primary-button flex-1 justify-center py-3">
                <Home size={16} /> Về trang chủ
              </Link>
              <Link
                href={`/checking?code=${encodeURIComponent(transferCode)}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-white/5 py-3 text-sm font-extrabold text-white transition-all duration-150 hover:border-white hover:bg-white/10"
              >
                <Search size={16} /> Tra cứu đơn
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
