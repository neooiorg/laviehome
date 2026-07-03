'use server';

import { revalidatePath } from 'next/cache';

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
}

export async function createBookingAdmin(data: AdminBookingInput): Promise<void> {
  const id = `ADM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  await query(
    `INSERT INTO bookings (id, room_id, branch_id, guest_name, customer_name, customer_phone, stay_date, time_range, channel, status, amount, guest_count, has_car, has_decoration, notes, cccd_front, cccd_back)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, false, $13, null, null)`,
    [id, data.roomId, data.branchId, data.guestName, data.customerName, data.customerPhone, data.stayDate, data.timeRange, data.channel, data.status, data.amount, data.guestCount, data.notes]
  );
  revalidatePath('/dashboard/bookings');
}
