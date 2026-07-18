'use server';

import { revalidatePath } from 'next/cache';

import { query } from '@/lib/postgres';

const ONLINE_PAYMENT_KEY = 'online_payment_enabled';
const MAINTENANCE_KEY = 'maintenance_mode';

async function ensureSettingsTable(): Promise<void> {
  await query(
    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`
  ).catch(() => null);
}

/**
 * Whether customers can pay online (VietQR). Defaults to ON. Reads fail open —
 * a settings-table hiccup must never silently disable payments.
 */
export async function getOnlinePaymentEnabled(): Promise<boolean> {
  try {
    await ensureSettingsTable();
    const rows = await query<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [ONLINE_PAYMENT_KEY]
    );
    if (!rows.length) return true;
    return rows[0].value !== 'false';
  } catch {
    return true;
  }
}

export async function setOnlinePaymentEnabled(enabled: boolean): Promise<void> {
  await ensureSettingsTable();
  await query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [ONLINE_PAYMENT_KEY, enabled ? 'true' : 'false']
  );
  revalidatePath('/dashboard/settings');
  revalidatePath('/checkout');
}

/**
 * Whether the customer-facing site is in maintenance mode. Defaults to OFF and
 * fails open (a settings-table error must never take the whole site down).
 */
export async function getMaintenanceMode(): Promise<boolean> {
  try {
    await ensureSettingsTable();
    const rows = await query<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [MAINTENANCE_KEY]
    );
    return rows.length > 0 && rows[0].value === 'true';
  } catch {
    return false;
  }
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await ensureSettingsTable();
  await query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [MAINTENANCE_KEY, enabled ? 'true' : 'false']
  );
  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
}
