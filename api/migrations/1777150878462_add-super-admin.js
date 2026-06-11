export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;
  `);
}

export async function down(pgm) {
  pgm.sql(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS is_super_admin;
  `);
}
