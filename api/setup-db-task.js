#!/usr/bin/env node

/**
 * One-time database setup task
 * Creates all database tables, indexes, and constraints
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

async function setupDatabase() {
  console.log('========================================');
  console.log('DATABASE SETUP TASK');
  console.log('========================================');
  console.log('');

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');
    console.log('');

    const sqlFile = path.join(__dirname, 'setup-database.sql');
    console.log('Reading SQL from:', sqlFile);

    if (!fs.existsSync(sqlFile)) {
      throw new Error(`SQL file not found: ${sqlFile}`);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log(`SQL file size: ${sql.length} bytes`);
    console.log('');

    console.log('Executing database setup...');
    console.log('This will create all tables, indexes, and constraints');
    console.log('');

    await client.query(sql);

    console.log('');
    console.log('========================================');
    console.log('SUCCESS! DATABASE SETUP COMPLETE!');
    console.log('========================================');
    console.log('');
    console.log('Tables created:');
    console.log(' - users');
    console.log(' - events');
    console.log(' - issued_tickets');
    console.log(' - vendors');
    console.log(' - organizers');
    console.log(' - organizer_saved_vendors');
    console.log(' - notifications');
    console.log(' - webhook_events');
    console.log(' - feature_flags');
    console.log(' - audit_logs');
    console.log(' - countries');
    console.log(' - event_invitations');
    console.log(' - event_members');
    console.log(' - organization_members');
    console.log(' - planner_vendors');
    console.log(' - ticket_scans');
    console.log('');
    console.log('All indexes and constraints created');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('ERROR:', error.message);
    console.error('');
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
