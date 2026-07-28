import { db } from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupReminders() {
  try {
    console.log('🚀 Setting up event reminders...');

    // Read and execute migration
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create-event-reminders.sql'),
      'utf-8'
    );

    await db.query(migrationSQL);

    console.log('✅ Event reminders tables created successfully!');
    console.log('✅ Default instant reminders added to all existing events');
    console.log('\n📧 Email reminders are now ready to use!');
    console.log('\nWhat happens now:');
    console.log('1. When a user RSVPs (status: GOING), they instantly receive a confirmation email');
    console.log('2. Scheduled reminders (24 hours, 7 days, etc.) are sent by the cron job');
    console.log('3. Event owners can customize reminders from the event settings');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up reminders:', error);
    process.exit(1);
  }
}

setupReminders();
