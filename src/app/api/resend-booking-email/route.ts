import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

import { sendBookingConfirmationEmail } from "@/lib/booking-confirmation-email";
import { generateDoorCode } from "@/lib/door-code";

const PAID_STATUSES = ["Đã thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"];

let pool: Pool | null = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureBookingNotificationColumns(db: Pool) {
  await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)`).catch(() => null);
  await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS door_code VARCHAR(8)`).catch(() => null);
}

export async function POST(req: NextRequest) {
  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return NextResponse.json({ ok: false, error: "Missing booking_id" }, { status: 400 });
    }

    const db = getPool();
    await ensureBookingNotificationColumns(db);

    const { rows } = await db.query(
      `SELECT b.id, b.status, b.customer_email, b.customer_name, b.room_name, b.branch_name,
              b.date_label, b.time_range, b.door_code, COALESCE(br.google_maps_link, '') AS maps_url
       FROM bookings b
       LEFT JOIN branches br ON br.id = b.branch_id
       WHERE UPPER(b.id) = $1`,
      [String(booking_id).toUpperCase()]
    );

    const booking = rows[0];
    if (!booking) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy đơn đặt phòng." }, { status: 404 });
    }

    if (!PAID_STATUSES.includes(booking.status)) {
      return NextResponse.json({ ok: false, error: "Đơn đặt phòng chưa thanh toán." }, { status: 409 });
    }

    if (!booking.customer_email) {
      return NextResponse.json({ ok: false, error: "Đơn đặt phòng chưa có email khách." }, { status: 409 });
    }

    let doorCode = booking.door_code as string | null;
    if (!doorCode) {
      doorCode = generateDoorCode();
      await db.query(`UPDATE bookings SET door_code = $1, updated_at = NOW() WHERE UPPER(id) = $2`, [
        doorCode,
        String(booking_id).toUpperCase(),
      ]);
    }

    const result = await sendBookingConfirmationEmail({
      bookingId: booking.id,
      customerEmail: booking.customer_email,
      customerName: booking.customer_name,
      roomName: booking.room_name,
      branchName: booking.branch_name,
      dateLabel: booking.date_label,
      timeRange: booking.time_range,
      doorCode,
      mapsUrl: booking.maps_url,
    });

    return NextResponse.json({ ok: true, sent: result.sent, reason: result.reason ?? null });
  } catch (error) {
    console.error("Resend booking email error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
