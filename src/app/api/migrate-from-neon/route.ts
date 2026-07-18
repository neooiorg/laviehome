import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// TEMPORARY endpoint: copies the entire database from Neon (dev source) into the
// current DATABASE_URL target (the new Dokploy-managed Postgres). Runs inside the
// Docker network so it can reach both the external Neon DB and the internal Dokploy DB.
// Delete after migration is verified.

const NEON_URL =
  'postgresql://neondb_owner:npg_hKlft6kGv9Ha@ep-damp-darkness-aowpqu5c-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// FK-safe order: parents before children.
const TABLES = [
  'branches',
  'rooms',
  'discount_codes',
  'menu_items',
  'auth_user',
  'bookings',
  'booking_menu_items',
  'auth_session',
  'ba_verification',
  'app_settings',
];

// Tables with a SERIAL id whose sequence must be reset after a bulk copy.
const SERIAL_TABLES = ['branches', 'rooms', 'menu_items', 'booking_menu_items'];

function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value;
  // jsonb/json columns come back as JS objects/arrays — stringify for insert.
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const source = new Pool({
    connectionString: NEON_URL,
    ssl: { rejectUnauthorized: false },
  });
  const target = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  });

  const report: Record<string, number> = {};

  try {
    // Clear target (children first) so the copy is idempotent.
    for (const table of [...TABLES].reverse()) {
      await target.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    }

    for (const table of TABLES) {
      const rows = (await source.query(`SELECT * FROM ${table}`)).rows;
      if (rows.length === 0) {
        report[table] = 0;
        continue;
      }

      const columns = Object.keys(rows[0]);
      const colList = columns.map((c) => `"${c}"`).join(', ');

      for (const row of rows) {
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = columns.map((c) => normalize(row[c]));
        await target.query(
          `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
      }
      report[table] = rows.length;
    }

    // Reset SERIAL sequences so new inserts don't collide with copied ids.
    for (const table of SERIAL_TABLES) {
      await target.query(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'),
                       COALESCE((SELECT MAX(id) FROM ${table}), 1),
                       (SELECT MAX(id) IS NOT NULL FROM ${table}))`
      );
    }

    return NextResponse.json({ ok: true, migrated: report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message, partial: report }, { status: 500 });
  } finally {
    await source.end();
    await target.end();
  }
}
