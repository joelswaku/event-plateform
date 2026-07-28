import { db } from "../config/db.js";

async function createRemindersTable() {
  try {
    console.log("Creating event_reminders table...");

    await db.query(`
      CREATE TABLE IF NOT EXISTS event_reminders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        timing VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        locked BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    console.log("✓ Table created");

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON event_reminders(event_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_event_reminders_enabled ON event_reminders(enabled) WHERE enabled = true
    `);

    console.log("✓ Indexes created");
    console.log("✓ Migration complete!");

    process.exit(0);
  } catch (error) {
    console.error("Error creating table:", error);
    process.exit(1);
  }
}

createRemindersTable();
