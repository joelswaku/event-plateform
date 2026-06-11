/**
 * One-time migration: force-upsert all four legal pages in the database.
 * Safe to re-run — uses ON CONFLICT DO UPDATE.
 *
 * Usage:  node scripts/seed-legal-content.js
 */

import { db }             from "../config/db.js";
import { LEGAL_DEFAULTS } from "../config/legal-defaults.js";

async function run() {
  const client = await db.connect();
  try {
    /* Ensure the table exists first */
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_pages (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        slug           VARCHAR(80)  UNIQUE NOT NULL,
        title          TEXT         NOT NULL,
        content        TEXT         NOT NULL DEFAULT '',
        version        VARCHAR(20)  NOT NULL DEFAULT '1.0',
        effective_date DATE         NOT NULL DEFAULT CURRENT_DATE,
        is_published   BOOLEAN      NOT NULL DEFAULT true,
        updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_by     UUID
      )
    `);

    for (const p of LEGAL_DEFAULTS) {
      await client.query(
        `INSERT INTO legal_pages (slug, title, content, version, effective_date, is_published, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title          = EXCLUDED.title,
           content        = EXCLUDED.content,
           version        = EXCLUDED.version,
           effective_date = EXCLUDED.effective_date,
           is_published   = true,
           updated_at     = NOW()`,
        [p.slug, p.title, p.content, p.version, p.effective_date]
      );
      console.log(`✓  ${p.slug}`);
    }

    console.log("\n✅  All four legal pages upserted successfully.");
  } finally {
    client.release();
    await db.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
