#!/usr/bin/env node
const https = require('https');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function clerkGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'api.clerk.com', path, headers: { Authorization: 'Bearer ' + process.env.CLERK_SECRET_KEY } },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const users = await clerkGet('/v1/users?limit=100');
  const client = await pool.connect();
  try {
    for (const u of users) {
      const email = u.email_addresses[0]?.email_address;
      if (!email) continue;
      const name = ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || email;
      const existing = await client.query('SELECT id FROM auth_user WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        console.log('⏭  skip (exists):', email);
        continue;
      }
      await client.query(
        `INSERT INTO auth_user (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, $4, now(), now())`,
        [randomUUID(), name, email, 'admin']
      );
      console.log('✅ created:', email, '|', name);
    }
    console.log('\n🎉 Done!');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
