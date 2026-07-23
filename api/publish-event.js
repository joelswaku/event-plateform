import { db } from './config/db.js';

async function publishEvent() {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Update the event to PUBLISHED and PUBLIC
    const result = await client.query(`
      UPDATE events
      SET status = 'PUBLISHED',
          visibility = 'PUBLIC',
          updated_at = NOW()
      WHERE slug = 'wedding-dona-3c77f7af'
      RETURNING id, slug, title, status, visibility
    `);

    if (result.rows.length === 0) {
      throw new Error('Event not found');
    }

    const event = result.rows[0];
    console.log('Updated event:', event);

    // Update or create event_pages record
    const pageCheck = await client.query(
      `SELECT id FROM event_pages WHERE event_id = $1 LIMIT 1`,
      [event.id]
    );

    if (pageCheck.rows[0]) {
      await client.query(
        `UPDATE event_pages
         SET page_status = 'PUBLISHED',
             published_at = COALESCE(published_at, NOW()),
             updated_at = NOW()
         WHERE id = $1`,
        [pageCheck.rows[0].id]
      );
      console.log('Updated event_pages');
    } else {
      await client.query(
        `INSERT INTO event_pages
           (event_id, public_url, seo_title, seo_description, page_status,
            preview_token, draft_updated_at, published_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'PUBLISHED', $5, NOW(), NOW(), NOW(), NOW())`,
        [
          event.id,
          `/e/${event.slug}`,
          event.title,
          '',
          crypto.randomBytes(24).toString('hex'),
        ]
      );
      console.log('Created event_pages');
    }

    await client.query('COMMIT');

    console.log(`\n✅ Event published! Visit: https://liteevent.com/e/${event.slug}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

publishEvent();
