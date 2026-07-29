/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
export const shorthands = undefined;

/**
 * Stores a client-generated request key for public payment creation requests.
 * The partial unique indexes allow older rows without a key to remain valid.
 *
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE ticket_orders
      ADD COLUMN IF NOT EXISTS client_request_id VARCHAR(128);

    ALTER TABLE event_donations
      ADD COLUMN IF NOT EXISTS client_request_id VARCHAR(128);

    CREATE UNIQUE INDEX IF NOT EXISTS ticket_orders_event_request_id_unique
      ON ticket_orders (event_id, client_request_id)
      WHERE client_request_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS event_donations_event_request_id_unique
      ON event_donations (event_id, client_request_id)
      WHERE client_request_id IS NOT NULL;
  `);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS ticket_orders_event_request_id_unique;
    DROP INDEX IF EXISTS event_donations_event_request_id_unique;
    ALTER TABLE ticket_orders DROP COLUMN IF EXISTS client_request_id;
    ALTER TABLE event_donations DROP COLUMN IF EXISTS client_request_id;
  `);
};
