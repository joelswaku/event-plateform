#!/usr/bin/env node
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/liteevent';

const client = new pg.Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  console.log('✓ Connected to database');

  // Add columns
  await client.query(`
    ALTER TABLE public.guests
      ADD COLUMN IF NOT EXISTS sms_transactional_consent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS sms_transactional_consent_source VARCHAR(40),
      ADD COLUMN IF NOT EXISTS sms_transactional_consent_version VARCHAR(20);
  `);
  console.log('✓ Added SMS consent columns');

  // Add index
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_guests_sms_transactional_consent
      ON public.guests (event_id, sms_transactional_consent_at)
      WHERE sms_transactional_consent_at IS NOT NULL;
  `);
  console.log('✓ Created index');

  // Add comments
  await client.query(`
    COMMENT ON COLUMN public.guests.sms_transactional_consent_at IS 'When the guest consented to receive transactional SMS for this event';
    COMMENT ON COLUMN public.guests.sms_transactional_consent_source IS 'How consent was obtained (e.g., rsvp_form, organizer_added, bulk_import)';
    COMMENT ON COLUMN public.guests.sms_transactional_consent_version IS 'Version of consent terms accepted';
  `);
  console.log('✓ Added column comments');

  console.log('✅ SMS consent migration applied successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  await client.end();
}
