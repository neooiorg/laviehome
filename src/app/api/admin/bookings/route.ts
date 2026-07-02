import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

let pool: Pool | null = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret || secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getPool();
    const result = await db.query(
      `SELECT id, room_name, branch_name, customer_name, customer_phone,
              date_label, time_range, amount, status, guest_count,
              has_car, has_decoration, discount_code, notes,
              cccd_front, cccd_back, created_at
       FROM bookings
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return NextResponse.json({ bookings: result.rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
