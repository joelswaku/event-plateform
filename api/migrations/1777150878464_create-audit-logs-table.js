// The audit_logs table already exists (created by auth.service.js).
// This migration extends it with super-admin specific columns and indexes.

export async function up(pgm) {
  pgm.sql(`
    ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS admin_email  TEXT,
      ADD COLUMN IF NOT EXISTS resource_id  TEXT;

    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor       ON audit_logs(actor_user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action      ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs(created_at DESC);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_audit_logs_created_at;
    DROP INDEX IF EXISTS idx_audit_logs_resource_id;
    DROP INDEX IF EXISTS idx_audit_logs_entity_type;
    DROP INDEX IF EXISTS idx_audit_logs_action;
    DROP INDEX IF EXISTS idx_audit_logs_actor;
    ALTER TABLE audit_logs
      DROP COLUMN IF EXISTS resource_id,
      DROP COLUMN IF EXISTS admin_email;
  `);
}
