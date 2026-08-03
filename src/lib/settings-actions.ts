'use server';

import { revalidatePath } from 'next/cache';

import { query } from '@/lib/postgres';
import {
  DEFAULT_COMBO_PROMO_CONFIG,
  normalizeComboPromoConfig,
  type ComboPromoConfig,
} from '@/lib/combo-promo';
import {
  DEFAULT_CUSTOMER_CONTENT,
  normalizeCustomerContentConfig,
  type CustomerContentConfig,
} from '@/lib/customer-content';

const ONLINE_PAYMENT_KEY = 'online_payment_enabled';
const MAINTENANCE_KEY = 'maintenance_mode';
const COMBO_PROMO_KEY = 'combo_promo_config';
const BOOKING_HOLD_KEY = 'booking_hold_minutes';
const CUSTOMER_CONTENT_KEY = 'customer_content_config';

/** Default window (minutes) an unpaid "Chờ thanh toán" booking keeps holding its slot. */
const DEFAULT_BOOKING_HOLD_MINUTES = 10;

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

/**
 * Combo promo config (time-slot discount tiers). Defaults to the built-in tiers
 * and fails open — a settings-table error must never crash the booking page.
 */
export async function getComboPromoConfig(): Promise<ComboPromoConfig> {
  try {
    await ensureSettingsTable();
    const rows = await query<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [COMBO_PROMO_KEY]
    );
    if (!rows.length) return DEFAULT_COMBO_PROMO_CONFIG;
    return normalizeComboPromoConfig(JSON.parse(rows[0].value));
  } catch {
    return DEFAULT_COMBO_PROMO_CONFIG;
  }
}

export async function setComboPromoConfig(config: ComboPromoConfig): Promise<void> {
  await ensureSettingsTable();
  const normalized = normalizeComboPromoConfig(config);
  await query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [COMBO_PROMO_KEY, JSON.stringify(normalized)]
  );
  revalidatePath('/dashboard/settings');
  // Room detail pages render the promo banner/pricing from this config.
  revalidatePath('/', 'layout');
}

/** Clamp any untrusted minutes value to a safe non-negative integer. */
function normalizeHoldMinutes(raw: unknown): number {
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n) || n < 0) return DEFAULT_BOOKING_HOLD_MINUTES;
  return Math.min(n, 24 * 60); // cap at 24h
}

/**
 * Minutes an unpaid "Chờ thanh toán" booking keeps holding its timeslot before the
 * slot is treated as released. `0` disables auto-release (holds never expire).
 * Defaults to {@link DEFAULT_BOOKING_HOLD_MINUTES} and fails open on a table error.
 */
export async function getBookingHoldMinutes(): Promise<number> {
  try {
    await ensureSettingsTable();
    const rows = await query<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [BOOKING_HOLD_KEY]
    );
    if (!rows.length) return DEFAULT_BOOKING_HOLD_MINUTES;
    return normalizeHoldMinutes(rows[0].value);
  } catch {
    return DEFAULT_BOOKING_HOLD_MINUTES;
  }
}

export async function setBookingHoldMinutes(minutes: number): Promise<void> {
  await ensureSettingsTable();
  const value = normalizeHoldMinutes(minutes);
  await query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [BOOKING_HOLD_KEY, String(value)]
  );
  revalidatePath('/dashboard/settings');
}

export async function getCustomerContentConfig(): Promise<CustomerContentConfig> {
  try {
    await ensureSettingsTable();
    const rows = await query<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [CUSTOMER_CONTENT_KEY]
    );
    if (!rows.length) return DEFAULT_CUSTOMER_CONTENT;
    return normalizeCustomerContentConfig(JSON.parse(rows[0].value));
  } catch {
    return DEFAULT_CUSTOMER_CONTENT;
  }
}

export async function setCustomerContentConfig(config: CustomerContentConfig): Promise<void> {
  await ensureSettingsTable();
  const normalized = normalizeCustomerContentConfig(config);
  await query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [CUSTOMER_CONTENT_KEY, JSON.stringify(normalized)]
  );
  revalidatePath('/dashboard/settings');
  revalidatePath('/guide');
  revalidatePath('/rules');
  revalidatePath('/cancellation-policy');
  revalidatePath('/checkout/success');
}
