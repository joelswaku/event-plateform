/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
export const shorthands = undefined;

/**
 * Add index on auth_sessions.refresh_token_hash for faster token lookups
 * during authentication and refresh token validation.
 *
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token_hash
      ON public.auth_sessions (refresh_token_hash);
  `);
};

/**
 * Remove the refresh_token_hash index
 *
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_auth_sessions_refresh_token_hash;
  `);
};
