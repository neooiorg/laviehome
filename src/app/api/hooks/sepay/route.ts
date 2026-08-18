import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

import { extractBookingReference, extractPaymentReference } from "@/lib/booking-reference";
import { sendBookingConfirmationEmail } from "@/lib/booking-confirmation-email";
import { sendTelegramBookingNotification } from "@/lib/telegram-notify";
import { generateDoorCode } from "@/lib/door-code";
import { ensureRoomGuestContentColumns } from "@/lib/room-guest-content";
import { broadcastBookingUpdate } from "@/lib/sse-clients";

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
    });
  }

  return pool;
}

async function ensureBookingNotificationColumns(db: Pool) {
  await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)`).catch(() => null);
  await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS door_code VARCHAR(8)`).catch(() => null);
  await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(80)`).catch(() => null);
  await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_amount BIGINT`).catch(() => null);
}

const PAID_STATUSES = ["Đã thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];
const SURCHARGE: Record<number, number> = { 3: 50000, 4: 100000 };

export async function POST(req: NextRequest) {
  // SePay authenticates webhooks with an API key sent as `Authorization: Apikey <key>`.
  // Reject anything that doesn't match SEPAY_WEBHOOK_API_KEY (when configured).
  const expectedKey = process.env.SEPAY_WEBHOOK_API_KEY;
  if (expectedKey) {
    const provided = (req.headers.get("authorization") ?? "").replace(/^Apikey\s+/i, "").trim();
    if (provided !== expectedKey) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const content = String(body.content ?? body.description ?? "").toUpperCase();
  const amount = Number(body.transferAmount ?? 0);

  if (!content || amount <= 0) {
    return NextResponse.json({ success: false, error: "Missing content or amount" }, { status: 400 });
  }

  const paymentReference = extractPaymentReference(content);
  const bookingId = extractBookingReference(paymentReference ?? content);
  if (!bookingId) {
    return NextResponse.json({ success: true });
  }
  const hasVersionedPaymentReference = Boolean(paymentReference && paymentReference !== bookingId);

  try {
    const db = getPool();
    await ensureBookingNotificationColumns(db);
    await ensureRoomGuestContentColumns(db);
    const bookingRes = await db.query(
      `SELECT
         b.status,
         COALESCE(NULLIF(b.quoted_amount, 0), b.amount, 0) AS room_base,
         b.amount,
         COALESCE(b.menu_items_total, 0) AS menu_items_total,
         COALESCE(b.guest_count, 2) AS guest_count,
         b.discount_code,
         b.payment_reference,
         b.payment_amount,
         dc.percent AS discount_percent
       FROM bookings b
       LEFT JOIN discount_codes dc
         ON dc.code = b.discount_code
        AND dc.active = TRUE
        AND (dc.expires_at IS NULL OR dc.expires_at > NOW())
        AND (dc.max_uses IS NULL OR dc.used_count <= dc.max_uses)
       WHERE ${
         hasVersionedPaymentReference
           ? "UPPER(b.payment_reference) = $1"
           : "UPPER(b.id) = $1 AND (b.payment_reference IS NULL OR UPPER(b.payment_reference) = $1)"
       }
       LIMIT 1`,
      [hasVersionedPaymentReference ? paymentReference : bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    const booking = bookingRes.rows[0];
    if (PAID_STATUSES.includes(booking.status)) {
      return NextResponse.json({ success: true });
    }

    const roomBase = Number(booking.room_base ?? 0);
    const menuTotal = Number(booking.menu_items_total ?? 0);
    const surcharge = SURCHARGE[Number(booking.guest_count ?? 2)] ?? 0;
    const discountPercent = Number(booking.discount_percent ?? 0);
    const discountedExpectedAmount =
      roomBase + surcharge - Math.round((roomBase * discountPercent) / 100) + menuTotal;
    const storedExpectedAmount = Number(booking.amount ?? 0) + menuTotal;
    const expectedAmount =
      Number(booking.payment_amount ?? 0) > 0
        ? Number(booking.payment_amount)
        : discountPercent > 0
          ? discountedExpectedAmount
          : storedExpectedAmount;

    if (amount < expectedAmount) {
      console.warn(`SePay: underpayment for ${bookingId} - got ${amount}, expected ${expectedAmount}`);
      return NextResponse.json({ success: true });
    }

    const doorCode = generateDoorCode();
    const res = await db.query(
      `UPDATE bookings
       SET status = $1, door_code = COALESCE(door_code, $3), paid_at = COALESCE(paid_at, NOW()), updated_at = NOW()
       WHERE UPPER(id) = $2
         AND status NOT IN ('Đã thanh toán', 'Đã xác nhận', 'Chờ cọc', 'Đang ở', 'Hoàn tất')
       RETURNING id, customer_email, customer_name, customer_phone, amount, room_name, branch_name, date_label, time_range, door_code,
         (SELECT google_maps_link FROM branches WHERE branches.id = bookings.branch_id) AS maps_url,
         (SELECT wifi_name FROM rooms WHERE rooms.id = bookings.room_id) AS wifi_name,
         (SELECT wifi_password FROM rooms WHERE rooms.id = bookings.room_id) AS wifi_password,
         (SELECT booking_notice FROM rooms WHERE rooms.id = bookings.room_id) AS booking_notice`,
      ["Đã thanh toán", bookingId, doorCode]
    );

    if (res.rowCount && res.rowCount > 0) {
      const paidBooking = res.rows[0];
      broadcastBookingUpdate(bookingId, "Đã thanh toán", paymentReference ?? undefined);
      try {
        await sendBookingConfirmationEmail({
          bookingId: paidBooking.id,
          customerEmail: paidBooking.customer_email,
          customerName: paidBooking.customer_name,
          roomName: paidBooking.room_name,
          branchName: paidBooking.branch_name,
          dateLabel: paidBooking.date_label,
          timeRange: paidBooking.time_range,
          doorCode: paidBooking.door_code,
          mapsUrl: paidBooking.maps_url,
          wifiName: paidBooking.wifi_name,
          wifiPassword: paidBooking.wifi_password,
          bookingNotice: paidBooking.booking_notice,
        });
      } catch (emailError) {
        console.error("Booking confirmation email error:", emailError);
      }
      try {
        await sendTelegramBookingNotification({
          bookingId: paidBooking.id,
          customerName: paidBooking.customer_name,
          customerPhone: paidBooking.customer_phone,
          roomName: paidBooking.room_name,
          branchName: paidBooking.branch_name,
          dateLabel: paidBooking.date_label,
          timeRange: paidBooking.time_range,
          amount,
          doorCode: paidBooking.door_code,
        });
      } catch (telegramError) {
        console.error("Telegram notification error:", telegramError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SePay webhook error:", error);
    return NextResponse.json({ success: false, error: "DB error" }, { status: 500 });
  }
}
