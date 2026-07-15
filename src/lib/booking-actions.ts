'use server';

import { revalidatePath } from 'next/cache';

import { getActiveBookingsForRoomDate } from '@/lib/booking-records';
import { formatDateLabelFromIso, inferTimeslotIds, normalizeDateLabelToIso, stringifyTimeslotIds } from '@/lib/booking-slots';
import { type BookingStatus } from '@/lib/homestay-dashboard';
import { query } from '@/lib/postgres';

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  revalidatePath('/dashboard/bookings');
}

export interface AdminBookingInput {
  roomId: number;
  branchId: number;
  guestName: string;
  customerName: string;
  customerPhone: string;
  stayDate: string;
  timeRange: string;
  channel: string;
  status: BookingStatus;
  amount: number;
  guestCount: number;
  notes: string;
  menuItemIds?: number[];
}

export async function createBookingAdmin(data: AdminBookingInput): Promise<void> {
  const id = `ADM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const stayDate = normalizeDateLabelToIso(data.stayDate);

  if (!stayDate) {
    throw new Error('Ngày ở không hợp lệ.');
  }

  const roomRows = await query<{
    id: number;
    branch_id: number;
    card_name: string;
    branch_name: string;
    room_amenities: string[];
    price_from: number;
    price_to: number;
    full_day_price: number;
    main_image: string;
    is_classic: number;
    images: string[];
  }>(
    `SELECT id, branch_id, card_name, branch_name, room_amenities, price_from, price_to, full_day_price, main_image, is_classic, images
     FROM rooms
     WHERE id = $1
     LIMIT 1`,
    [data.roomId]
  );
  const room = roomRows[0];

  if (!room) {
    throw new Error('Không tìm thấy phòng để tạo booking.');
  }

  const branchRows = await query<{
    id: number;
    name: string;
    active: number;
    hotline: string;
    google_maps_link: string;
    classic_booking_enabled: number;
  }>(
    `SELECT id, name, active, hotline, google_maps_link, classic_booking_enabled
     FROM branches
     WHERE id = $1
     LIMIT 1`,
    [data.branchId]
  );
  const branch = branchRows[0];
  const inferredTimeslotIds = inferTimeslotIds({
    roomId: room.id,
    roomName: room.card_name,
    stayDate,
    timeRange: data.timeRange,
  });

  const activeBookings = await getActiveBookingsForRoomDate({
    roomId: room.id,
    roomName: room.card_name,
    dateIso: stayDate,
    rooms: [room],
    branches: branch ? [branch] : [],
  });
  const hasConflict = activeBookings.some((booking) => {
    if (booking.raw.id === id) return false;
    if (inferredTimeslotIds.length > 0 && booking.timeslotIds.length > 0) {
      return booking.timeslotIds.some((slotId) => inferredTimeslotIds.includes(slotId));
    }

    return (booking.raw.time_range ?? '').trim() === data.timeRange.trim();
  });

  if (hasConflict) {
    throw new Error('Khung giờ này đã có booking khác giữ chỗ.');
  }

  // Calculate menu items total
  let menuItemsTotal = 0;
  if (data.menuItemIds && data.menuItemIds.length > 0) {
    const menuItemsResult = await query<{ total: number }>(
      `SELECT SUM(price) as total FROM menu_items WHERE id = ANY($1)`,
      [data.menuItemIds]
    );
    menuItemsTotal = Number(menuItemsResult[0]?.total) || 0;
  }

  // Create booking
  await query(
    `INSERT INTO bookings (
      id, room_id, room_name, branch_id, branch_name, guest_name, customer_name, customer_phone,
      stay_date, date_label, time_range, timeslot_ids, channel, status, amount, guest_count,
      menu_items_total, has_car, has_decoration, notes, cccd_front, cccd_back
    )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, false, false, $18, null, null)`,
    [
      id,
      data.roomId,
      room.card_name,
      data.branchId,
      branch?.name ?? room.branch_name,
      data.guestName,
      data.customerName,
      data.customerPhone,
      stayDate,
      formatDateLabelFromIso(stayDate),
      data.timeRange,
      inferredTimeslotIds.length > 0 ? stringifyTimeslotIds(inferredTimeslotIds) : null,
      data.channel,
      data.status,
      data.amount,
      data.guestCount,
      menuItemsTotal,
      data.notes,
    ]
  );

  // Add menu items to booking
  if (data.menuItemIds && data.menuItemIds.length > 0) {
    for (const menuItemId of data.menuItemIds) {
      const menuItemResult = await query<{ price: number }>(
        `SELECT price FROM menu_items WHERE id = $1`,
        [menuItemId]
      );
      const price = Number(menuItemResult[0]?.price) || 0;

      await query(
        `INSERT INTO booking_menu_items (booking_id, menu_item_id, price) VALUES ($1, $2, $3)`,
        [id, menuItemId, price]
      );
    }
  }

  revalidatePath('/dashboard/bookings');
}
