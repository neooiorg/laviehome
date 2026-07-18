import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        hotline VARCHAR(50) DEFAULT '',
        google_maps_link TEXT DEFAULT '',
        active INTEGER DEFAULT 1,
        classic_booking_enabled INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
        branch_name VARCHAR(255) DEFAULT '',
        card_name VARCHAR(255) NOT NULL,
        price_from INTEGER DEFAULT 0,
        price_to INTEGER DEFAULT 0,
        full_day_price INTEGER DEFAULT 0,
        main_image TEXT DEFAULT '',
        images JSONB DEFAULT '[]',
        room_amenities JSONB DEFAULT '[]',
        is_classic INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(50) PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
        branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
        guest_name VARCHAR(255) DEFAULT '',
        customer_name VARCHAR(255),
        customer_phone VARCHAR(20),
        stay_date DATE,
        date_label VARCHAR(100),
        time_range VARCHAR(200),
        timeslot_ids TEXT,
        channel VARCHAR(100) DEFAULT 'Website',
        status VARCHAR(50) DEFAULT 'Chờ thanh toán',
        quoted_amount BIGINT DEFAULT 0,
        amount BIGINT DEFAULT 0,
        menu_items_total BIGINT DEFAULT 0,
        guest_count INTEGER DEFAULT 2,
        has_car BOOLEAN DEFAULT FALSE,
        has_decoration BOOLEAN DEFAULT FALSE,
        discount_code VARCHAR(50),
        notes TEXT,
        cccd_front TEXT,
        cccd_back TEXT,
        room_name VARCHAR(255),
        branch_name VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS discount_codes (
        code VARCHAR(50) PRIMARY KEY,
        percent INTEGER DEFAULT 0,
        description TEXT DEFAULT '',
        active BOOLEAN DEFAULT TRUE,
        max_uses INTEGER DEFAULT 100,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        branch_id INTEGER REFERENCES branches(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        price BIGINT DEFAULT 0,
        image_url TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS booking_menu_items (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(50) REFERENCES bookings(id) ON DELETE CASCADE,
        menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
        price BIGINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS slot_prices JSONB`);
    // Lazily-added booking column — ensure it exists on databases created before it.
    await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS menu_items_total BIGINT DEFAULT 0`);

    // Better Auth tables (for email OTP + user management)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_user (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        "emailVerified" BOOLEAN DEFAULT false,
        name TEXT,
        image TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_session (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES auth_user(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ba_verification (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES auth_user(id) ON DELETE CASCADE,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (identifier, value)
      )
    `);

    return NextResponse.json({
      ok: true,
      message: 'All tables created: branches, rooms, bookings, discount_codes, menu_items, booking_menu_items, app_settings, auth_user, auth_session, ba_verification'
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
