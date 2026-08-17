/**
 * One-time legal-content rollout for the built-in legal pages.
 * Safe to re-run — it updates only uncustomized, older default pages.
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
           updated_at     = NOW()
         WHERE legal_pages.updated_by IS NULL
           AND legal_pages.version <> EXCLUDED.version`,
        [p.slug, p.title, p.content, p.version, p.effective_date]
      );
      console.log(`✓  ${p.slug}`);
    }

    console.log("\n✅  Built-in legal pages checked and updated where eligible.");
  } finally {
    client.release();
    await db.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
