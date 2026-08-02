import { NextResponse } from "next/server";
import { Pool } from "pg";

import { ensureBookingNotificationColumns } from "@/lib/booking-records";
import { generateDoorCode } from "@/lib/door-code";

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

async function ensureLocalBookingNotificationColumns(db: Pool) {
  await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)`).catch(() => null);
  await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS door_code VARCHAR(8)`).catch(() => null);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("booking_id");

  if (!bookingId) {
    return NextResponse.json({ paid: false, error: "Missing booking_id" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ paid: false, error: "Database not configured" }, { status: 500 });
  }

  try {
    const db = getPool();
    await ensureLocalBookingNotificationColumns(db);
    await ensureBookingNotificationColumns();
    const res = await db.query(
      `SELECT
         b.status,
         b.id,
         b.customer_email,
         b.customer_name,
         b.room_name,
         b.branch_name,
         b.date_label,
         b.time_range,
         b.door_code,
         COALESCE(br.google_maps_link, '') AS maps_url
       FROM bookings b
       LEFT JOIN branches br ON br.id = b.branch_id
       WHERE UPPER(b.id) = $1`,
      [bookingId.toUpperCase()]
    );

    if (res.rows.length > 0 && ["Đã thanh toán", "Đã xác nhận", "Chờ cọc", "Đang ở", "Hoàn tất"].includes(res.rows[0].status)) {
      const row = res.rows[0];
      if (!row.door_code) {
        row.door_code = generateDoorCode();
        await db.query(`UPDATE bookings SET door_code = $1, updated_at = NOW() WHERE UPPER(id) = $2`, [
          row.door_code,
          bookingId.toUpperCase(),
        ]);
      }
      return NextResponse.json({
        paid: true,
        booking: {
          id: row.id,
          status: row.status,
          customerEmail: row.customer_email,
          customerName: row.customer_name,
          roomName: row.room_name,
          branchName: row.branch_name,
          dateLabel: row.date_label,
          timeRange: row.time_range,
          doorCode: row.door_code,
          mapsUrl: row.maps_url,
        },
      });
    }

    return NextResponse.json({ paid: false });
  } catch (error) {
    console.error("Error checking payment status:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ paid: false, error: message }, { status: 500 });
  }
}
