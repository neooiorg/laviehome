"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

function maskEmail(email: string | null) {
  if (!email) return null;
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, Math.min(3, name.length));
  return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
}

export function SuccessEmailActions({
  bookingId,
  customerEmail,
}: {
  bookingId: string;
  customerEmail: string | null;
}) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const emailText = maskEmail(customerEmail);

  async function resendEmail() {
    setIsSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/resend-booking-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const data = (await res.json()) as { ok?: boolean; sent?: boolean; reason?: string | null; error?: string };

      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Không thể gửi lại email. Vui lòng liên hệ hotline.");
        return;
      }

      setMessage(
        data.sent
          ? "Đã gửi lại email cho quý khách."
          : data.reason === "missing_email_or_resend_key"
            ? "Hệ thống email chưa được cấu hình đầy đủ."
            : "Chưa gửi được email, vui lòng thử lại sau."
      );
    } catch {
      setMessage("Không thể gửi lại email. Vui lòng thử lại sau.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-pink-200/20 bg-pink-200/[0.08] px-4 py-5 text-center sm:px-5 sm:py-6">
      <p className="break-words text-sm font-bold leading-6 text-pink-100 sm:text-base sm:leading-7">
        {emailText
          ? `Thông tin đặt phòng cũng đã được gửi qua ${emailText} cho quý khách.`
          : "Đơn đặt phòng chưa có email khách hàng, vui lòng lưu lại thông tin trên màn hình này."}
      </p>
      <button
        type="button"
        onClick={() => void resendEmail()}
        disabled={isSending || !customerEmail}
        className="primary-button mx-auto mt-5 min-h-12 w-full px-6 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
      >
        <Mail size={18} /> {isSending ? "Đang gửi..." : "Gửi lại email"}
      </button>
      {message && <p className="mt-3 text-xs font-semibold text-white/62">{message}</p>}
    </section>
  );
}
