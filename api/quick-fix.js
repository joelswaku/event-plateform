import { db } from './config/db.js';

async function fixPageStatus() {
  const client = await db.connect();

  try {
    // Update page_status for published events
    const result = await client.query(`
      UPDATE event_pages ep
      SET page_status = 'PUBLISHED',
          published_at = COALESCE(published_at, NOW()),
          updated_at = NOW()
      FROM events e
      WHERE ep.event_id = e.id
        AND e.status = 'PUBLISHED'
        AND e.visibility = 'PUBLIC'
        AND e.deleted_at IS NULL
        AND (ep.page_status IS NULL OR ep.page_status != 'PUBLISHED')
      RETURNING ep.id, e.slug
    `);

    console.log(`Updated ${result.rowCount} event pages`);
    if (result.rows.length > 0) {
      console.log('Updated events:', result.rows);
    }

    // Show all published events
    const events = await client.query(`
      SELECT e.slug, e.status, e.visibility, ep.page_status
      FROM events e
      LEFT JOIN event_pages ep ON e.id = ep.event_id
      WHERE e.status = 'PUBLISHED' AND e.deleted_at IS NULL
      LIMIT 10
    `);

    console.log('\nPublished events:');
    console.table(events.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixPageStatus();
