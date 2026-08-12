'use server';

import { revalidatePath } from 'next/cache';

import {
  getTimeslotIdsOverlappingRange,
  makeLocalDateTime,
  normalizeDateLabelToIso,
  parseLocalDateTime,
  stringifyTimeslotIds,
  type RoomSlot,
} from '@/lib/booking-slots';
import {
  fetchRawBookings,
  holdsSlot,
  normalizeBookingRecord,
} from '@/lib/booking-records';
import { getBookingHoldMinutes } from '@/lib/settings-actions';
import { type BookingStatus, type BranchRow, type RoomRow } from '@/lib/homestay-dashboard';
import { query } from '@/lib/postgres';
import { generateResidualAvailabilitySlots } from '@/lib/room-availability-actions';

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  revalidatePath('/dashboard/bookings');
  revalidatePath(`/dashboard/bookings/${id}`);
}

export interface AdminBookingInput {
  roomId: number;
  branchId: number;
  guestName: string;
  customerName: string;
  customerPhone: string;
  stayDate: string;
  timeRange: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  channel: string;
  status: BookingStatus;
  amount: number;
  guestCount: number;
  notes: string;
  hasCar?: boolean;
  hasDecoration?: boolean;
  cccdFront?: string | null;
  cccdBack?: string | null;
  menuItemIds?: number[];
}

type AdminRoom = RoomRow & { time_slots?: RoomSlot[] | null };

function resolveRange(data: AdminBookingInput) {
  const checkInDate = normalizeDateLabelToIso(data.checkInDate ?? data.stayDate);
  const checkOutDate = normalizeDateLabelToIso(data.checkOutDate ?? checkInDate);
  const legacyParts = data.timeRange.split(/\s*[-–]\s*/);
  const checkInTime = data.checkInTime ?? legacyParts[0]?.trim() ?? '';
  const checkOutTime = data.checkOutTime ?? legacyParts[1]?.trim() ?? '';

  if (!checkInDate || !checkOutDate || !/^\d{2}:\d{2}$/.test(checkInTime) || !/^\d{2}:\d{2}$/.test(checkOutTime)) {
    throw new Error('Vui lòng nhập đầy đủ ngày và giờ bắt đầu/kết thúc.');
  }

  const checkInAt = makeLocalDateTime(checkInDate, checkInTime);
  const checkOutAt = makeLocalDateTime(checkOutDate, checkOutTime);
  const start = parseLocalDateTime(checkInAt);
  const end = parseLocalDateTime(checkOutAt);
  if (!start || !end || end <= start) {
    throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu.');
  }

  return { checkInDate, checkOutDate, checkInTime, checkOutTime, checkInAt, checkOutAt, start, end };
}

export async function createBookingAdmin(data: AdminBookingInput): Promise<void> {
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMP`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMP`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cccd_front TEXT`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cccd_back TEXT`).catch(() => null);

  const range = resolveRange(data);
  const id = `ADM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const roomRows = await query<AdminRoom>(
    `SELECT id, branch_id, card_name, branch_name, room_amenities, price_from, price_to, full_day_price,
            main_image, is_classic, images, slot_prices, time_slots, wifi_name, wifi_password, booking_notice
     FROM rooms WHERE id = $1 LIMIT 1`,
    [data.roomId]
  );
  const room = roomRows[0];
  if (!room) throw new Error('Không tìm thấy phòng để tạo booking.');

  const branchRows = await query<BranchRow>(
    `SELECT id, name, active, hotline, google_maps_link, classic_booking_enabled
     FROM branches WHERE id = $1 LIMIT 1`,
    [data.branchId]
  );
  const branch = branchRows[0];
  const rooms = [room];
  const branches = branch ? [branch] : [];
  const requestedTimeslotIds = getTimeslotIdsOverlappingRange({
    roomId: room.id,
    roomName: room.card_name,
    startAt: range.checkInAt,
    endAt: range.checkOutAt,
    timeSlots: room.time_slots,
  });

  const [rawBookings, holdMinutes] = await Promise.all([
    fetchRawBookings({ limit: 1500 }),
    getBookingHoldMinutes(),
  ]);
  const activeBookings = rawBookings
    .map((booking) => normalizeBookingRecord(booking, rooms, branches))
    .filter((booking) => holdsSlot(booking.raw, holdMinutes));

  const hasConflict = activeBookings.some((booking) => {
    if (booking.raw.id === id) return false;

    if (booking.raw.check_in_at && booking.raw.check_out_at) {
      const start = parseLocalDateTime(booking.raw.check_in_at);
      const end = parseLocalDateTime(booking.raw.check_out_at);
      if (start && end && start < range.end && range.start < end) return true;
    }

    return booking.timeslotIds.some((slotId) => requestedTimeslotIds.includes(slotId));
  });

  if (hasConflict) {
    throw new Error('Khoảng thời gian này đã có booking khác giữ phòng.');
  }

  let menuItemsTotal = 0;
  if (data.menuItemIds?.length) {
    const menuItemsResult = await query<{ total: number }>(
      `SELECT SUM(price) AS total FROM menu_items WHERE id = ANY($1)`,
      [data.menuItemIds]
    );
    menuItemsTotal = Number(menuItemsResult[0]?.total) || 0;
  }

  await query(
    `INSERT INTO bookings (
      id, room_id, room_name, branch_id, branch_name, guest_name, customer_name, customer_phone,
      stay_date, date_label, time_range, check_in_at, check_out_at, timeslot_ids, channel, status,
      amount, guest_count, menu_items_total, has_car, has_decoration, notes, cccd_front, cccd_back
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
    [
      id,
      data.roomId,
      room.card_name,
      data.branchId,
      branch?.name ?? room.branch_name,
      data.guestName,
      data.customerName,
      data.customerPhone,
      range.checkInDate,
      range.checkInDate,
      `${range.checkInTime} - ${range.checkOutTime}`,
      range.checkInAt,
      range.checkOutAt,
      requestedTimeslotIds.length ? stringifyTimeslotIds(requestedTimeslotIds) : null,
      data.channel,
      data.status,
      data.amount,
      data.guestCount,
      menuItemsTotal,
      Boolean(data.hasCar),
      Boolean(data.hasDecoration),
      data.notes,
      data.cccdFront ?? null,
      data.cccdBack ?? null,
    ]
  );

  if (data.menuItemIds?.length) {
    for (const menuItemId of data.menuItemIds) {
      const item = await query<{ price: number }>(`SELECT price FROM menu_items WHERE id = $1`, [menuItemId]);
      await query(
        `INSERT INTO booking_menu_items (booking_id, menu_item_id, price) VALUES ($1, $2, $3)`,
        [id, menuItemId, Number(item[0]?.price) || 0]
      );
    }
  }

  await generateResidualAvailabilitySlots({
    roomId: room.id,
    roomName: room.card_name,
    timeSlots: room.time_slots,
    sourceBookingId: id,
    startAt: range.checkInAt,
    endAt: range.checkOutAt,
    price: data.amount,
  });

  revalidatePath('/dashboard/bookings');
}
