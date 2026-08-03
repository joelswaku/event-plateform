/**
 * Super Admin grants are intentionally separate from Stripe subscription data.
 * This allows a complimentary Starter/Pro entitlement without faking a Stripe
 * subscription ID or interfering with a customer's real subscription.
 */
export async function up(pgm) {
  // IF NOT EXISTS is important for environments where the production schema
  // was applied manually before this migration is recorded.
  pgm.sql(`
    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS admin_plan_override VARCHAR(20);

    ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS admin_plan_override_expires_at TIMESTAMPTZ;

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
          CHECK (
            admin_plan_override IS NULL
            OR admin_plan_override IN ('starter', 'pro', 'enterprise')
          );
      END IF;
    END $$;
  `);
}

export async function down(pgm) {
  pgm.dropConstraint("users", "users_admin_plan_override_valid", {
    ifExists: true,
  });
  pgm.dropColumns("users", [
    "admin_plan_override",
    "admin_plan_override_expires_at",
  ]);
}
