'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/postgres';

export interface MenuItem extends Record<string, unknown> {
  id: number;
  branch_id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemInput {
  branchId: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
}

export async function getMenuItemsByBranch(branchId: number): Promise<MenuItem[]> {
  return query<MenuItem>(
    `SELECT id, branch_id, name, description, price, image_url, is_active, created_at, updated_at
     FROM menu_items WHERE branch_id = $1 ORDER BY created_at DESC`,
    [branchId]
  );
}

export async function getAllMenuItems(): Promise<MenuItem[]> {
  return query<MenuItem>(
    `SELECT id, branch_id, name, description, price, image_url, is_active, created_at, updated_at
     FROM menu_items ORDER BY branch_id, created_at DESC`
  );
}

export async function getMenuItemById(id: number): Promise<MenuItem | null> {
  const items = await query<MenuItem>(
    `SELECT id, branch_id, name, description, price, image_url, is_active, created_at, updated_at
     FROM menu_items WHERE id = $1`,
    [id]
  );
  return items[0] || null;
}

export async function getMenuItemsByIds(ids: number[]): Promise<MenuItem[]> {
  const cleanIds = Array.from(
    new Set(ids.filter((id) => Number.isInteger(id) && id > 0))
  );
  if (cleanIds.length === 0) return [];
  const items = await query<MenuItem>(
    `SELECT id, branch_id, name, description, price, image_url, is_active, created_at, updated_at
     FROM menu_items WHERE id = ANY($1)`,
    [cleanIds]
  );
  // preserve the order the ids were requested in
  const byId = new Map(items.map((item) => [item.id, item]));
  return cleanIds
    .map((id) => byId.get(id))
    .filter((item): item is MenuItem => Boolean(item));
}

export async function createMenuItem(data: MenuItemInput): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO menu_items (branch_id, name, description, price, image_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [data.branchId, data.name, data.description, data.price, data.imageUrl || null, data.isActive]
  );
  revalidatePath('/dashboard/menu-items');
  return result[0]?.id || 0;
}

export async function updateMenuItem(id: number, data: Partial<MenuItemInput>): Promise<void> {
  const fields: string[] = [];
  const params: unknown[] = [];

  if (data.name !== undefined) { params.push(data.name); fields.push(`name = $${params.length}`); }
  if (data.description !== undefined) { params.push(data.description); fields.push(`description = $${params.length}`); }
  if (data.price !== undefined) { params.push(data.price); fields.push(`price = $${params.length}`); }
  if (data.imageUrl !== undefined) { params.push(data.imageUrl || null); fields.push(`image_url = $${params.length}`); }
  if (data.isActive !== undefined) { params.push(data.isActive); fields.push(`is_active = $${params.length}`); }

  if (fields.length === 0) return;

  params.push(id);
  await query(`UPDATE menu_items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`, params);
  revalidatePath('/dashboard/menu-items');
}

export async function deleteMenuItem(id: number): Promise<void> {
  await query('DELETE FROM menu_items WHERE id = $1', [id]);
  revalidatePath('/dashboard/menu-items');
}

export async function toggleMenuItemStatus(id: number): Promise<void> {
  await query(
    `UPDATE menu_items SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1`,
    [id]
  );
  revalidatePath('/dashboard/menu-items');
}
