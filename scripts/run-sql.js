const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync(process.argv[2], 'utf8');
pool.query(sql)
  .then(() => { console.log('✅ SQL executed'); return pool.end(); })
  .catch(e => { console.error('❌', e.message); return pool.end().then(() => process.exit(1)); });
