'use server';

import { revalidatePath } from 'next/cache';

import { query } from '@/lib/postgres';

export interface RoomInput {
  card_name: string;
  branch_id: number;
  branch_name: string;
  price_from: number;
  price_to: number;
  full_day_price: number;
  main_image: string;
  images: string[];
  room_amenities: string[];
  is_classic: boolean;
}

export async function createRoom(data: RoomInput): Promise<void> {
  await query(
    `INSERT INTO rooms (card_name, branch_id, branch_name, price_from, price_to, full_day_price, main_image, images, room_amenities, is_classic)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      data.card_name,
      data.branch_id,
      data.branch_name,
      data.price_from,
      data.price_to,
      data.full_day_price,
      data.main_image,
      JSON.stringify(data.images),
      JSON.stringify(data.room_amenities),
      data.is_classic ? 1 : 0,
    ]
  );
  revalidatePath('/dashboard/rooms');
}

export async function updateRoom(id: number, data: Partial<RoomInput>): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.card_name !== undefined) { params.push(data.card_name); fields.push(`card_name = $${params.length}`); }
  if (data.branch_id !== undefined) { params.push(data.branch_id); fields.push(`branch_id = $${params.length}`); }
  if (data.branch_name !== undefined) { params.push(data.branch_name); fields.push(`branch_name = $${params.length}`); }
  if (data.price_from !== undefined) { params.push(data.price_from); fields.push(`price_from = $${params.length}`); }
  if (data.price_to !== undefined) { params.push(data.price_to); fields.push(`price_to = $${params.length}`); }
  if (data.full_day_price !== undefined) { params.push(data.full_day_price); fields.push(`full_day_price = $${params.length}`); }
  if (data.main_image !== undefined) { params.push(data.main_image); fields.push(`main_image = $${params.length}`); }
  if (data.images !== undefined) { params.push(JSON.stringify(data.images)); fields.push(`images = $${params.length}`); }
  if (data.room_amenities !== undefined) { params.push(JSON.stringify(data.room_amenities)); fields.push(`room_amenities = $${params.length}`); }
  if (data.is_classic !== undefined) { params.push(data.is_classic ? 1 : 0); fields.push(`is_classic = $${params.length}`); }

  if (fields.length === 0) return;

  params.push(id);
  await query(`UPDATE rooms SET ${fields.join(', ')} WHERE id = $${params.length}`, params);
  revalidatePath('/dashboard/rooms');
  revalidatePath(`/dashboard/rooms/${id}`);
}

export async function deleteRoom(id: number): Promise<void> {
  await query('DELETE FROM rooms WHERE id = $1', [id]);
  revalidatePath('/dashboard/rooms');
}
