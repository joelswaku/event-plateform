/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.createTable("notifications", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },
    type: { type: "varchar(64)", notNull: true },
    title: { type: "varchar(255)", notNull: true },
    body: { type: "text" },
    link: { type: "varchar(512)" },
    metadata: { type: "jsonb", default: pgm.func("'{}'::jsonb") },
    read_at: { type: "timestamptz" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("notifications", "user_id", { name: "notifications_user_id_idx" });
  pgm.createIndex("notifications", "created_at", { name: "notifications_created_at_idx" });
  pgm.createIndex("notifications", ["user_id", "read_at"], {
    name: "notifications_unread_idx",
    where: "read_at IS NULL",
  });
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropTable("notifications", { ifExists: true });
};
