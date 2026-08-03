import 'server-only';

import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __laviePgPool: Pool | undefined;
}

let _pool: Pool | undefined;

function getPool(): Pool {
  if (_pool) return _pool;
  if (globalThis.__laviePgPool) {
    _pool = globalThis.__laviePgPool;
    return _pool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  const pool = new Pool({ connectionString, ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false } });

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__laviePgPool = pool;
  }

  _pool = pool;
  return pool;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
