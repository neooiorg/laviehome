import "server-only";

import {
  DEFAULT_LUCKY_WHEEL_CONFIG,
  normalizeLuckyWheelConfig,
  type LuckyWheelConfig,
} from "@/lib/lucky-wheel-config";
import { query } from "@/lib/postgres";

const LUCKY_WHEEL_CONFIG_KEY = "lucky_wheel_config";

async function ensureSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function getLuckyWheelConfig(): Promise<LuckyWheelConfig> {
  try {
    await ensureSettingsTable();
    const rows = await query<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = $1`,
      [LUCKY_WHEEL_CONFIG_KEY]
    );
    return rows.length ? normalizeLuckyWheelConfig(JSON.parse(rows[0].value)) : DEFAULT_LUCKY_WHEEL_CONFIG;
  } catch {
    return DEFAULT_LUCKY_WHEEL_CONFIG;
  }
}

export async function saveLuckyWheelConfig(value: unknown): Promise<LuckyWheelConfig> {
  const normalized = normalizeLuckyWheelConfig(value);
  await ensureSettingsTable();
  await query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [LUCKY_WHEEL_CONFIG_KEY, JSON.stringify(normalized)]
  );
  return normalized;
}
