import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

import { extractBookingReference } from "@/lib/booking-reference";
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

export async function POST(req: NextRequest) {
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
    const bookingRes = await db.query(
      `SELECT amount FROM bookings WHERE UPPER(id) = $1 AND status = 'Chờ thanh toán'`,
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

    const res = await db.query(
      `UPDATE bookings SET status = $1 WHERE UPPER(id) = $2 AND status = 'Chờ thanh toán' RETURNING id`,
      ["Đã thanh toán", bookingId]
    );

    if (res.rowCount && res.rowCount > 0) {
      broadcastBookingUpdate(bookingId, "Đã thanh toán");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SePay webhook error:", error);
    return NextResponse.json({ success: false, error: "DB error" }, { status: 500 });
  }
}
