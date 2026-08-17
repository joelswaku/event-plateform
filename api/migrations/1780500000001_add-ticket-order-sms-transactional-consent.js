export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE public.ticket_orders
      ADD COLUMN IF NOT EXISTS sms_transactional_consent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS sms_transactional_consent_source VARCHAR(40),
      ADD COLUMN IF NOT EXISTS sms_transactional_consent_version VARCHAR(20);

    CREATE INDEX IF NOT EXISTS idx_ticket_orders_sms_transactional_consent
      ON public.ticket_orders (event_id, sms_transactional_consent_at)
      WHERE sms_transactional_consent_at IS NOT NULL;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS public.idx_ticket_orders_sms_transactional_consent;

    ALTER TABLE public.ticket_orders
      DROP COLUMN IF EXISTS sms_transactional_consent_version,
      DROP COLUMN IF EXISTS sms_transactional_consent_source,
      DROP COLUMN IF EXISTS sms_transactional_consent_at;
  `);
};
