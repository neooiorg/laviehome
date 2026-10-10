import "server-only";

import { createHmac, randomInt, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

import {
  DEFAULT_LUCKY_WHEEL_PRIZES,
  type LuckyWheelPrize,
  type LuckyWheelPrizeKey,
} from "@/lib/lucky-wheel-config";
import { getLuckyWheelConfig } from "@/lib/lucky-wheel-settings";
import { query } from "@/lib/postgres";

export const LUCKY_WHEEL_DEVICE_COOKIE = "lvh-wheel-device";

export type LuckyWheelSpinResult = {
  alreadySpun: boolean;
  prizeKey: LuckyWheelPrizeKey;
  prizeIndex: number;
  prizeLabel: string;
  prizePercent: number;
  voucherCode: string | null;
  voucherExpiresAt: string | null;
  phoneMasked: string;
  spinDate: string;
};

type SpinRow = {
  spin_date: string;
  phone_masked: string;
  prize_key: string;
  prize_label: string;
  prize_percent: number;
  voucher_code: string | null;
  expires_at: string | null;
};

function getHashSecret() {
  const secret =
    process.env.LUCKY_WHEEL_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.ADMIN_SECRET;

  if (!secret) {
    throw new Error("Lucky wheel hash secret is not configured.");
  }

  return secret;
}

export function normalizeVietnamPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length === 11) digits = `0${digits.slice(2)}`;
  return /^0[35789]\d{8}$/.test(digits) ? digits : null;
}

export function hashLuckyWheelValue(value: string) {
  return createHmac("sha256", getHashSecret()).update(value).digest("hex");
}

export function hashLuckyWheelPhone(phone: string) {
  const normalized = normalizeVietnamPhone(phone);
  return normalized ? hashLuckyWheelValue(`phone:${normalized}`) : null;
}

export function maskVietnamPhone(phone: string) {
  const normalized = normalizeVietnamPhone(phone);
  if (!normalized) return "";
  return `${normalized.slice(0, 3)} *** ${normalized.slice(-3)}`;
}

export function getVietnamDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function createLuckyWheelDeviceId() {
  return randomUUID();
}

export async function ensureLuckyWheelTables(client?: Pick<PoolClient, "query">) {
  const run = client
    ? (text: string) => client.query(text)
    : (text: string) => query(text);

  await run(`
    CREATE TABLE IF NOT EXISTS discount_codes (
      code VARCHAR(50) PRIMARY KEY,
      percent INTEGER NOT NULL CHECK (percent > 0 AND percent <= 100),
      description VARCHAR(255),
      active BOOLEAN DEFAULT TRUE,
      max_uses INTEGER DEFAULT NULL,
      used_count INTEGER DEFAULT 0,
      expires_at TIMESTAMPTZ DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS recipient_phone_hash TEXT`);
  await run(`ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS source VARCHAR(40)`);
  await run(`
    CREATE TABLE IF NOT EXISTS lucky_wheel_spins (
      id UUID PRIMARY KEY,
      spin_date DATE NOT NULL,
      device_hash CHAR(64) NOT NULL,
      phone_hash CHAR(64) NOT NULL,
      phone_masked VARCHAR(20) NOT NULL,
      prize_key VARCHAR(40) NOT NULL,
      prize_label VARCHAR(100) NOT NULL,
      prize_percent INTEGER NOT NULL DEFAULT 0,
      voucher_code VARCHAR(50) REFERENCES discount_codes(code) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (device_hash, spin_date)
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_lucky_wheel_spins_created_at ON lucky_wheel_spins(created_at DESC)`);
}

function selectPrize(prizes: LuckyWheelPrize[]) {
  const totalWeight = prizes.reduce((total, prize) => total + prize.weight, 0);
  let draw = randomInt(1, totalWeight + 1);

  for (const segment of prizes) {
    draw -= segment.weight;
    if (draw <= 0) return segment;
  }

  return prizes.at(-1)!;
}

function makeVoucherCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let index = 0; index < 8; index += 1) suffix += alphabet[randomInt(0, alphabet.length)];
  return `LAVIE-${suffix}`;
}

function mapSpin(row: SpinRow, alreadySpun: boolean, prizes: LuckyWheelPrize[]): LuckyWheelSpinResult {
  const prizeIndex = prizes.findIndex((segment) => segment.key === row.prize_key);
  return {
    alreadySpun,
    prizeKey: row.prize_key,
    prizeIndex: Math.max(prizeIndex, 0),
    prizeLabel: row.prize_label,
    prizePercent: Number(row.prize_percent),
    voucherCode: row.voucher_code,
    voucherExpiresAt: row.expires_at,
    phoneMasked: row.phone_masked,
    spinDate: row.spin_date,
  };
}

async function findTodaySpin(client: Pick<PoolClient, "query">, deviceHash: string, spinDate: string) {
  const result = await client.query<SpinRow>(
    `SELECT s.spin_date::text, s.phone_masked, s.prize_key, s.prize_label, s.prize_percent,
            s.voucher_code, d.expires_at::text
       FROM lucky_wheel_spins s
       LEFT JOIN discount_codes d ON d.code = s.voucher_code
      WHERE s.device_hash = $1 AND s.spin_date = $2::date
      LIMIT 1`,
    [deviceHash, spinDate]
  );
  return result.rows[0] ?? null;
}

export async function getLuckyWheelStatus(
  client: Pick<PoolClient, "query">,
  deviceId: string,
  prizes: LuckyWheelPrize[] = DEFAULT_LUCKY_WHEEL_PRIZES
) {
  await ensureLuckyWheelTables(client);
  const spinDate = getVietnamDateKey();
  const row = await findTodaySpin(client, hashLuckyWheelValue(`device:${deviceId}`), spinDate);
  return row ? mapSpin(row, true, prizes) : null;
}

export async function createLuckyWheelSpin(
  client: PoolClient,
  input: { deviceId: string; phone: string }
): Promise<LuckyWheelSpinResult> {
  await ensureLuckyWheelTables(client);
  const normalizedPhone = normalizeVietnamPhone(input.phone);
  if (!normalizedPhone) throw new Error("INVALID_PHONE");
  const config = await getLuckyWheelConfig();
  if (!config.enabled) throw new Error("LUCKY_WHEEL_DISABLED");

  const spinDate = getVietnamDateKey();
  const deviceHash = hashLuckyWheelValue(`device:${input.deviceId}`);
  const existing = await findTodaySpin(client, deviceHash, spinDate);
  if (existing) return mapSpin(existing, true, config.prizes);

  const segment = selectPrize(config.prizes);
  const prizePercent = segment.percent;
  const phoneHash = hashLuckyWheelValue(`phone:${normalizedPhone}`);
  const phoneMasked = maskVietnamPhone(normalizedPhone);
  let voucherCode: string | null = null;
  let voucherExpiresAt: string | null = null;

  await client.query("BEGIN");
  try {
    if (prizePercent > 0) {
      const expiresAt = new Date(Date.now() + config.voucherDays * 24 * 60 * 60 * 1000);
      voucherExpiresAt = expiresAt.toISOString();

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = makeVoucherCode();
        const inserted = await client.query(
          `INSERT INTO discount_codes (
             code, percent, description, active, max_uses, used_count, expires_at,
             recipient_phone_hash, source
           ) VALUES ($1, $2, $3, TRUE, 1, 0, $4, $5, 'lucky-wheel')
           ON CONFLICT (code) DO NOTHING
           RETURNING code`,
          [candidate, prizePercent, `Vòng quay may mắn - Giảm ${prizePercent}%`, expiresAt, phoneHash]
        );
        if (inserted.rowCount) {
          voucherCode = candidate;
          break;
        }
      }

      if (!voucherCode) throw new Error("VOUCHER_GENERATION_FAILED");
    }

    await client.query(
      `INSERT INTO lucky_wheel_spins (
         id, spin_date, device_hash, phone_hash, phone_masked, prize_key,
         prize_label, prize_percent, voucher_code
       ) VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9)`,
      [
        randomUUID(),
        spinDate,
        deviceHash,
        phoneHash,
        phoneMasked,
        segment.key,
        segment.label,
        prizePercent,
        voucherCode,
      ]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505") {
      const concurrent = await findTodaySpin(client, deviceHash, spinDate);
      if (concurrent) return mapSpin(concurrent, true, config.prizes);
    }
    throw error;
  }

  return {
    alreadySpun: false,
    prizeKey: segment.key,
    prizeIndex: config.prizes.findIndex((item) => item.key === segment.key),
    prizeLabel: segment.label,
    prizePercent,
    voucherCode,
    voucherExpiresAt,
    phoneMasked,
    spinDate,
  };
}
