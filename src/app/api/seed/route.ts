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
    // ─── Chi nhánh ───────────────────────────────────────────────────────────
    const branchRes = await pool.query<{ id: number }>(`
      INSERT INTO branches (name, hotline, google_maps_link, active, classic_booking_enabled)
      VALUES
        ('Cần Thơ - Tân An', '0706 595 899',
         'https://www.google.com/maps/search/98+Tr%E1%BA%A7n+Minh+S%C6%A1n+T%C3%A2n+An+C%E1%BA%A7n+Th%C6%A1',
         1, 1)
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    let branchId: number;
    if (branchRes.rows.length > 0) {
      branchId = branchRes.rows[0].id;
    } else {
      const existing = await pool.query<{ id: number }>(`SELECT id FROM branches WHERE name = 'Cần Thơ - Tân An' LIMIT 1`);
      branchId = existing.rows[0].id;
    }

    // ─── Phòng ───────────────────────────────────────────────────────────────
    const rooms = [
      {
        card_name: 'Phòng Thiên Đường',
        price_from: 199000,
        price_to: 299000,
        full_day_price: 850000,
        main_image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
          'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80',
        ],
        room_amenities: ['Bồn tắm', 'Máy chiếu 4K', 'Ban công view thành phố', 'Self check-in', 'Wifi tốc độ cao', 'Điều hòa', 'Minibar'],
        is_classic: 0,
      },
      {
        card_name: 'Phòng Hải Đăng',
        price_from: 199000,
        price_to: 249000,
        full_day_price: 750000,
        main_image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80',
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
        ],
        room_amenities: ['Máy chiếu 4K', 'Ban công', 'Self check-in', 'Wifi tốc độ cao', 'Điều hòa', 'Smart TV'],
        is_classic: 0,
      },
      {
        card_name: 'Phòng Mây Trắng',
        price_from: 249000,
        price_to: 349000,
        full_day_price: 950000,
        main_image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
        ],
        room_amenities: ['Bồn tắm', 'Máy chiếu 4K', 'Ban công view sông', 'Self check-in', 'Wifi tốc độ cao', 'Điều hòa', 'Bếp mini', 'Minibar'],
        is_classic: 0,
      },
      {
        card_name: 'Phòng Tịch Dương',
        price_from: 299000,
        price_to: 399000,
        full_day_price: 1100000,
        main_image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
          'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80',
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
        ],
        room_amenities: ['Bồn tắm jacuzzi', 'Máy chiếu 4K', 'Ban công view hoàng hôn', 'Self check-in', 'Wifi tốc độ cao', 'Điều hòa', 'Smart TV', 'Minibar', 'Bếp mini'],
        is_classic: 0,
      },
      {
        card_name: 'Phòng Ngọc Trai',
        price_from: 199000,
        price_to: 249000,
        full_day_price: 749000,
        main_image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80',
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
        ],
        room_amenities: ['Máy chiếu 4K', 'Self check-in', 'Wifi tốc độ cao', 'Điều hòa', 'Smart TV'],
        is_classic: 0,
      },
      {
        card_name: 'Phòng Bình Minh',
        price_from: 249000,
        price_to: 329000,
        full_day_price: 899000,
        main_image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
        images: [
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
        ],
        room_amenities: ['Bồn tắm', 'Máy chiếu 4K', 'Ban công', 'Self check-in', 'Wifi tốc độ cao', 'Điều hòa', 'Smart TV', 'Bếp mini'],
        is_classic: 0,
      },
    ];

    let inserted = 0;
    for (const room of rooms) {
      await pool.query(
        `INSERT INTO rooms (branch_id, branch_name, card_name, price_from, price_to, full_day_price, main_image, images, room_amenities, is_classic)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          branchId,
          'Cần Thơ - Tân An',
          room.card_name,
          room.price_from,
          room.price_to,
          room.full_day_price,
          room.main_image,
          JSON.stringify(room.images),
          JSON.stringify(room.room_amenities),
          room.is_classic,
        ]
      );
      inserted++;
    }

    // ─── Mã giảm giá ─────────────────────────────────────────────────────────
    await pool.query(`
      INSERT INTO discount_codes (code, percent, description, active, max_uses, used_count)
      VALUES ('LAVIENEW', 10, 'Ưu đãi khách lần đầu - giảm 10%', true, 999, 0)
      ON CONFLICT (code) DO NOTHING
    `);

    return NextResponse.json({
      ok: true,
      branch: { id: branchId, name: 'Cần Thơ - Tân An' },
      rooms_inserted: inserted,
      discount_codes: ['LAVIENEW'],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
