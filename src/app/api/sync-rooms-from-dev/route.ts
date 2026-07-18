import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const devPool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_hKlft6kGv9Ha@ep-damp-darkness-aowpqu5c-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
  });

  const prodPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  });

  try {
    const branches = await devPool.query(
      'SELECT id, name, hotline, google_maps_link, active, classic_booking_enabled FROM branches WHERE active = 1 ORDER BY id'
    );

    await prodPool.query('DELETE FROM rooms');
    await prodPool.query('DELETE FROM branches');

    for (const b of branches.rows) {
      await prodPool.query(
        `INSERT INTO branches (id, name, hotline, google_maps_link, active, classic_booking_enabled)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [b.id, b.name, b.hotline, b.google_maps_link, b.active, b.classic_booking_enabled]
      );
    }

    const rooms = await devPool.query(
      `SELECT id, branch_id, branch_name, card_name, price_from, price_to, full_day_price,
              main_image, images, room_amenities, is_classic, slot_prices FROM rooms ORDER BY id`
    );

    for (const r of rooms.rows) {
      await prodPool.query(
        `INSERT INTO rooms (id, branch_id, branch_name, card_name, price_from, price_to, full_day_price,
                            main_image, images, room_amenities, is_classic, slot_prices)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          r.id, r.branch_id, r.branch_name, r.card_name, r.price_from, r.price_to, r.full_day_price,
          r.main_image, r.images, r.room_amenities, r.is_classic, r.slot_prices,
        ]
      );
    }

    return NextResponse.json({
      ok: true,
      branches_inserted: branches.rows.length,
      rooms_inserted: rooms.rows.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}
