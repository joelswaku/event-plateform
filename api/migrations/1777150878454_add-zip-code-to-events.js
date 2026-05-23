export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE events
      ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20) DEFAULT NULL;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE events DROP COLUMN IF EXISTS zip_code;
  `);
};
