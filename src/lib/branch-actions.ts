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
