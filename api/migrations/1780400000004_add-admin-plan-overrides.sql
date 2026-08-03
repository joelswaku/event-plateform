-- Migration: Add admin plan override columns
-- Allows super admins to grant complimentary plans without Stripe

-- Add admin_plan_override column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS admin_plan_override VARCHAR(20) DEFAULT NULL;

-- Add admin_plan_override_expires_at column
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS admin_plan_override_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Add constraint to validate plan values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_admin_plan_override_valid'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_admin_plan_override_valid
      CHECK (admin_plan_override IS NULL OR admin_plan_override IN ('starter', 'pro', 'enterprise'));
  END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('admin_plan_override', 'admin_plan_override_expires_at');
