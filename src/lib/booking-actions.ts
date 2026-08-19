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
import { generateDoorCode } from '@/lib/door-code';
import { sendTelegramBookingNotification } from '@/lib/telegram-notify';

const BOOKING_ACCESS_STATUSES = new Set<BookingStatus>([
  'Đã thanh toán',
  'Đã xác nhận',
  'Chờ cọc',
  'Đang ở',
  'Hoàn tất',
]);

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<AdminBookingResult> {
  try {
    await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS door_code VARCHAR(8)`).catch(() => null);
    await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`).catch(() => null);
    await query(
      `UPDATE bookings
       SET status = $1,
           paid_at = CASE WHEN $2 = 'Đã thanh toán' THEN COALESCE(paid_at, NOW()) ELSE paid_at END,
           door_code = CASE
             WHEN $4::boolean THEN COALESCE(door_code, $5)
             ELSE door_code
           END,
           updated_at = NOW()
       WHERE id = $3`,
      // $1 is inferred as VARCHAR by bookings.status; $2 is TEXT for the comparison.
      // Keeping them separate avoids PostgreSQL error 42P08 (conflicting parameter types).
      [status, status, id, BOOKING_ACCESS_STATUSES.has(status), generateDoorCode()]
    );
    revalidatePath('/dashboard/bookings');
    revalidatePath(`/dashboard/bookings/${id}`);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể cập nhật trạng thái booking.";
    console.error("Booking status update failed:", message);
    return { ok: false, error: message };
  }
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
  discountCode?: string | null;
  discountPercent?: number;
  discountAmount?: number;
  hasCar?: boolean;
  hasDecoration?: boolean;
  cccdFront?: string | null;
  cccdBack?: string | null;
  menuItemIds?: number[];
}

export type AdminBookingResult =
  | { ok: true }
  | { ok: false; error: string };

export interface AdminBookingEditInput {
  id: string;
  guestName: string;
  customerName: string;
  customerPhone: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  channel: string;
  status: BookingStatus;
  amount: number;
  guestCount: number;
  notes: string;
  discountCode?: string | null;
  hasCar?: boolean;
  hasDecoration?: boolean;
  cccdFront?: string | null;
  cccdBack?: string | null;
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

export async function createBookingAdmin(data: AdminBookingInput): Promise<AdminBookingResult> {
  try {
    await createBookingAdminOrThrow(data);
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tạo booking. Vui lòng thử lại.";
    // Expected validation errors are returned to the admin form instead of
    // bubbling into Next's production Server Components error boundary.
    console.warn("Admin booking creation rejected:", message);
    return { ok: false, error: message };
  }
}

async function createBookingAdminOrThrow(data: AdminBookingInput): Promise<void> {
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMP`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMP`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cccd_front TEXT`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cccd_back TEXT`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quoted_amount BIGINT DEFAULT 0`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50)`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS door_code VARCHAR(8)`).catch(() => null);
  await query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`).catch(() => null);

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
    if (booking.roomId !== room.id) return false;

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

  const quotedAmount = Math.max(0, Math.round(Number(data.amount) || 0));
  const calculatedDiscount = data.discountAmount !== undefined
    ? Math.max(0, Math.round(data.discountAmount))
    : Math.round(quotedAmount * Math.min(Math.max(Number(data.discountPercent) || 0, 0), 100) / 100);
  const finalRoomAmount = Math.max(quotedAmount - Math.min(calculatedDiscount, quotedAmount), 0);
  const noteWithManualDiscount = data.discountCode || calculatedDiscount <= 0
    ? data.notes
    : `${data.notes ? `${data.notes}\n` : ""}Giảm thủ công: -${calculatedDiscount.toLocaleString("vi-VN")}đ`;
  const doorCode = BOOKING_ACCESS_STATUSES.has(data.status) ? generateDoorCode() : null;

  await query(
    `INSERT INTO bookings (
      id, room_id, room_name, branch_id, branch_name, guest_name, customer_name, customer_phone,
      stay_date, date_label, time_range, check_in_at, check_out_at, timeslot_ids, channel, status,
      amount, quoted_amount, discount_code, guest_count, menu_items_total, has_car, has_decoration, notes, cccd_front, cccd_back, door_code, paid_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)`,
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
      finalRoomAmount,
      quotedAmount,
      data.discountCode?.trim().toUpperCase() || null,
      data.guestCount,
      menuItemsTotal,
      Boolean(data.hasCar),
      Boolean(data.hasDecoration),
      noteWithManualDiscount,
      data.cccdFront ?? null,
      data.cccdBack ?? null,
      doorCode,
      data.status === 'Đã thanh toán' ? new Date().toISOString() : null,
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
    price: finalRoomAmount,
  });

  if (data.status === 'Đã thanh toán') {
    try {
      await sendTelegramBookingNotification({
        bookingId: id,
        customerName: data.customerName || data.guestName,
        customerPhone: data.customerPhone,
        roomName: room.card_name,
        branchName: branch?.name ?? room.branch_name,
        dateLabel: range.checkInDate,
        timeRange: `${range.checkInTime} - ${range.checkOutTime}`,
        amount: finalRoomAmount + menuItemsTotal,
        doorCode: doorCode ?? '',
        source: 'admin',
      });
    } catch (error) {
      console.error('Admin booking Telegram notification error:', error);
    }
  }

  revalidatePath('/dashboard/bookings');
}

export async function updateAdminBooking(data: AdminBookingEditInput): Promise<AdminBookingResult> {
  try {
    if (!data.id.startsWith('ADM-')) {
      throw new Error('Chỉ booking do admin tạo mới có thể chỉnh sửa tại đây.');
    }
    if (!data.guestName.trim()) {
      throw new Error('Vui lòng nhập tên khách.');
    }
    for (const statement of [
      `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMP`,
      `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMP`,
      `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quoted_amount BIGINT DEFAULT 0`,
      `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50)`,
      `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cccd_front TEXT`,
      `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cccd_back TEXT`,
      `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP`,
    ]) {
      await query(statement).catch(() => null);
    }

    const range = resolveRange({
      ...data,
      roomId: 0,
      branchId: 0,
      stayDate: data.checkInDate,
      timeRange: `${data.checkInTime} - ${data.checkOutTime}`,
      discountPercent: 0,
      discountAmount: 0,
    });
    const bookingRows = await query<{ room_id: number; branch_id: number | null }>(
      `SELECT room_id, branch_id FROM bookings WHERE id = $1 LIMIT 1`,
      [data.id]
    );
    const booking = bookingRows[0];
    if (!booking?.room_id) throw new Error('Không tìm thấy booking admin cần chỉnh sửa.');

    const roomRows = await query<AdminRoom>(
      `SELECT id, branch_id, card_name, branch_name, room_amenities, price_from, price_to, full_day_price,
              main_image, is_classic, images, slot_prices, time_slots, wifi_name, wifi_password, booking_notice
       FROM rooms WHERE id = $1 LIMIT 1`,
      [booking.room_id]
    );
    const room = roomRows[0];
    if (!room) throw new Error('Phòng của booking này không còn tồn tại.');

    const branchRows = room.branch_id
      ? await query<BranchRow>(`SELECT id, name, active, hotline, google_maps_link, classic_booking_enabled FROM branches WHERE id = $1 LIMIT 1`, [room.branch_id])
      : [];
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
      .map((item) => normalizeBookingRecord(item, [room], branchRows))
      .filter((item) => item.raw.id !== data.id && item.roomId === room.id && holdsSlot(item.raw, holdMinutes));
    const hasConflict = activeBookings.some((item) => {
      if (item.raw.check_in_at && item.raw.check_out_at) {
        const start = parseLocalDateTime(item.raw.check_in_at);
        const end = parseLocalDateTime(item.raw.check_out_at);
        if (start && end && start < range.end && range.start < end) return true;
      }
      return item.timeslotIds.some((slotId) => requestedTimeslotIds.includes(slotId));
    });
    if (hasConflict) throw new Error('Khoảng thời gian này đã có booking khác giữ phòng.');

    const amount = Math.max(0, Math.round(Number(data.amount) || 0));
    await query(
      `UPDATE bookings
       SET guest_name = $1, customer_name = $2, customer_phone = $3,
           stay_date = $4::date, date_label = $5, time_range = $6,
           check_in_at = $7::timestamp, check_out_at = $8::timestamp, timeslot_ids = $9,
           channel = $10, status = $11,
           paid_at = CASE WHEN $12 = 'Đã thanh toán' THEN COALESCE(paid_at, NOW()) ELSE paid_at END,
           amount = $13, quoted_amount = $14, guest_count = $15, notes = $16,
           discount_code = $17, has_car = $18, has_decoration = $19,
           cccd_front = $20, cccd_back = $21, updated_at = NOW()
       WHERE id = $22`,
      [
        data.guestName.trim(), data.customerName.trim(), data.customerPhone.trim(),
        range.checkInDate, range.checkInDate, `${range.checkInTime} - ${range.checkOutTime}`,
        range.checkInAt, range.checkOutAt,
        requestedTimeslotIds.length ? stringifyTimeslotIds(requestedTimeslotIds) : null,
        data.channel, data.status, data.status,
        amount, amount, Math.max(1, Math.round(Number(data.guestCount) || 1)), data.notes.trim(),
        data.discountCode?.trim().toUpperCase() || null, Boolean(data.hasCar), Boolean(data.hasDecoration),
        data.cccdFront ?? null, data.cccdBack ?? null, data.id,
      ]
    );

    // Remove the old automatically generated leftovers before creating the new range's leftovers.
    await query(`DELETE FROM room_availability_slots WHERE source_booking_id = $1`, [data.id]).catch(() => null);
    await generateResidualAvailabilitySlots({
      roomId: room.id,
      roomName: room.card_name,
      timeSlots: room.time_slots,
      sourceBookingId: data.id,
      startAt: range.checkInAt,
      endAt: range.checkOutAt,
      price: amount,
    });
    revalidatePath('/dashboard/bookings');
    revalidatePath(`/dashboard/bookings/${data.id}`);
    revalidatePath('/dashboard/bookings/create');
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể cập nhật booking.';
    console.error('Admin booking update failed:', message);
    return { ok: false, error: message };
  }
}
