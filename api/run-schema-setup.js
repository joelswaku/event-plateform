#!/usr/bin/env node

/**
 * One-time database schema setup script
 * Runs the complete SQL schema to create all tables
 */

import fs from 'fs';
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function setupDatabase() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('📝 Reading SQL schema file...');
    const sql = fs.readFileSync('./setup-database.sql', 'utf8');

    console.log('🚀 Executing schema setup...');
    await client.query(sql);

    console.log('✅ DATABASE SETUP COMPLETE!');
    console.log('');
    console.log('Tables created:');
    console.log('- users');
    console.log('- events');
    console.log('- issued_tickets');
    console.log('- vendors');
    console.log('- organizers');
    console.log('- organizer_saved_vendors');
    console.log('- notifications');
    console.log('- webhook_events');
    console.log('- feature_flags');
    console.log('- audit_logs');
    console.log('- countries');
    console.log('- event_invitations');
    console.log('- event_members');
    console.log('- organization_members');
    console.log('- planner_vendors');
    console.log('- ticket_scans');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
