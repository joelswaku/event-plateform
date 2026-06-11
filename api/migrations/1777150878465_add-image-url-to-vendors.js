export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE planner_vendors
      ADD COLUMN IF NOT EXISTS image_url TEXT;
  `);
}

export async function down(pgm) {
  pgm.sql(`
    ALTER TABLE planner_vendors DROP COLUMN IF EXISTS image_url;
  `);
}
