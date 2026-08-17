/**
 * Add SMS transactional consent tracking to guests table.
 *
 * Adds columns to track when guests consent to receive transactional SMS
 * (invitations, QR codes, event updates) per event.
 */

export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE public.guests
      ADD COLUMN IF NOT EXISTS sms_transactional_consent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS sms_transactional_consent_source VARCHAR(40),
      ADD COLUMN IF NOT EXISTS sms_transactional_consent_version VARCHAR(20);

    CREATE INDEX IF NOT EXISTS idx_guests_sms_transactional_consent
      ON public.guests (event_id, sms_transactional_consent_at)
      WHERE sms_transactional_consent_at IS NOT NULL;

    COMMENT ON COLUMN public.guests.sms_transactional_consent_at IS 'When the guest consented to receive transactional SMS for this event';
    COMMENT ON COLUMN public.guests.sms_transactional_consent_source IS 'How consent was obtained (e.g., rsvp_form, organizer_added, bulk_import)';
    COMMENT ON COLUMN public.guests.sms_transactional_consent_version IS 'Version of consent terms accepted';
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS public.idx_guests_sms_transactional_consent;

    ALTER TABLE public.guests
      DROP COLUMN IF EXISTS sms_transactional_consent_version,
      DROP COLUMN IF EXISTS sms_transactional_consent_source,
      DROP COLUMN IF EXISTS sms_transactional_consent_at;
  `);
};
