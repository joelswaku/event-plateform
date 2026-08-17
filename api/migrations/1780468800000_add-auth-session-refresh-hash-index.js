export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token_hash
      ON public.auth_sessions (refresh_token_hash);
  `);
};

export const down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS public.idx_auth_sessions_refresh_token_hash;');
};
