'use server';

import { revalidatePath } from 'next/cache';

import { type BookingStatus } from '@/lib/homestay-dashboard';
import { query } from '@/lib/postgres';

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
  revalidatePath('/dashboard/bookings');
}
