export const shorthands = undefined;

export const up = (pgm) => {
  pgm.sql(`
    -- The device_id column had a FK constraint pointing to a devices/scanner_devices
    -- table. Mobile devices generate a UUID locally (never registered in that table),
    -- so every scan insert was failing with a FK violation.
    -- Drop the constraint and keep device_id as a plain informational text column.
    -- Only run if ticket_scans table exists
    DO $$
    BEGIN
      IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ticket_scans') THEN
        ALTER TABLE ticket_scans
          DROP CONSTRAINT IF EXISTS ticket_scans_device_id_fkey,
          DROP CONSTRAINT IF EXISTS ticket_scans_device_id_key;

        -- Ensure the column exists as TEXT in case it was previously typed as a FK UUID
        ALTER TABLE ticket_scans
          ALTER COLUMN device_id TYPE TEXT USING device_id::TEXT;
      END IF;
    END $$;
  `);
};

export const down = (pgm) => {
  // Cannot restore the FK without knowing the original referenced table/column.
  // No-op intentional — reverting this would re-break scanner functionality.
  pgm.sql(`SELECT 1;`);
};
