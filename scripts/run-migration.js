#!/usr/bin/env node

/**
 * Database Migration Runner
 * Usage: DATABASE_URL="postgresql://..." node scripts/run-migration.js
 *
 * This script runs the menu items migration on your database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  console.error('\nUsage:');
  console.error('  DATABASE_URL="postgresql://user:pass@host:port/db" node scripts/run-migration.js');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('📦 Starting database migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/001_add_menu_items.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Run migration
    console.log('🔧 Creating tables...');
    await client.query(migrationSql);

    console.log('\n✅ Migration completed successfully!\n');

    // Verify tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('menu_items', 'booking_menu_items', 'bookings')
      ORDER BY table_name;
    `);

    console.log('📋 Tables status:');
    result.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check menu_items_total column
    const columnResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      AND column_name = 'menu_items_total';
    `);

    if (columnResult.rows.length > 0) {
      console.log('   ✓ bookings.menu_items_total');
    }

    console.log('\n🎉 Database is ready for menu items feature!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

runMigration();
