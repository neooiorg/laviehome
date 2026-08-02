import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

import { extractBookingReference } from "@/lib/booking-reference";
import { sendBookingConfirmationEmail } from "@/lib/booking-confirmation-email";
import { expireStalePendingBookings } from "@/lib/booking-records";
import { generateDoorCode } from "@/lib/door-code";
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
}

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

  const bookingId = extractBookingReference(content);
  if (!bookingId) {
    return NextResponse.json({ success: true });
  }

  try {
    const db = getPool();
    await ensureBookingNotificationColumns(db);
    await expireStalePendingBookings();
    const bookingRes = await db.query(
      // `amount` is the room-only charge; the customer pays room + menu, so the
      // expected transfer must add the (never-discounted) menu items total.
      `SELECT amount + COALESCE(menu_items_total, 0) AS amount FROM bookings WHERE UPPER(id) = $1 AND status = 'Chờ thanh toán'`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    const expectedAmount = Number(bookingRes.rows[0].amount);
    if (amount < expectedAmount) {
      console.warn(`SePay: underpayment for ${bookingId} - got ${amount}, expected ${expectedAmount}`);
      return NextResponse.json({ success: true });
    }

    const doorCode = generateDoorCode();
    const res = await db.query(
      `UPDATE bookings
       SET status = $1, door_code = COALESCE(door_code, $3), updated_at = NOW()
       WHERE UPPER(id) = $2 AND status = 'Chờ thanh toán'
       RETURNING id, customer_email, customer_name, room_name, branch_name, date_label, time_range, door_code,
         (SELECT google_maps_link FROM branches WHERE branches.id = bookings.branch_id) AS maps_url`,
      ["Đã thanh toán", bookingId, doorCode]
    );

    if (res.rowCount && res.rowCount > 0) {
      const paidBooking = res.rows[0];
      broadcastBookingUpdate(bookingId, "Đã thanh toán");
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
        });
      } catch (emailError) {
        console.error("Booking confirmation email error:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SePay webhook error:", error);
    return NextResponse.json({ success: false, error: "DB error" }, { status: 500 });
  }
}
