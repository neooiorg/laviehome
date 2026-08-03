import "server-only";

import type { Pool } from "pg";

import { query } from "@/lib/postgres";

type Queryable = Pick<Pool, "query">;

export const DEFAULT_WIFI_NAME = "LAVIE HOME";
export const DEFAULT_WIFI_PASSWORD = "laviehome";

export async function ensureRoomGuestContentColumns(db?: Queryable): Promise<void> {
  const run = (sql: string) => (db ? db.query(sql) : query(sql));

  await run(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS wifi_name TEXT DEFAULT ''`).catch(() => null);
  await run(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS wifi_password TEXT DEFAULT ''`).catch(() => null);
  await run(`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS booking_notice TEXT DEFAULT ''`).catch(() => null);
}

export function resolveRoomWifiName(value: string | null | undefined) {
  return value?.trim() || DEFAULT_WIFI_NAME;
}

export function resolveRoomWifiPassword(value: string | null | undefined) {
  return value?.trim() || DEFAULT_WIFI_PASSWORD;
}
