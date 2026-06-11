export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS feature_flags (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      key         TEXT        NOT NULL UNIQUE,
      name        TEXT        NOT NULL,
      description TEXT,
      enabled     BOOLEAN     NOT NULL DEFAULT false,
      updated_by  TEXT,
      updated_at  TIMESTAMPTZ DEFAULT NOW(),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO feature_flags (key, name, description, enabled) VALUES
      ('ai_insights',       'AI Insights',          'Enable AI-powered platform insights',       true),
      ('new_dashboard',     'New Dashboard',         'Enable the redesigned dashboard UI',        false),
      ('stripe_billing',    'Stripe Billing',        'Enable Stripe subscription management',     true),
      ('public_events',     'Public Event Pages',    'Allow public event listing pages',          true),
      ('email_campaigns',   'Email Campaigns',       'Enable broadcast email to attendees',       false),
      ('analytics_v2',      'Analytics V2',          'Enable advanced analytics dashboard',       false),
      ('guest_self_checkin','Guest Self Check-in',   'Allow guests to self check-in via QR',     false),
      ('seating_charts',    'Seating Charts',        'Enable interactive seating chart builder',  false)
    ON CONFLICT (key) DO NOTHING;
  `);
}

export async function down(pgm) {
  pgm.sql(`DROP TABLE IF EXISTS feature_flags;`);
}
