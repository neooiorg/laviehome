'use server';

import { revalidatePath } from 'next/cache';

import {
  formatLocalDateTime,
  getDefaultOperatingWindow,
  getTimeslotIdsOverlappingRange,
  parseLocalDateTime,
  type RoomSlot,
} from '@/lib/booking-slots';
import { fetchRawBookings, holdsSlot, normalizeBookingRecord } from '@/lib/booking-records';
import { getBookingHoldMinutes } from '@/lib/settings-actions';
import { query } from '@/lib/postgres';

export type AvailabilitySlotStatus = 'available' | 'blocked' | 'custom';

export type RoomAvailabilitySlot = {
  id: number;
  room_id: number;
  start_at: string;
  end_at: string;
  status: AvailabilitySlotStatus;
  price: number;
  customer_visible: boolean;
  source_booking_id: string | null;
  label: string | null;
};

export type RoomTimeline = {
  bookings: Array<{
    id: string;
    guest_name: string;
    status: string;
    start_at: string | null;
    end_at: string | null;
    time_range: string | null;
  }>;
  slots: RoomAvailabilitySlot[];
};

async function ensureAvailabilityTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS room_availability_slots (
      id SERIAL PRIMARY KEY,
      room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      start_at TIMESTAMP NOT NULL,
      end_at TIMESTAMP NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'available',
      price BIGINT NOT NULL DEFAULT 0,
      customer_visible BOOLEAN NOT NULL DEFAULT TRUE,
      source_booking_id VARCHAR(50),
      label VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CHECK (end_at > start_at),
      CHECK (status IN ('available', 'blocked', 'custom'))
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_room_availability_room_time ON room_availability_slots(room_id, start_at, end_at)`);
}

function validateRange(startAt: string, endAt: string) {
  const start = parseLocalDateTime(startAt);
  const end = parseLocalDateTime(endAt);
  if (!start || !end || end <= start) throw new Error('Khoảng thời gian không hợp lệ.');
  return { start, end };
}

async function assertNoSlotOverlap(roomId: number, startAt: string, endAt: string, excludeId?: number) {
  const rows = await query<{ id: number }>(
    `SELECT id FROM room_availability_slots
     WHERE room_id = $1 AND start_at < $2::timestamp AND end_at > $3::timestamp
       AND status <> 'blocked' ${excludeId ? 'AND id <> $4' : ''} LIMIT 1`,
    excludeId ? [roomId, endAt, startAt, excludeId] : [roomId, endAt, startAt]
  );
  if (rows.length) throw new Error('Khoảng trống này đang chồng lên một available slot khác.');
}

async function assertNoBookingOverlap(roomId: number, roomName: string, startAt: string, endAt: string, timeSlots?: RoomSlot[] | null) {
  const [rawBookings, holdMinutes] = await Promise.all([
    fetchRawBookings({ limit: 1500 }),
    getBookingHoldMinutes(),
  ]);
  const bookingRoom = { id: roomId, card_name: roomName, branch_id: 0, branch_name: '', room_amenities: [], price_from: 0, price_to: 0, full_day_price: 0, main_image: '', is_classic: 0, images: [], time_slots: timeSlots };
  const active = rawBookings.map((booking) => normalizeBookingRecord(booking, [bookingRoom], [])).filter((booking) => holdsSlot(booking.raw, holdMinutes));
  const start = parseLocalDateTime(startAt);
  const end = parseLocalDateTime(endAt);
  if (!start || !end) throw new Error('Khoảng thời gian không hợp lệ.');
  const touchedSlots = new Set(getTimeslotIdsOverlappingRange({ roomId, roomName, startAt, endAt, timeSlots }));

  const conflict = active.some((booking) => {
    if (booking.raw.check_in_at && booking.raw.check_out_at) {
      const bookingStart = parseLocalDateTime(booking.raw.check_in_at);
      const bookingEnd = parseLocalDateTime(booking.raw.check_out_at);
      if (bookingStart && bookingEnd && bookingStart < end && start < bookingEnd) return true;
    }
    return booking.timeslotIds.some((slotId) => touchedSlots.has(slotId));
  });
  if (conflict) throw new Error('Không thể tạo available slot chồng lên booking hiện có.');
}

export async function getRoomTimeline(roomId: number, fromAt: string, toAt: string): Promise<RoomTimeline> {
  await ensureAvailabilityTable();
  validateRange(fromAt, toAt);
  const [bookings, slots] = await Promise.all([
    query<RoomTimeline['bookings'][number]>(
      `SELECT id, guest_name, status, check_in_at::text AS start_at, check_out_at::text AS end_at, time_range
       FROM bookings
       WHERE room_id = $1 AND status NOT IN ('Đã hủy', 'Hủy', 'Cancelled', 'Đã hết hạn - Không thanh toán')
         AND ((check_in_at IS NOT NULL AND check_out_at IS NOT NULL AND check_in_at < $3::timestamp AND check_out_at > $2::timestamp)
           OR (check_in_at IS NULL AND stay_date BETWEEN $2::date AND $3::date))
       ORDER BY COALESCE(check_in_at, stay_date::timestamp)`,
      [roomId, fromAt, toAt]
    ),
    query<RoomAvailabilitySlot>(
      `SELECT id, room_id, start_at::text, end_at::text, status, price, customer_visible, source_booking_id, label
       FROM room_availability_slots
       WHERE room_id = $1 AND start_at < $3::timestamp AND end_at > $2::timestamp
       ORDER BY start_at`,
      [roomId, fromAt, toAt]
    ),
  ]);
  return { bookings, slots };
}

export async function createRoomAvailabilitySlot(input: {
  roomId: number;
  startAt: string;
  endAt: string;
  status: AvailabilitySlotStatus;
  price: number;
  customerVisible: boolean;
  label?: string;
}) {
  await ensureAvailabilityTable();
  validateRange(input.startAt, input.endAt);
  const room = await query<{ card_name: string; time_slots: RoomSlot[] | null }>(`SELECT card_name, time_slots FROM rooms WHERE id = $1 LIMIT 1`, [input.roomId]);
  if (!room[0]) throw new Error('Không tìm thấy phòng.');
  if (input.status !== 'blocked') {
    await assertNoBookingOverlap(input.roomId, room[0].card_name, input.startAt, input.endAt, room[0].time_slots);
    await assertNoSlotOverlap(input.roomId, input.startAt, input.endAt);
  }
  await query(
    `INSERT INTO room_availability_slots (room_id, start_at, end_at, status, price, customer_visible, label)
     VALUES ($1, $2::timestamp, $3::timestamp, $4, $5, $6, $7)`,
    [input.roomId, input.startAt, input.endAt, input.status, Math.max(0, Math.round(input.price)), input.customerVisible, input.label?.trim() || null]
  );
  revalidatePath('/dashboard/bookings/create');
}

export async function updateRoomAvailabilitySlot(input: {
  id: number;
  roomId: number;
  startAt: string;
  endAt: string;
  status: AvailabilitySlotStatus;
  price: number;
  customerVisible: boolean;
  label?: string;
}) {
  await ensureAvailabilityTable();
  validateRange(input.startAt, input.endAt);
  if (input.status !== 'blocked') {
    const room = await query<{ card_name: string; time_slots: RoomSlot[] | null }>(`SELECT card_name, time_slots FROM rooms WHERE id = $1 LIMIT 1`, [input.roomId]);
    if (!room[0]) throw new Error('Không tìm thấy phòng.');
    await assertNoBookingOverlap(input.roomId, room[0].card_name, input.startAt, input.endAt, room[0].time_slots);
    await assertNoSlotOverlap(input.roomId, input.startAt, input.endAt, input.id);
  }
  await query(
    `UPDATE room_availability_slots SET start_at = $1::timestamp, end_at = $2::timestamp, status = $3,
       price = $4, customer_visible = $5, label = $6, updated_at = NOW()
     WHERE id = $7 AND room_id = $8`,
    [input.startAt, input.endAt, input.status, Math.max(0, Math.round(input.price)), input.customerVisible, input.label?.trim() || null, input.id, input.roomId]
  );
  revalidatePath('/dashboard/bookings/create');
}

export async function deleteRoomAvailabilitySlot(id: number, roomId: number) {
  await ensureAvailabilityTable();
  await query(`DELETE FROM room_availability_slots WHERE id = $1 AND room_id = $2`, [id, roomId]);
  revalidatePath('/dashboard/bookings/create');
}

export async function mergeRoomAvailabilitySlots(roomId: number, ids: number[]) {
  await ensureAvailabilityTable();
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length < 2) throw new Error('Chọn ít nhất hai slot để gộp.');
  const slots = await query<RoomAvailabilitySlot>(
    `SELECT id, room_id, start_at::text, end_at::text, status, price, customer_visible, source_booking_id, label
     FROM room_availability_slots WHERE room_id = $1 AND id = ANY($2) ORDER BY start_at`,
    [roomId, uniqueIds]
  );
  if (slots.length !== uniqueIds.length) throw new Error('Không tìm thấy đầy đủ slot cần gộp.');
  if (slots.some((slot) => slot.status === 'blocked' || slot.status !== slots[0].status)) {
    throw new Error('Chỉ gộp các slot cùng trạng thái Available hoặc Custom slot.');
  }
  for (let index = 1; index < slots.length; index++) {
    if (parseLocalDateTime(slots[index - 1].end_at)?.getTime() !== parseLocalDateTime(slots[index].start_at)?.getTime()) {
      throw new Error('Các slot phải liền nhau mới có thể gộp.');
    }
  }
  await query(`UPDATE room_availability_slots SET end_at = $1::timestamp, updated_at = NOW() WHERE id = $2 AND room_id = $3`, [slots[slots.length - 1].end_at, slots[0].id, roomId]);
  await query(`DELETE FROM room_availability_slots WHERE room_id = $1 AND id = ANY($2) AND id <> $3`, [roomId, uniqueIds, slots[0].id]);
  revalidatePath('/dashboard/bookings/create');
}

export async function generateResidualAvailabilitySlots(input: {
  roomId: number;
  roomName: string;
  timeSlots?: RoomSlot[] | null;
  sourceBookingId: string;
  startAt: string;
  endAt: string;
  price: number;
}) {
  await ensureAvailabilityTable();
  const { start, end } = validateRange(input.startAt, input.endAt);
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  for (; cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
    const dateIso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const window = getDefaultOperatingWindow({ roomId: input.roomId, roomName: input.roomName, dateIso, timeSlots: input.timeSlots });
    if (!window) continue;
    const windowStart = parseLocalDateTime(window.startAt);
    const windowEnd = parseLocalDateTime(window.endAt);
    if (!windowStart || !windowEnd) continue;

    const pieces: Array<[Date, Date]> = [];
    if (start > windowStart) pieces.push([windowStart, new Date(Math.min(start.getTime(), windowEnd.getTime()))]);
    if (end < windowEnd) pieces.push([new Date(Math.max(end.getTime(), windowStart.getTime())), windowEnd]);

    for (const [pieceStart, pieceEnd] of pieces) {
      if (pieceEnd <= pieceStart) continue;
      const startText = formatLocalDateTime(pieceStart);
      const endText = formatLocalDateTime(pieceEnd);
      await query(
        `INSERT INTO room_availability_slots (room_id, start_at, end_at, status, price, customer_visible, source_booking_id, label)
         SELECT $1, $2::timestamp, $3::timestamp, 'available', $4, TRUE, $5, 'Tự động tách từ booking'
         WHERE NOT EXISTS (SELECT 1 FROM room_availability_slots WHERE room_id = $1 AND start_at = $2::timestamp AND end_at = $3::timestamp)`,
        [input.roomId, startText, endText, input.price, input.sourceBookingId]
      );
    }
  }
}
