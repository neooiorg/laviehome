import "server-only";

import { createElement } from "react";
import { Resend } from "resend";

import { BookingConfirmationEmail } from "@/emails/booking-confirmation-email";
import { getEmailFrom, getResendErrorMessage } from "@/lib/email-sender";

export type BookingConfirmationPayload = {
  bookingId: string;
  customerEmail: string | null;
  customerName?: string | null;
  roomName?: string | null;
  branchName?: string | null;
  dateLabel?: string | null;
  timeRange?: string | null;
  doorCode: string;
  mapsUrl?: string | null;
  wifiName?: string | null;
  wifiPassword?: string | null;
  bookingNotice?: string | null;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hilaviehome.vn";

export async function sendBookingConfirmationEmail(input: BookingConfirmationPayload) {
  if (!input.customerEmail || !process.env.RESEND_API_KEY) {
    return { sent: false, reason: "missing_email_or_resend_key", id: null };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: input.customerEmail,
    subject: `Lavie Home - Đặt phòng thành công ${input.bookingId}`,
    react: createElement(BookingConfirmationEmail, {
      bookingId: input.bookingId,
      customerName: input.customerName,
      roomName: input.roomName,
      branchName: input.branchName,
      dateLabel: input.dateLabel,
      timeRange: input.timeRange,
      doorCode: input.doorCode,
      wifiName: input.wifiName,
      wifiPassword: input.wifiPassword,
      bookingNotice: input.bookingNotice,
      guideUrl: `${SITE_URL}/guide`,
      rulesUrl: `${SITE_URL}/rules`,
      mapsUrl: input.mapsUrl || `${SITE_URL}/contacts`,
    }),
  });

  if (error) {
    throw new Error(`Resend failed: ${getResendErrorMessage(error)}`);
  }

  return { sent: true, reason: null, id: data?.id ?? null };
}
