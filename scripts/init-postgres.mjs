import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env.local');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(envPath);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const branches = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/data/branches.json'), 'utf8'));
const rooms = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src/data/rooms.json'), 'utf8'));

const guestNames = [
  'Minh Anh',
  'Hoàng Nam',
  'Thảo Vy',
  'Gia Huy',
  'Ngọc Linh',
  'Quang Minh',
  'Thùy Trang',
  'Văn Phúc'
];
const bookingStatuses = ['Đã xác nhận', 'Chờ cọc', 'Đang ở', 'Hoàn tất'];
const bookingChannels = ['Đặt trực tiếp', 'Zalo', 'Facebook', 'Khách quay lại'];
const timeSlots = ['08:00 - 11:00', '11:15 - 14:15', '14:30 - 17:30', '17:45 - 20:45', '21:00 - 00:00'];

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id integer PRIMARY KEY,
        name text NOT NULL,
        active smallint NOT NULL,
        hotline text NOT NULL,
        google_maps_link text NOT NULL,
        classic_booking_enabled smallint NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id integer PRIMARY KEY,
        branch_id integer NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
        card_name text NOT NULL,
        branch_name text NOT NULL,
        room_amenities jsonb NOT NULL,
        price_from integer NOT NULL,
        price_to integer NOT NULL,
        full_day_price integer NOT NULL,
        main_image text NOT NULL,
        is_classic smallint NOT NULL,
        images jsonb NOT NULL,
        wifi_name text DEFAULT '',
        wifi_password text DEFAULT '',
        booking_notice text DEFAULT ''
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id uuid PRIMARY KEY,
        room_id integer NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        branch_id integer NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
        guest_name text NOT NULL,
        stay_date date NOT NULL,
        time_range text NOT NULL,
        channel text NOT NULL,
        status text NOT NULL,
        amount integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY,
        title text NOT NULL,
        body text NOT NULL,
        status text NOT NULL DEFAULT 'unread',
        created_at timestamptz NOT NULL DEFAULT now(),
        actions jsonb NOT NULL DEFAULT '[]'::jsonb
      );
    `);

    await client.query(`
      TRUNCATE TABLE bookings, notifications, rooms, branches RESTART IDENTITY CASCADE;
    `);

    for (const branch of branches) {
      await client.query(
        `
        INSERT INTO branches (id, name, active, hotline, google_maps_link, classic_booking_enabled)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [branch.id, branch.name, branch.active, branch.hotline, branch.google_maps_link, branch.classic_booking_enabled]
      );
    }

    for (const room of rooms) {
      await client.query(
        `
        INSERT INTO rooms (
          id, branch_id, card_name, branch_name, room_amenities,
          price_from, price_to, full_day_price, main_image, is_classic, images
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11::jsonb)
      `,
        [
          room.id,
          room.branch_id,
          room.card_name,
          room.branch_name,
          JSON.stringify(room.room_amenities),
          room.price_from,
          room.price_to,
          room.full_day_price,
          room.main_image,
          room.is_classic,
          JSON.stringify(room.images)
        ]
      );
    }

    const activeRooms = rooms.filter((room) => room.is_classic === 0);
    for (let index = 0; index < activeRooms.length; index += 1) {
      const room = activeRooms[index];
      const branch = branches.find((item) => item.id === room.branch_id) ?? branches[0];
      const date = new Date();
      date.setDate(date.getDate() + index - 2);
      const bookingId = `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;

      await client.query(
        `
        INSERT INTO bookings (
          id, room_id, branch_id, guest_name, stay_date, time_range, channel, status, amount, created_at
        )
        VALUES ($1::uuid, $2, $3, $4, $5::date, $6, $7, $8, $9, now() - ($10 || ' days')::interval)
      `,
        [
          bookingId,
          room.id,
          branch.id,
          guestNames[index % guestNames.length],
          date.toISOString().slice(0, 10),
          timeSlots[index % timeSlots.length],
          bookingChannels[index % bookingChannels.length],
          bookingStatuses[index % bookingStatuses.length],
          room.price_from + (index % 3) * 20000,
          index
        ]
      );
    }

    await client.query(
      `
      INSERT INTO notifications (id, title, body, status, created_at, actions)
      VALUES
        ('11111111-1111-4111-8111-111111111111', 'Ảnh phòng cần cập nhật', 'Một số phòng vẫn đang dùng ảnh placeholder, nên thay trước khi public.', 'unread', now() - interval '10 minutes', '[{"id":"view-product","label":"Xem phòng","type":"redirect","style":"primary"}]'::jsonb),
        ('22222222-2222-4222-8222-222222222222', 'Chi nhánh cần rà soát', 'Có chi nhánh đang tạm ngưng hoặc cần kiểm tra booking classic.', 'unread', now() - interval '40 minutes', '[{"id":"view","label":"Xem chi nhánh","type":"redirect","style":"primary"}]'::jsonb),
        ('33333333-3333-4333-8333-333333333333', 'Doanh thu hôm nay', 'Doanh thu ước tính đã được đồng bộ từ bookings mẫu trong database.', 'read', now() - interval '2 hours', '[{"id":"billing","label":"Xem doanh thu","type":"redirect","style":"primary"}]'::jsonb);
      `
    );

    await client.query('COMMIT');
    console.log(`Seeded ${branches.length} branches, ${rooms.length} rooms, ${activeRooms.length} bookings.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
