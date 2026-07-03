'use server';

import { revalidatePath } from 'next/cache';

import { query } from '@/lib/postgres';

export async function toggleBranchActive(id: number, active: boolean) {
  await query('UPDATE branches SET active = $1 WHERE id = $2', [active ? 1 : 0, id]);
  revalidatePath('/dashboard/branches');
}

export async function toggleBranchClassic(id: number, enabled: boolean) {
  await query('UPDATE branches SET classic_booking_enabled = $1 WHERE id = $2', [enabled ? 1 : 0, id]);
  revalidatePath('/dashboard/branches');
}

export interface BranchInput {
  name: string;
  hotline: string;
  google_maps_link: string;
  active: boolean;
  classic_booking_enabled: boolean;
}

export async function createBranch(data: BranchInput): Promise<import('@/lib/homestay-dashboard').BranchRow | null> {
  const rows = await query<import('@/lib/homestay-dashboard').BranchRow>(
    'INSERT INTO branches (name, hotline, google_maps_link, active, classic_booking_enabled) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [data.name, data.hotline, data.google_maps_link, data.active ? 1 : 0, data.classic_booking_enabled ? 1 : 0]
  );
  revalidatePath('/dashboard/branches');
  return rows[0] ?? null;
}

export async function updateBranch(id: number, data: Partial<BranchInput>): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.name !== undefined) { params.push(data.name); fields.push(`name = $${params.length}`); }
  if (data.hotline !== undefined) { params.push(data.hotline); fields.push(`hotline = $${params.length}`); }
  if (data.google_maps_link !== undefined) { params.push(data.google_maps_link); fields.push(`google_maps_link = $${params.length}`); }
  if (data.active !== undefined) { params.push(data.active ? 1 : 0); fields.push(`active = $${params.length}`); }
  if (data.classic_booking_enabled !== undefined) { params.push(data.classic_booking_enabled ? 1 : 0); fields.push(`classic_booking_enabled = $${params.length}`); }

  if (fields.length === 0) return;

  params.push(id);
  await query(`UPDATE branches SET ${fields.join(', ')} WHERE id = $${params.length}`, params);
  revalidatePath('/dashboard/branches');
  revalidatePath(`/dashboard/branches/${id}`);
}

export async function deleteBranch(id: number): Promise<void> {
  await query('DELETE FROM branches WHERE id = $1', [id]);
  revalidatePath('/dashboard/branches');
}
