export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS terms_accepted_at      TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS terms_version_accepted VARCHAR(20);
  `);
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_users_terms_accepted_at
      ON users (terms_accepted_at)
      WHERE terms_accepted_at IS NOT NULL;
  `);
}

export async function down(pgm) {
  pgm.sql(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS terms_accepted_at,
      DROP COLUMN IF EXISTS terms_version_accepted;
  `);
}
