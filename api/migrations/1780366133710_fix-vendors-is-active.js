/* Each ALTER TABLE is its own pgm.sql() call so a single failure never
   blocks the rest. Idempotent — safe to run on any environment. */
export async function up(pgm) {
  const cols = [
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active          BOOLEAN      DEFAULT TRUE`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_featured        BOOLEAN      DEFAULT FALSE`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'pending'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verification_score  INTEGER     DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tier               VARCHAR(20)  DEFAULT 'bronze'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating             NUMERIC(3,2) DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS review_count       INTEGER      DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS booking_count      INTEGER      DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS profile_views      INTEGER      DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS inquiry_count      INTEGER      DEFAULT 0`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS response_time_hours INTEGER`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS category           VARCHAR(100) DEFAULT 'General'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subcategories      TEXT[]`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tagline            VARCHAR(300)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bio                TEXT`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url           TEXT`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cover_url          TEXT`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS website_url        VARCHAR(512)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone              VARCHAR(50)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS city               VARCHAR(100)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS country            VARCHAR(100)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_area       VARCHAR(500)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS base_price         NUMERIC(12,2)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS currency           VARCHAR(10)  DEFAULT 'USD'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS price_label        VARCHAR(100) DEFAULT 'Starting from'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS portfolio          JSONB        DEFAULT '[]'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS services           JSONB        DEFAULT '[]'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS social_links       JSONB        DEFAULT '{}'`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS password_hash      TEXT`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS slug               VARCHAR(255)`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_at         TIMESTAMPTZ  DEFAULT NOW()`,
    `ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ  DEFAULT NOW()`,
  ];

  for (const sql of cols) {
    pgm.sql(`${sql};`);
  }

  // Generate slugs for any rows that still lack one
  pgm.sql(`
    UPDATE vendors
    SET slug = LOWER(REGEXP_REPLACE(COALESCE(business_name, 'vendor'), '[^a-zA-Z0-9]+', '-', 'g'))
      || '-' || SUBSTR(MD5(id::TEXT), 1, 6)
    WHERE slug IS NULL OR slug = '';
  `);

  // Add UNIQUE index on slug separately (skipped if it already exists)
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_slug_unique ON vendors(slug);
    CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
    CREATE INDEX IF NOT EXISTS idx_vendors_active   ON vendors(is_active, is_featured);
    CREATE INDEX IF NOT EXISTS idx_vendors_rating   ON vendors(rating DESC);
    CREATE INDEX IF NOT EXISTS idx_vendors_email    ON vendors(email);
  `);
}

export async function down(pgm) {
  pgm.sql(`SELECT 1;`); // irreversible — don't drop data columns in down
}
