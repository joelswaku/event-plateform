import { db }             from "../config/db.js";
import { LEGAL_DEFAULTS } from "../config/legal-defaults.js";

/* ── Auto-create table + seed defaults ──────────────────────────── */
async function ensureLegalTable() {
  const client = await db.connect();
  try {
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

    for (const page of LEGAL_DEFAULTS) {
      await client.query(
        `INSERT INTO legal_pages (slug, title, content, version, effective_date)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO NOTHING`,
        [page.slug, page.title, page.content, page.version, page.effective_date]
      );
    }
  } finally {
    client.release();
  }
}

/* ── Public: get a single published page ────────────────────────── */
export async function getLegalPageService(slug) {
  await ensureLegalTable();
  const { rows } = await db.query(
    `SELECT id, slug, title, content, version, effective_date, updated_at
     FROM legal_pages WHERE slug = $1 AND is_published = true LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

/* ── Super admin: get single page (includes drafts + content) ───── */
export async function getAdminLegalPageService(slug) {
  await ensureLegalTable();
  const { rows } = await db.query(
    `SELECT * FROM legal_pages WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

/* ── Super admin: list all pages ─────────────────────────────────── */
export async function listLegalPagesService() {
  await ensureLegalTable();
  const { rows } = await db.query(
    `SELECT id, slug, title, version, effective_date, is_published, updated_at
     FROM legal_pages ORDER BY title ASC`
  );
  return rows;
}

/* ── Super admin: upsert a page ──────────────────────────────────── */
export async function upsertLegalPageService({ slug, title, content, version, effective_date, is_published, userId }) {
  await ensureLegalTable();
  const { rows } = await db.query(
    `INSERT INTO legal_pages (slug, title, content, version, effective_date, is_published, updated_at, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
     ON CONFLICT (slug) DO UPDATE SET
       title          = EXCLUDED.title,
       content        = EXCLUDED.content,
       version        = EXCLUDED.version,
       effective_date = EXCLUDED.effective_date,
       is_published   = EXCLUDED.is_published,
       updated_at     = NOW(),
       updated_by     = EXCLUDED.updated_by
     RETURNING *`,
    [slug, title, content, version ?? '1.0', effective_date ?? new Date().toISOString().slice(0,10), is_published ?? true, userId ?? null]
  );
  return rows[0];
}

/* ── Super admin: delete ─────────────────────────────────────────── */
export async function deleteLegalPageService(slug) {
  await ensureLegalTable();
  await db.query(`DELETE FROM legal_pages WHERE slug = $1`, [slug]);
}
