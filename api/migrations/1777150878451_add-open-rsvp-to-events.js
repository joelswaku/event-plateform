export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE events
      ADD COLUMN IF NOT EXISTS open_rsvp BOOLEAN NOT NULL DEFAULT false;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE events DROP COLUMN IF EXISTS open_rsvp;
  `);
};
