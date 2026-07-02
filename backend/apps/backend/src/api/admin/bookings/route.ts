import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import pg from "pg";

const { Pool } = pg;

let pool: InstanceType<typeof Pool> | null = null;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = getPool();

    // Ensure cccd columns exist
    await db.query(`
      ALTER TABLE bookings
        ADD COLUMN IF NOT EXISTS cccd_front TEXT,
        ADD COLUMN IF NOT EXISTS cccd_back TEXT
    `).catch(() => {});

    const result = await db.query(`
      SELECT id, room_name, branch_name, customer_name, customer_phone,
             date_label, time_range, amount, status, guest_count,
             has_car, has_decoration, discount_code, notes,
             cccd_front, cccd_back, created_at
      FROM bookings
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({ bookings: result.rows });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
}
