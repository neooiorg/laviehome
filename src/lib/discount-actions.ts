'use server';

import { revalidatePath } from 'next/cache';

import { query } from '@/lib/postgres';

export interface DiscountInput {
  code: string;
  percent: number;
  description: string;
  active: boolean;
  max_uses: number;
  expires_at: string | null;
}

export async function createDiscountCode(data: DiscountInput): Promise<void> {
  await query(
    `INSERT INTO discount_codes (code, percent, description, active, max_uses, used_count, expires_at)
     VALUES ($1, $2, $3, $4, $5, 0, $6)`,
    [data.code.toUpperCase(), data.percent, data.description, data.active, data.max_uses, data.expires_at || null]
  );
  revalidatePath('/dashboard/discounts');
}

export async function updateDiscountCode(code: string, data: Partial<DiscountInput>): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.percent !== undefined) { params.push(data.percent); fields.push(`percent = $${params.length}`); }
  if (data.description !== undefined) { params.push(data.description); fields.push(`description = $${params.length}`); }
  if (data.active !== undefined) { params.push(data.active); fields.push(`active = $${params.length}`); }
  if (data.max_uses !== undefined) { params.push(data.max_uses); fields.push(`max_uses = $${params.length}`); }
  if (data.expires_at !== undefined) { params.push(data.expires_at || null); fields.push(`expires_at = $${params.length}`); }

  if (fields.length === 0) return;

  params.push(code.toUpperCase());
  await query(`UPDATE discount_codes SET ${fields.join(', ')} WHERE code = $${params.length}`, params);
  revalidatePath('/dashboard/discounts');
}

export async function toggleDiscountActive(code: string, active: boolean): Promise<void> {
  await query('UPDATE discount_codes SET active = $1 WHERE code = $2', [active, code.toUpperCase()]);
  revalidatePath('/dashboard/discounts');
}

export async function deleteDiscountCode(code: string): Promise<void> {
  await query('DELETE FROM discount_codes WHERE code = $1', [code.toUpperCase()]);
  revalidatePath('/dashboard/discounts');
}
