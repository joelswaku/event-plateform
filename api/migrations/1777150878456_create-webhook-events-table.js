/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.createTable("webhook_events", {
    id: { type: "serial", primaryKey: true },
    provider: { type: "varchar(50)", notNull: true },
    event_type: { type: "varchar(100)", notNull: true },
    external_event_id: { type: "varchar(255)", notNull: true, unique: true },
    payload: { type: "jsonb", notNull: false },
    processed: { type: "boolean", notNull: true, default: false },
    processed_at: { type: "timestamptz", notNull: false, default: null },
    error_message: { type: "text", notNull: false, default: null },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  }, { ifNotExists: true });

  pgm.createIndex("webhook_events", "external_event_id", { name: "webhook_events_external_event_id_idx", ifNotExists: true });
  pgm.createIndex("webhook_events", "processed", { name: "webhook_events_processed_idx", ifNotExists: true });
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropTable("webhook_events", { ifExists: true });
};
