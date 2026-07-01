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
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS room_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS branch_id INTEGER,
      ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS date_label VARCHAR(100),
      ADD COLUMN IF NOT EXISTS time_range VARCHAR(200),
      ADD COLUMN IF NOT EXISTS timeslot_ids TEXT,
      ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 2,
      ADD COLUMN IF NOT EXISTS has_car BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS has_decoration BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);
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
      amount,
      customer_name,
      customer_phone,
      discount_code,
      notes,
      guest_count,
      has_car,
      has_decoration,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }

    const db = getPool();
    await ensureTable(db);

    await db.query(
      `INSERT INTO bookings (
        id, room_name, branch_id, branch_name, date_label, time_range,
        timeslot_ids, amount, customer_name, customer_phone, discount_code,
        notes, guest_count, has_car, has_decoration
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (id) DO UPDATE SET
        customer_name = COALESCE(EXCLUDED.customer_name, bookings.customer_name),
        customer_phone = COALESCE(EXCLUDED.customer_phone, bookings.customer_phone),
        notes = COALESCE(EXCLUDED.notes, bookings.notes),
        guest_count = COALESCE(EXCLUDED.guest_count, bookings.guest_count),
        has_car = COALESCE(EXCLUDED.has_car, bookings.has_car),
        has_decoration = COALESCE(EXCLUDED.has_decoration, bookings.has_decoration),
        discount_code = COALESCE(EXCLUDED.discount_code, bookings.discount_code),
        updated_at = NOW()`,
      [
        id,
        room_name ?? null,
        branch_id ? Number(branch_id) : null,
        branch_name ?? null,
        date_label ?? null,
        time_range ?? null,
        timeslot_ids ?? null,
        amount ? Number(amount) : 0,
        customer_name ?? null,
        customer_phone ?? null,
        discount_code ?? null,
        notes ?? null,
        guest_count ? Number(guest_count) : 2,
        has_car ?? false,
        has_decoration ?? false,
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Create booking error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const date = searchParams.get("date");

  if (!phone) {
    return NextResponse.json({ error: "Missing phone" }, { status: 400 });
  }

  try {
    const db = getPool();
    await ensureTable(db);

    const params: string[] = [phone.replace(/\D/g, "")];
    let whereClauses = `REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g') = $1`;

    if (date) {
      params.push(date);
      whereClauses += ` AND date_label = $2`;
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
