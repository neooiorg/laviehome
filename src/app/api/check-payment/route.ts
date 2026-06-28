import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("booking_id");

  if (!bookingId) {
    return NextResponse.json({ paid: false, error: "Missing booking_id" }, { status: 400 });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ paid: false, error: "Database not configured" }, { status: 500 });
  }

  try {
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    const res = await pool.query(
      "SELECT status FROM bookings WHERE UPPER(id) = $1",
      [bookingId.toUpperCase()]
    );
    await pool.end();

    if (res.rows.length > 0 && res.rows[0].status === "Đã xác nhận") {
      return NextResponse.json({ paid: true });
    }

    return NextResponse.json({ paid: false });
  } catch (error: any) {
    console.error("Error checking payment status:", error);
    return NextResponse.json({ paid: false, error: error.message }, { status: 500 });
  }
}
