"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { money } from "@/lib/format";
import type { BankPaymentConfig } from "@/lib/payment-config";

const PAID_STATUSES = ["Đã thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];

type CheckoutPaymentBoxProps = {
  price: number;
  transferCode: string;
  bookingCode?: string;
  bankConfig: BankPaymentConfig;
};

export function CheckoutPaymentBox({ price, transferCode, bookingCode = transferCode, bankConfig }: CheckoutPaymentBoxProps) {
  const router = useRouter();
  const [deadline] = useState(() => Date.now() + 900_000);
  const [timeLeft, setTimeLeft] = useState(900);
  const [isPaid, setIsPaid] = useState(false);
  const isExpired = timeLeft <= 0;

  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/check-payment?booking_id=${encodeURIComponent(transferCode)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { paid?: boolean };
      if (data.paid) {
        setIsPaid(true);
        return true;
      }
    } catch {
      // Mobile often returns from a banking app with a transient network hiccup.
    }
    return false;
  }, [transferCode]);

  useEffect(() => {
    if (isPaid) return;

    const tick = () => setTimeLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();

    const timer = setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isPaid, deadline]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isPaid || isExpired) return;

    let cancelled = false;

    const check = async () => {
      if (!cancelled) await checkPaymentStatus();
    };

    void check();

    const pollTimer = setInterval(() => {
      void check();
    }, 4000);

    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    const checkOnFocus = () => void check();

    document.addEventListener("visibilitychange", checkWhenVisible);
    window.addEventListener("focus", checkOnFocus);

    const source = new EventSource(`/api/payment-events?booking_id=${encodeURIComponent(transferCode)}`);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { bookingId?: string; paymentReference?: string; status?: string };
        if (
          !cancelled &&
          (payload.bookingId?.toUpperCase() === bookingCode.toUpperCase() ||
            payload.paymentReference?.toUpperCase() === transferCode.toUpperCase()) &&
          payload.status &&
          PAID_STATUSES.includes(payload.status)
        ) {
          void checkPaymentStatus();
          setIsPaid(true);
        }
      } catch {
        // Heartbeats and malformed events are ignored.
      }
    };

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", checkWhenVisible);
      window.removeEventListener("focus", checkOnFocus);
      source.close();
    };
  }, [transferCode, bookingCode, isPaid, isExpired, checkPaymentStatus]);

  useEffect(() => {
    if (isPaid || !isExpired) return;

    const redirectTimer = setTimeout(() => router.replace("/"), 2500);

    return () => clearTimeout(redirectTimer);
  }, [isExpired, isPaid, router]);

  useEffect(() => {
    if (!isPaid) return;
    router.replace(`/checkout/success?booking_id=${encodeURIComponent(transferCode)}`);
  }, [isPaid, router, transferCode]);

  if (isPaid) {
    return (
      <section className="section-card p-6 text-center animate-fade-in md:p-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Đã nhận thanh toán</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
          Đang chuyển bạn sang trang hướng dẫn tự check-in...
        </p>
      </section>
    );
  }

  if (isExpired) {
    return (
      <section className="section-card p-6 text-center animate-fade-in md:p-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Phiên Thanh Toán Đã Hết Hạn</h2>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Mã đặt phòng <span className="font-extrabold text-pink-300">{bookingCode}</span> đã quá thời gian giữ chỗ.
          Vui lòng chọn lại khung giờ và đặt phòng mới.
        </p>
        <p className="mt-4 text-xs font-semibold text-white/60">Đang chuyển bạn về trang chủ...</p>
        <Link className="primary-button mt-6 block w-full py-3.5 text-center" href="/">
          Về Trang Chủ
        </Link>
      </section>
    );
  }

  return (
    <section id="payment" className="section-card scroll-mt-28 p-6 md:p-8">
      <h2 className="text-lg font-extrabold tracking-[-0.02em] text-white">Thanh Toán Đặt Phòng</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-white/58">
        Hệ thống sẽ tự động duyệt trong 5 giây sau khi nhận được chuyển khoản.
      </p>

      <div className="mt-4 rounded-2xl border-2 border-yellow-200/30 bg-yellow-200/5 p-4 text-center shadow-[3px_3px_0px_rgba(254,240,138,0.1)]">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-yellow-200">Thời gian còn lại</p>
        <p className="mt-1 text-2xl font-extrabold text-white">
          {timeLeft > 0 ? formatTime(timeLeft) : "Đã hết hạn"}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white p-4 shadow-[4px_4px_0px_rgba(255,255,255,0.05)] sm:p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.vietqr.io/image/${bankConfig.bankCode}-${bankConfig.accountNumber}-compact2.png?amount=${price}&addInfo=${encodeURIComponent(transferCode)}&accountName=${encodeURIComponent(bankConfig.accountName)}`}
          alt="Mã QR Chuyển Khoản VietQR"
          className="block h-auto w-full max-w-[260px] rounded-lg"
        />
      </div>

      <div className="mt-5 grid gap-3 text-sm">
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/60">Ngân hàng thụ hưởng</span>
          <span className="font-bold text-white">{bankConfig.bankName}</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/60">Số tài khoản</span>
          <span className="font-bold text-white select-all">{bankConfig.accountNumber}</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/60">Chủ tài khoản</span>
          <span className="font-bold text-white">{bankConfig.accountName}</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/60">Nội dung chuyển khoản</span>
          <span className="font-extrabold text-pink-300 select-all">{transferCode}</span>
        </div>
        <div className="flex justify-between pb-2">
          <span className="text-white/60">Tổng thanh toán</span>
          <span className="text-base font-extrabold text-yellow-200">{money(price)}đ</span>
        </div>
      </div>

      <Link
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-white/20 bg-white/5 px-6 text-sm font-extrabold text-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)] transition-all duration-150 hover:-translate-y-0.5 hover:border-white hover:shadow-[5px_5px_0px_white]"
        href="/#booking"
      >
        Hủy & Đặt Đơn Khác
      </Link>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-pink-100">
          <ShieldCheck size={18} className="text-pink-300" /> Hướng Dẫn Thanh Toán
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs font-semibold leading-5 text-white/62">
          <li>Mở ứng dụng ngân hàng của bạn.</li>
          <li>Quét mã QR bên trên để tự động điền thông tin hoặc nhập tay nội dung chuyển khoản.</li>
          <li>Nội dung chuyển khoản cần viết in hoa chính xác chữ cái.</li>
          <li>Sau khi chuyển khoản thành công, hệ thống sẽ tự động xác nhận trong giây lát.</li>
        </ol>
      </div>
    </section>
  );
}
