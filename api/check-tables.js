#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://liteevent_admin:LiteEvent2026Pass@liteevent-production-postgres.ck9ycc66044g.us-east-1.rds.amazonaws.com:5432/liteevent_production?sslmode=no-verify";

async function checkTables() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tables in database:');
    if (result.rows.length === 0) {
      console.log('❌ NO TABLES FOUND - Database is empty!');
    } else {
      result.rows.forEach(row => console.log(`✅ ${row.table_name}`));
    }
    console.log(`\nTotal: ${result.rows.length} tables`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
