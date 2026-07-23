import { db } from './config/db.js';

async function checkEvents() {
  const client = await db.connect();

  try {
    // Check all events
    const events = await client.query(`
      SELECT e.id, e.slug, e.title, e.status, e.visibility, ep.page_status
      FROM events e
      LEFT JOIN event_pages ep ON e.id = ep.event_id
      WHERE e.deleted_at IS NULL
      ORDER BY e.created_at DESC
      LIMIT 20
    `);

    console.log(`Total events: ${events.rowCount}`);
    if (events.rows.length > 0) {
      console.table(events.rows);
    } else {
      console.log('No events found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkEvents();
