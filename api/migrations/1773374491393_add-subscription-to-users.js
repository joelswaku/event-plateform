/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.addColumns("users", {
    stripe_customer_id: {
      type: "varchar(255)",
      notNull: false,
      default: null,
    },
    subscription_id: {
      type: "varchar(255)",
      notNull: false,
      default: null,
    },
    subscription_status: {
      type: "varchar(50)",
      notNull: false,
      default: null,
    },
    subscription_plan: {
      type: "varchar(50)",
      notNull: false,
      default: "'free'",
    },
    subscription_current_period_end: {
      type: "timestamptz",
      notNull: false,
      default: null,
    },
    is_subscribed: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });

  pgm.addConstraint("users", "users_stripe_customer_id_unique", "UNIQUE (stripe_customer_id)");
  pgm.createIndex("users", "stripe_customer_id", { name: "users_stripe_customer_id_idx" });
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (pgm) => {
  pgm.dropIndex("users", "stripe_customer_id", { name: "users_stripe_customer_id_idx", ifExists: true });
  pgm.dropConstraint("users", "users_stripe_customer_id_unique", { ifExists: true });
  pgm.dropColumns("users", [
    "stripe_customer_id",
    "subscription_id",
    "subscription_status",
    "subscription_plan",
    "subscription_current_period_end",
    "is_subscribed",
  ]);
};
