"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Home, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { money } from "@/lib/format";
import type { BankPaymentConfig } from "@/lib/payment-config";

const PAID_STATUSES = ["Đã thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];

type CheckoutPaymentBoxProps = {
  price: number;
  transferCode: string;
  bankConfig: BankPaymentConfig;
};

type PaidBookingDetails = {
  id: string;
  status: string;
  customerEmail: string | null;
  customerName: string | null;
  roomName: string | null;
  branchName: string | null;
  dateLabel: string | null;
  timeRange: string | null;
  doorCode: string | null;
  mapsUrl: string | null;
};

function maskEmail(email: string | null) {
  if (!email || !email.includes("@")) return "";
  const [name, domain] = email.split("@");
  const visible = name.slice(0, Math.min(3, name.length));
  return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}

function SuccessStep({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid grid-cols-[3.25rem_1fr] gap-4">
      <div className="relative flex justify-center">
        {index < 4 && <span className="absolute top-12 h-[calc(100%+1.75rem)] w-0.5 bg-sky-500" />}
        <span className="relative z-10 flex size-12 items-center justify-center rounded-full bg-sky-500 text-xl font-black text-white">
          {index}
        </span>
      </div>
      <div className="pb-2 text-lg leading-8 text-white/78">
        <h4 className="text-xl font-black uppercase tracking-wide text-sky-300">{title}</h4>
        <div className="mt-1 font-semibold">{children}</div>
      </div>
    </div>
  );
}

export function CheckoutPaymentBox({
  price,
  transferCode,
  bankConfig,
}: CheckoutPaymentBoxProps) {
  const router = useRouter();
  const [deadline] = useState(() => Date.now() + 600_000);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isPaid, setIsPaid] = useState(false);
  const [paidBooking, setPaidBooking] = useState<PaidBookingDetails | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const isExpired = timeLeft <= 0;

  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/check-payment?booking_id=${encodeURIComponent(transferCode)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { paid?: boolean; booking?: PaidBookingDetails };
      if (data.paid) {
        if (data.booking) setPaidBooking(data.booking);
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

    const source = new EventSource(
      `/api/payment-events?booking_id=${encodeURIComponent(transferCode)}`,
    );

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { bookingId?: string; status?: string };
        if (
          !cancelled &&
          payload.bookingId?.toUpperCase() === transferCode.toUpperCase() &&
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
  }, [transferCode, isPaid, isExpired, checkPaymentStatus]);

  useEffect(() => {
    if (isPaid || !isExpired) return;

    const redirectTimer = setTimeout(() => router.replace("/"), 2500);

    return () => clearTimeout(redirectTimer);
  }, [isExpired, isPaid, router]);

  async function resendEmail() {
    setResending(true);
    setResendMessage(null);
    try {
      const res = await fetch("/api/resend-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: transferCode }),
      });
      const data = (await res.json()) as { ok?: boolean; sent?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setResendMessage(data.error ?? "Không thể gửi lại email. Vui lòng liên hệ hotline.");
        return;
      }
      setResendMessage(data.sent ? "Đã gửi lại email cho quý khách." : "Đã ghi nhận, nhưng hệ thống email chưa được cấu hình.");
    } catch {
      setResendMessage("Không thể gửi lại email. Vui lòng thử lại sau.");
    } finally {
      setResending(false);
    }
  }

  if (isPaid) {
    const emailText = maskEmail(paidBooking?.customerEmail ?? null);

    return (
      <section className="section-card p-6 text-center animate-fade-in md:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Đặt phòng thành công</h2>
        <p className="mt-2 text-base font-bold leading-6 text-white/78">Cảm ơn bạn đã lựa chọn Lavie Home</p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-white/20 text-center">
          <div className="bg-indigo-950/80 px-4 py-3 text-lg font-semibold text-white">Mã nhận phòng</div>
          <div className="border-t border-white/15 px-4 py-4 text-2xl font-black text-white">{transferCode}</div>
          <div className="border-t border-white/15 px-4 py-4 text-lg font-black text-white">
            {paidBooking?.roomName ?? "Lavie Home"}
          </div>
          <div className="border-t border-white/15 px-4 py-4 text-sm font-semibold leading-6 text-white/75">
            {paidBooking?.dateLabel ?? ""} {paidBooking?.timeRange ? `- ${paidBooking.timeRange}` : ""}
          </div>
        </div>

        <div className="mt-8 text-left">
          <h3 className="text-center text-2xl font-black uppercase tracking-wide text-sky-300">
            Hướng dẫn tự check in
          </h3>
          <div className="mt-6 space-y-7">
            <SuccessStep index={1} title="Địa chỉ">
              <p>{paidBooking?.branchName ?? "Lavie Home Cần Thơ"}</p>
              <a className="text-sky-300 underline" href={paidBooking?.mapsUrl || "/contacts"} target="_blank" rel="noreferrer">
                Xem trên Google Maps
              </a>
            </SuccessStep>
            <SuccessStep index={2} title="Hướng dẫn tự check-in">
              <p>
                Quý khách xem kỹ hướng dẫn tự check-in và lưu lại.{" "}
                <Link className="text-sky-300 underline" href="/guide">Xem hướng dẫn</Link>
              </p>
              <p className="mt-2 text-lg font-black text-red-400">
                Mật khẩu cửa: {paidBooking?.doorCode ?? "Đang tạo..."}
              </p>
            </SuccessStep>
            <SuccessStep index={3} title="Nội quy">
              <p>
                Quý khách xem kỹ nội quy và tuân thủ khi ở tại Lavie Home.{" "}
                <Link className="text-sky-300 underline" href="/rules">Xem nội quy</Link>
              </p>
            </SuccessStep>
            <SuccessStep index={4} title="Mật khẩu Wi-Fi">
              <p>Tên Wifi: LAVIE HOME</p>
              <p>Mật khẩu: laviehome</p>
            </SuccessStep>
          </div>
        </div>

        {emailText && (
          <div className="mt-8 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-5 text-center">
            <p className="text-base font-bold leading-7 text-red-300">
              Thông tin đặt phòng cũng đã được gửi qua {emailText} cho quý khách!
            </p>
            <button
              type="button"
              onClick={() => void resendEmail()}
              disabled={resending}
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-indigo-700 px-6 text-base font-extrabold text-white transition hover:bg-indigo-600 disabled:opacity-60"
            >
              <Mail size={19} /> {resending ? "Đang gửi..." : "Gửi lại email"}
            </button>
            {resendMessage && <p className="mt-3 text-xs font-semibold text-white/60">{resendMessage}</p>}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link className="primary-button justify-center py-3.5" href="/">
            <Home size={17} /> Quay lại trang chủ
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-5 text-sm font-extrabold text-white transition hover:border-white hover:bg-white/10"
            href={`/checking?code=${encodeURIComponent(transferCode)}`}
          >
            Tra cứu đặt phòng
          </Link>
        </div>
      </section>
    );
  }

  if (isExpired) {
    return (
      <section className="section-card p-6 text-center animate-fade-in md:p-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Phiên Thanh Toán Đã Hết Hạn</h2>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Mã đặt phòng <span className="font-extrabold text-pink-300">{transferCode}</span> đã quá thời gian giữ chỗ.
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
