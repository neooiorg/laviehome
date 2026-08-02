import "server-only";

import { createElement } from "react";
import { Resend } from "resend";

import { BookingConfirmationEmail } from "@/emails/booking-confirmation-email";

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
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://laviehomestay.vn";
const DEFAULT_FROM = "Lavie Home <noreply@neooi.com>";

export async function sendBookingConfirmationEmail(input: BookingConfirmationPayload) {
  if (!input.customerEmail || !process.env.RESEND_API_KEY) {
    return { sent: false, reason: "missing_email_or_resend_key" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM,
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
      guideUrl: `${SITE_URL}/guide`,
      rulesUrl: `${SITE_URL}/rules`,
      mapsUrl: input.mapsUrl || `${SITE_URL}/contacts`,
    }),
  });

  return { sent: true };
}
