import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

import { hashLuckyWheelPhone } from "@/lib/lucky-wheel";

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

async function ensureTable(db: Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS discount_codes (
      code        VARCHAR(50) PRIMARY KEY,
      percent     INTEGER NOT NULL CHECK (percent > 0 AND percent <= 100),
      description VARCHAR(255),
      active      BOOLEAN DEFAULT TRUE,
      max_uses    INTEGER DEFAULT NULL,
      used_count  INTEGER DEFAULT 0,
      expires_at  TIMESTAMPTZ DEFAULT NULL,
      recipient_phone_hash TEXT DEFAULT NULL,
      source VARCHAR(40) DEFAULT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS recipient_phone_hash TEXT`);
  await db.query(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS source VARCHAR(40)`);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  const phone = req.nextUrl.searchParams.get("phone")?.trim() ?? "";

  if (!code) {
    return NextResponse.json({ valid: false, error: "Thiếu mã giảm giá" }, { status: 400 });
  }

  try {
    const db = getPool();
    await ensureTable(db);

    const { rows } = await db.query(
      `SELECT percent, description, active, max_uses, used_count, expires_at, recipient_phone_hash
       FROM discount_codes WHERE code = $1`,
      [code]
    );

    if (rows.length === 0) {
      return NextResponse.json({ valid: false, error: "Mã không tồn tại" });
    }

    const row = rows[0];

    if (!row.active) {
      return NextResponse.json({ valid: false, error: "Mã đã bị vô hiệu hoá" });
    }
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "Mã đã hết hạn" });
    }
    if (row.max_uses !== null && row.used_count >= row.max_uses) {
      return NextResponse.json({ valid: false, error: "Mã đã đạt giới hạn sử dụng" });
    }
    if (row.recipient_phone_hash) {
      const phoneHash = hashLuckyWheelPhone(phone);
      if (!phoneHash || phoneHash !== row.recipient_phone_hash) {
        return NextResponse.json({ valid: false, error: "Mã này chỉ dùng cho số điện thoại đã nhận thưởng" });
      }
    }

    return NextResponse.json({
      valid: true,
      percent: row.percent,
      description: row.description ?? `Giảm ${row.percent}%`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}

// Kept for compatibility with checkout tabs opened before this deployment.
// Voucher reservation is now handled atomically by POST /api/bookings.
export async function POST() {
  return NextResponse.json({ ok: true });
}
