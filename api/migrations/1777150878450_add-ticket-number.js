// /**
//  * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
//  */
// export const shorthands = undefined;
// //  1777150878450_add-ticket-number.js
// /**
//  * @param pgm {import('node-pg-migrate').MigrationBuilder}
//  * @param run {() => void | undefined}
//  * @returns {Promise<void> | void}
//  */
// export const up = (pgm) => {};

// /**
//  * @param pgm {import('node-pg-migrate').MigrationBuilder}
//  * @param run {() => void | undefined}
//  * @returns {Promise<void> | void}
//  */
// export const down = (pgm) => {};






// api/migrations/TIMESTAMP_add_ticket_number_to_issued_tickets.js
// Run: node-pg-migrate up
// Or apply the SQL directly:
//
//   ALTER TABLE issued_tickets
//     ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20);
//
//   CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;
//
//   UPDATE issued_tickets
//     SET ticket_number = 'TKT-' || LPAD(nextval('ticket_number_seq')::text, 6, '0')
//   WHERE ticket_number IS NULL;
//
//   CREATE OR REPLACE FUNCTION assign_ticket_number()
//   RETURNS TRIGGER AS $$
//   BEGIN
//     IF NEW.ticket_number IS NULL THEN
//       NEW.ticket_number := 'TKT-' || LPAD(nextval('ticket_number_seq')::text, 6, '0');
//     END IF;
//     RETURN NEW;
//   END;
//   $$ LANGUAGE plpgsql;
//
//   DROP TRIGGER IF EXISTS trg_assign_ticket_number ON issued_tickets;
//   CREATE TRIGGER trg_assign_ticket_number
//     BEFORE INSERT ON issued_tickets
//     FOR EACH ROW EXECUTE FUNCTION assign_ticket_number();

export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE issued_tickets
      ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20);

    CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;

    UPDATE issued_tickets
      SET ticket_number = 'TKT-' || LPAD(nextval('ticket_number_seq')::text, 6, '0')
    WHERE ticket_number IS NULL;

    CREATE OR REPLACE FUNCTION assign_ticket_number()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := 'TKT-' || LPAD(nextval('ticket_number_seq')::text, 6, '0');
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_assign_ticket_number ON issued_tickets;
    CREATE TRIGGER trg_assign_ticket_number
      BEFORE INSERT ON issued_tickets
      FOR EACH ROW EXECUTE FUNCTION assign_ticket_number();
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_assign_ticket_number ON issued_tickets;
    DROP FUNCTION IF EXISTS assign_ticket_number();
    ALTER TABLE issued_tickets DROP COLUMN IF EXISTS ticket_number;
    DROP SEQUENCE IF EXISTS ticket_number_seq;
  `);
};
