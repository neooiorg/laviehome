#!/usr/bin/env node

/**
 * Seed initial admin users for Better Auth.
 * Usage: DATABASE_URL="postgresql://..." node scripts/seed-admin.js
 */

const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const admins = [
  { email: 'nttantts@gmail.com', name: 'Admin', role: 'admin' },
  { email: 'admin@laviehome.vn', name: 'Lavie Admin', role: 'admin' },
];

async function seed() {
  const client = await pool.connect();
  try {
    for (const admin of admins) {
      const existing = await client.query('SELECT id FROM "user" WHERE email = $1', [admin.email]);
      if (existing.rows.length > 0) {
        console.log(`⏭  ${admin.email} already exists, skipping.`);
        continue;
      }
      await client.query(
        `INSERT INTO "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, $4, now(), now())`,
        [randomUUID(), admin.name, admin.email, admin.role]
      );
      console.log(`✅ Created admin: ${admin.email}`);
    }
    console.log('\n🎉 Seed completed!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
