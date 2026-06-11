export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE planner_vendors
      ADD COLUMN IF NOT EXISTS google_place_id TEXT;

    -- Unique index so the same Google place can only be added once per project
    CREATE UNIQUE INDEX IF NOT EXISTS planner_vendors_project_google_place_uniq
      ON planner_vendors (project_id, google_place_id)
      WHERE google_place_id IS NOT NULL;
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP INDEX IF EXISTS planner_vendors_project_google_place_uniq;
    ALTER TABLE planner_vendors DROP COLUMN IF EXISTS google_place_id;
  `);
}
