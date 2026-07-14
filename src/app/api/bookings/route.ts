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

async function ensureTable(db: Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(50) PRIMARY KEY,
      room_name VARCHAR(255),
      branch_id INTEGER,
      branch_name VARCHAR(255),
      customer_name VARCHAR(255),
      customer_phone VARCHAR(20),
      date_label VARCHAR(100),
      time_range VARCHAR(200),
      timeslot_ids TEXT,
      amount BIGINT DEFAULT 0,
      discount_code VARCHAR(50),
      status VARCHAR(50) DEFAULT 'Chờ thanh toán',
      notes TEXT,
      guest_count INTEGER DEFAULT 2,
      has_car BOOLEAN DEFAULT FALSE,
      has_decoration BOOLEAN DEFAULT FALSE,
      cccd_front TEXT,
      cccd_back TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS room_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS branch_id INTEGER,
      ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS date_label VARCHAR(100),
      ADD COLUMN IF NOT EXISTS time_range VARCHAR(200),
      ADD COLUMN IF NOT EXISTS timeslot_ids TEXT,
      ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 2,
      ADD COLUMN IF NOT EXISTS has_car BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS has_decoration BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS cccd_front TEXT,
      ADD COLUMN IF NOT EXISTS cccd_back TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);
  // Patch the legacy admin schema so customer checkout INSERTs don't fail.
  // Admin bookings always supply every field; customer checkout only supplies
  // a subset. Set safe defaults or drop NOT NULL for columns the customer
  // route may omit. Each statement is isolated so missing columns don't block.
  for (const stmt of [
    `ALTER TABLE bookings ALTER COLUMN guest_name SET DEFAULT ''`,
    `ALTER TABLE bookings ALTER COLUMN stay_date SET DEFAULT CURRENT_DATE`,
    `ALTER TABLE bookings ALTER COLUMN channel SET DEFAULT 'Online'`,
    `ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'Chờ thanh toán'`,
    `ALTER TABLE bookings ALTER COLUMN room_id DROP NOT NULL`,
    `ALTER TABLE bookings ALTER COLUMN branch_id DROP NOT NULL`,
    `ALTER TABLE bookings ALTER COLUMN time_range DROP NOT NULL`,
    `ALTER TABLE bookings ALTER COLUMN customer_name DROP NOT NULL`,
    `ALTER TABLE bookings ALTER COLUMN customer_phone DROP NOT NULL`,
  ]) {
    await db.query(stmt).catch(() => {});
  }
}

const SURCHARGE: Record<number, number> = { 3: 50000, 4: 100000 };

async function resolveAmount(
  db: Pool,
  bookingId: string,
  guestCount: number,
  discountCode: string | null
): Promise<number> {
  // Base price is the server-recorded amount set when the booking was pre-created
  const { rows } = await db.query(
    'SELECT amount FROM bookings WHERE UPPER(id) = $1',
    [bookingId.toUpperCase()]
  );
  const baseAmount = Number(rows[0]?.amount ?? 0);
  const surcharge = SURCHARGE[guestCount] ?? 0;

  let discountPercent = 0;
  if (discountCode) {
    const { rows: dcRows } = await db.query(
      `SELECT percent FROM discount_codes
       WHERE code = $1 AND active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [discountCode.trim().toUpperCase()]
    );
    if (dcRows.length > 0) discountPercent = Number(dcRows[0].percent);
  }

  const discountAmount = Math.round(baseAmount * discountPercent / 100);
  return baseAmount + surcharge - discountAmount;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      room_name,
      branch_id,
      branch_name,
      date_label,
      time_range,
      timeslot_ids,
      customer_name,
      customer_phone,
      discount_code,
      notes,
      guest_count,
      has_car,
      has_decoration,
      cccd_front,
      cccd_back,
    } = body;
    const guest_name: string = customer_name ?? '';

    if (!id) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }

    const db = getPool();
    await ensureTable(db);

    // Compute final amount server-side — never trust client-provided amount
    const finalAmount = await resolveAmount(db, id, Number(guest_count ?? 2), discount_code ?? null);

    await db.query(
      `INSERT INTO bookings (
        id, guest_name, room_name, branch_id, branch_name, date_label, time_range,
        timeslot_ids, amount, customer_name, customer_phone, discount_code,
        notes, guest_count, has_car, has_decoration, cccd_front, cccd_back
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (id) DO UPDATE SET
        guest_name = COALESCE(NULLIF(EXCLUDED.guest_name, ''), bookings.guest_name),
        customer_name = COALESCE(EXCLUDED.customer_name, bookings.customer_name),
        customer_phone = COALESCE(EXCLUDED.customer_phone, bookings.customer_phone),
        notes = COALESCE(EXCLUDED.notes, bookings.notes),
        guest_count = COALESCE(EXCLUDED.guest_count, bookings.guest_count),
        has_car = COALESCE(EXCLUDED.has_car, bookings.has_car),
        has_decoration = COALESCE(EXCLUDED.has_decoration, bookings.has_decoration),
        discount_code = COALESCE(EXCLUDED.discount_code, bookings.discount_code),
        amount = EXCLUDED.amount,
        cccd_front = COALESCE(EXCLUDED.cccd_front, bookings.cccd_front),
        cccd_back = COALESCE(EXCLUDED.cccd_back, bookings.cccd_back),
        updated_at = NOW()`,
      [
        id,
        guest_name,
        room_name ?? null,
        branch_id ? Number(branch_id) : null,
        branch_name ?? null,
        date_label ?? null,
        time_range ?? null,
        timeslot_ids ?? null,
        finalAmount,
        customer_name ?? null,
        customer_phone ?? null,
        discount_code ?? null,
        notes ?? null,
        guest_count ? Number(guest_count) : 2,
        has_car ?? false,
        has_decoration ?? false,
        cccd_front ?? null,
        cccd_back ?? null,
      ]
    );

    return NextResponse.json({ success: true, id, amount: finalAmount });
  } catch (error) {
    console.error("Create booking error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const code = searchParams.get("code");
  const date = searchParams.get("date");

  // Allow looking up either by phone number or by booking code so that
  // customers without a phone on file can still find their booking.
  if (!phone && !code) {
    return NextResponse.json({ error: "Vui lòng nhập số điện thoại hoặc mã đặt phòng" }, { status: 400 });
  }

  try {
    const db = getPool();
    await ensureTable(db);

    const params: string[] = [];
    const conditions: string[] = [];

    if (phone) {
      params.push(phone.replace(/\D/g, ""));
      conditions.push(`REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g') = $${params.length}`);
    }

    if (code) {
      params.push(code.trim().toUpperCase());
      conditions.push(`UPPER(id) = $${params.length}`);
    }

    // phone OR code identifies the booking; date further narrows the result.
    let whereClauses = `(${conditions.join(" OR ")})`;

    if (date) {
      params.push(date);
      whereClauses += ` AND date_label = $${params.length}`;
    }

    const result = await db.query(
      `SELECT id, room_name, branch_name, date_label, time_range, amount, status, guest_count, created_at
       FROM bookings WHERE ${whereClauses} ORDER BY created_at DESC LIMIT 10`,
      params
    );

    return NextResponse.json({ bookings: result.rows });
  } catch (error) {
    console.error("Get bookings error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
