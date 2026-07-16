"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { money } from "@/lib/format";

type CheckoutPaymentBoxProps = {
  price: number;
  transferCode: string;
};

export function CheckoutPaymentBox({
  price,
  transferCode,
}: CheckoutPaymentBoxProps) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isPaid, setIsPaid] = useState(false);
  const isExpired = timeLeft <= 0;

  // Countdown timer — one stable interval, decrement via functional update so it
  // is NOT recreated every second (which would break other effects that depend on it).
  useEffect(() => {
    if (isPaid) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaid]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Poll payment status. Depends on `isExpired` (a boolean that flips once) rather
  // than `timeLeft` (which changes every second) so the 3s interval stays alive
  // long enough to actually fire instead of being torn down and recreated each tick.
  useEffect(() => {
    if (isPaid || isExpired) return;

    let cancelled = false;

    async function checkPayment() {
      try {
        const res = await fetch(`/api/check-payment?booking_id=${transferCode}`);
        const data = await res.json();
        if (!cancelled && data.paid) {
          setIsPaid(true);
        }
      } catch (error) {
        console.error("Failed to poll payment status:", error);
      }
    }

    // check immediately, then every 3s
    void checkPayment();
    const pollInterval = setInterval(checkPayment, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [transferCode, isPaid, isExpired]);

  useEffect(() => {
    if (!isPaid) return;

    const redirectTimer = setTimeout(() => {
      router.push(`/checking?code=${encodeURIComponent(transferCode)}`);
    }, 2500);

    return () => clearTimeout(redirectTimer);
  }, [isPaid, router, transferCode]);

  if (isPaid) {
    return (
      <section className="section-card p-6 md:p-8 text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 size={36} className="animate-bounce" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
          Thanh Toán Thành Công!
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/70">
          Hệ thống đã nhận được khoản thanh toán của bạn cho mã đặt phòng <span className="font-extrabold text-pink-300">{transferCode}</span>.
        </p>
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-left text-xs font-semibold text-emerald-300">
          Quá trình đặt phòng đã hoàn tất. Nhân viên Lavie Home sẽ liên hệ với bạn trong giây lát để cung cấp mã mở khóa thông minh. Xin cảm ơn quý khách!
        </div>
        <p className="mt-4 text-xs font-semibold text-white/60">
          Đang chuyển bạn đến trang tra cứu để xem chi tiết đặt phòng...
        </p>
        <Link
          className="primary-button mt-6 w-full text-center py-3.5 block"
          href={`/checking?code=${encodeURIComponent(transferCode)}`}
        >
          Tra Cứu Lịch Trình
        </Link>
      </section>
    );
  }

  return (
    <section id="payment" className="section-card p-6 md:p-8 scroll-mt-28">
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
      
      <div className="mt-5 border-2 border-white/20 bg-white p-5 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(255,255,255,0.05)]">
        <img
          src={`https://img.vietqr.io/image/TPB-10004406614-compact2.png?amount=${price}&addInfo=${transferCode}&accountName=TKTT%20FREEGO`}
          alt="Mã QR Chuyển Khoản VietQR"
          width={220}
          height={220}
          className="rounded-lg"
        />
      </div>

      <div className="mt-5 grid gap-3 text-sm">
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/60">Ngân hàng thụ hưởng</span>
          <span className="font-bold text-white">TPBank</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/60">Chủ tài khoản</span>
          <span className="font-bold text-white">TKTT FREEGO</span>
        </div>
        <div className="flex justify-between border-b border-white/10 pb-2">
          <span className="text-white/60">Nội dung chuyển khoản</span>
          <span className="font-extrabold text-pink-300 select-all">{transferCode}</span>
        </div>
        <div className="flex justify-between pb-2">
          <span className="text-white/60">Tổng thanh toán</span>
          <span className="font-extrabold text-yellow-200 text-base">{money(price)}đ</span>
        </div>
      </div>

      <Link
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-white/20 bg-white/5 px-6 text-sm font-extrabold text-white shadow-[3px_3px_0px_rgba(255,255,255,0.15)] hover:shadow-[5px_5px_0px_white] hover:border-white hover:-translate-y-0.5 transition-all duration-150"
        href="/#booking"
      >
        Hủy & Đặt Đơn Khác
      </Link>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="flex items-center gap-2 font-extrabold text-pink-100 text-sm">
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
