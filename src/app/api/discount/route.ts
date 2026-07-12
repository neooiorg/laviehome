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
    CREATE TABLE IF NOT EXISTS discount_codes (
      code        VARCHAR(50) PRIMARY KEY,
      percent     INTEGER NOT NULL CHECK (percent > 0 AND percent <= 100),
      description VARCHAR(255),
      active      BOOLEAN DEFAULT TRUE,
      max_uses    INTEGER DEFAULT NULL,
      used_count  INTEGER DEFAULT 0,
      expires_at  TIMESTAMPTZ DEFAULT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false, error: "Thiếu mã giảm giá" }, { status: 400 });
  }

  try {
    const db = getPool();
    await ensureTable(db);

    const { rows } = await db.query(
      `SELECT percent, description, active, max_uses, used_count, expires_at
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

// Called on booking submit to increment used_count
export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ ok: true });

  try {
    const db = getPool();
    await ensureTable(db);
    const { rowCount } = await db.query(
      `UPDATE discount_codes SET used_count = used_count + 1 WHERE code = $1 AND active = TRUE`,
      [code.trim().toUpperCase()]
    );
    if (!rowCount) return NextResponse.json({ ok: false, error: 'Mã không hợp lệ' });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // non-blocking
  }
}
