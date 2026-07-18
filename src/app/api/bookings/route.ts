import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

import { getActiveBookingsForRoomDate } from "@/lib/booking-records";
import { getPublicBranches, getPublicRooms } from "@/lib/homestay-dashboard";
import {
  formatDateLabelFromIso,
  getRoomIdFromTimeslotIds,
  inferTimeslotIds,
  normalizeDateLabelToIso,
  stringifyTimeslotIds,
} from "@/lib/booking-slots";

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
    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(50) PRIMARY KEY,
      guest_name VARCHAR(255) DEFAULT '',
      room_id INTEGER,
      room_name VARCHAR(255),
      branch_id INTEGER,
      branch_name VARCHAR(255),
      customer_name VARCHAR(255),
      customer_phone VARCHAR(20),
      stay_date DATE DEFAULT CURRENT_DATE,
      date_label VARCHAR(100),
      time_range VARCHAR(200),
      timeslot_ids TEXT,
      channel VARCHAR(50) DEFAULT 'Online',
      quoted_amount BIGINT DEFAULT 0,
      amount BIGINT DEFAULT 0,
      menu_items_total BIGINT DEFAULT 0,
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
      ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS room_id INTEGER,
      ADD COLUMN IF NOT EXISTS room_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS branch_id INTEGER,
      ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS stay_date DATE DEFAULT CURRENT_DATE,
      ADD COLUMN IF NOT EXISTS date_label VARCHAR(100),
      ADD COLUMN IF NOT EXISTS time_range VARCHAR(200),
      ADD COLUMN IF NOT EXISTS timeslot_ids TEXT,
      ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'Online',
      ADD COLUMN IF NOT EXISTS quoted_amount BIGINT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS menu_items_total BIGINT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 2,
      ADD COLUMN IF NOT EXISTS has_car BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS has_decoration BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS cccd_front TEXT,
      ADD COLUMN IF NOT EXISTS cccd_back TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);

  for (const stmt of [
    `ALTER TABLE bookings ALTER COLUMN guest_name SET DEFAULT ''`,
    `ALTER TABLE bookings ALTER COLUMN stay_date SET DEFAULT CURRENT_DATE`,
    `ALTER TABLE bookings ALTER COLUMN channel SET DEFAULT 'Online'`,
    `ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'Chờ thanh toán'`,
    `ALTER TABLE bookings ALTER COLUMN quoted_amount SET DEFAULT 0`,
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
  const { rows } = await db.query("SELECT COALESCE(quoted_amount, amount) AS quoted_amount FROM bookings WHERE UPPER(id) = $1", [
    bookingId.toUpperCase(),
  ]);
  const baseAmount = Number(rows[0]?.quoted_amount ?? 0);
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

  const discountAmount = Math.round((baseAmount * discountPercent) / 100);
  return baseAmount + surcharge - discountAmount;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      room_name,
      room_id,
      branch_id,
      branch_name,
      stay_date,
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
    const guest_name: string = customer_name ?? "";

    if (!id) {
      return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
    }

    const db = getPool();
    await ensureTable(db);

    const existingResult = await db.query(
      `SELECT room_id, room_name, branch_id, branch_name, stay_date::text, date_label, time_range, timeslot_ids, channel
       FROM bookings
       WHERE UPPER(id) = $1
       LIMIT 1`,
      [String(id).toUpperCase()]
    );
    const existing = existingResult.rows[0] as
      | {
          room_id: number | null;
          room_name: string | null;
          branch_id: number | null;
          branch_name: string | null;
          stay_date: string | null;
          date_label: string | null;
          time_range: string | null;
          timeslot_ids: string | null;
          channel: string | null;
        }
      | undefined;

    const [rooms, branches] = await Promise.all([getPublicRooms(), getPublicBranches()]);
    const resolvedRoomId =
      room_id ? Number(room_id) : existing?.room_id ?? getRoomIdFromTimeslotIds(existing?.timeslot_ids);
    const room = rooms.find((item) => item.id === resolvedRoomId);
    const resolvedRoomName = room_name ?? existing?.room_name ?? room?.card_name ?? null;
    const resolvedBranchId = branch_id ? Number(branch_id) : existing?.branch_id ?? room?.branch_id ?? null;
    const resolvedBranchName = branch_name ?? existing?.branch_name ?? room?.branch_name ?? null;
    const resolvedStayDate =
      normalizeDateLabelToIso(stay_date ?? existing?.stay_date) ??
      normalizeDateLabelToIso(date_label ?? existing?.date_label) ??
      null;
    const resolvedDateLabel = date_label ?? existing?.date_label ?? formatDateLabelFromIso(resolvedStayDate);
    const resolvedTimeRange = time_range ?? existing?.time_range ?? null;
    const resolvedTimeslotIds = inferTimeslotIds({
      roomId: resolvedRoomId,
      roomName: resolvedRoomName,
      stayDate: resolvedStayDate,
      dateLabel: resolvedDateLabel,
      timeRange: resolvedTimeRange,
      timeslotIds: timeslot_ids ?? existing?.timeslot_ids,
    });

    if (resolvedRoomId && resolvedRoomName && resolvedStayDate && resolvedTimeslotIds.length > 0) {
      const activeBookings = await getActiveBookingsForRoomDate({
        roomId: resolvedRoomId,
        roomName: resolvedRoomName,
        dateIso: resolvedStayDate,
        rooms,
        branches,
      });

      const hasConflict = activeBookings.some(
        (booking) =>
          booking.raw.id !== id && booking.timeslotIds.some((slotId) => resolvedTimeslotIds.includes(slotId))
      );

      if (hasConflict) {
        return NextResponse.json(
          { error: "Khung giờ đã được đặt bởi khách khác. Vui lòng chọn khung giờ khác." },
          { status: 409 }
        );
      }
    }

    const finalAmount = await resolveAmount(db, id, Number(guest_count ?? 2), discount_code ?? null);

    await db.query(
      `INSERT INTO bookings (
        id, guest_name, room_id, room_name, branch_id, branch_name, stay_date, date_label, time_range,
        timeslot_ids, channel, quoted_amount, amount, customer_name, customer_phone, discount_code,
        notes, guest_count, has_car, has_decoration, cccd_front, cccd_back
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      ON CONFLICT (id) DO UPDATE SET
        room_id = COALESCE(EXCLUDED.room_id, bookings.room_id),
        room_name = COALESCE(EXCLUDED.room_name, bookings.room_name),
        branch_id = COALESCE(EXCLUDED.branch_id, bookings.branch_id),
        branch_name = COALESCE(EXCLUDED.branch_name, bookings.branch_name),
        stay_date = COALESCE(EXCLUDED.stay_date, bookings.stay_date),
        date_label = COALESCE(EXCLUDED.date_label, bookings.date_label),
        time_range = COALESCE(EXCLUDED.time_range, bookings.time_range),
        timeslot_ids = COALESCE(EXCLUDED.timeslot_ids, bookings.timeslot_ids),
        channel = COALESCE(bookings.channel, EXCLUDED.channel),
        guest_name = COALESCE(NULLIF(EXCLUDED.guest_name, ''), bookings.guest_name),
        customer_name = COALESCE(EXCLUDED.customer_name, bookings.customer_name),
        customer_phone = COALESCE(EXCLUDED.customer_phone, bookings.customer_phone),
        notes = COALESCE(EXCLUDED.notes, bookings.notes),
        guest_count = COALESCE(EXCLUDED.guest_count, bookings.guest_count),
        has_car = COALESCE(EXCLUDED.has_car, bookings.has_car),
        has_decoration = COALESCE(EXCLUDED.has_decoration, bookings.has_decoration),
        discount_code = COALESCE(EXCLUDED.discount_code, bookings.discount_code),
        quoted_amount = COALESCE(NULLIF(bookings.quoted_amount, 0), EXCLUDED.quoted_amount),
        amount = EXCLUDED.amount,
        cccd_front = COALESCE(EXCLUDED.cccd_front, bookings.cccd_front),
        cccd_back = COALESCE(EXCLUDED.cccd_back, bookings.cccd_back),
        updated_at = NOW()`,
      [
        id,
        guest_name,
        resolvedRoomId,
        resolvedRoomName,
        resolvedBranchId,
        resolvedBranchName,
        resolvedStayDate,
        resolvedDateLabel,
        resolvedTimeRange,
        resolvedTimeslotIds.length > 0 ? stringifyTimeslotIds(resolvedTimeslotIds) : null,
        existing?.channel ?? "Online",
        existing ? null : finalAmount,
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

    let whereClauses = `(${conditions.join(" OR ")})`;

    if (date) {
      params.push(date);
      whereClauses += ` AND date_label = $${params.length}`;
    }

    const result = await db.query(
      `SELECT
         id,
         room_name,
         branch_name,
         date_label,
         time_range,
         amount + COALESCE(menu_items_total, 0) AS amount,
         status,
         guest_count,
         created_at
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
