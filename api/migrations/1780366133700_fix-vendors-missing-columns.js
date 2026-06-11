/* Safely adds every column the vendor portal needs to the vendors table.
   Uses ADD COLUMN IF NOT EXISTS so it's safe to re-run on any environment. */
export async function up(pgm) {
  pgm.sql(`
    -- Core identity columns the portal service expects
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS category          VARCHAR(100) NOT NULL DEFAULT 'General';
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS slug              VARCHAR(255) UNIQUE;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subcategories     TEXT[];
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tagline           VARCHAR(300);
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bio               TEXT;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url          TEXT;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cover_url         TEXT;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS website_url       VARCHAR(512);
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone             VARCHAR(50);
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS city              VARCHAR(100);
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS country           VARCHAR(100);
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_area      VARCHAR(500);
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS base_price        NUMERIC(12,2);
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS currency          VARCHAR(10)  DEFAULT 'USD';
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS price_label       VARCHAR(100) DEFAULT 'Starting from';
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'pending';
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS verification_score  INTEGER      DEFAULT 0;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS tier              VARCHAR(20)  DEFAULT 'bronze';
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating            NUMERIC(3,2) DEFAULT 0;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS review_count      INTEGER      DEFAULT 0;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS response_time_hours INTEGER;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS booking_count     INTEGER      DEFAULT 0;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS profile_views     INTEGER      DEFAULT 0;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS inquiry_count     INTEGER      DEFAULT 0;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_featured       BOOLEAN      DEFAULT FALSE;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active         BOOLEAN      DEFAULT TRUE;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS portfolio         JSONB        DEFAULT '[]';
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS services          JSONB        DEFAULT '[]';
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS social_links      JSONB        DEFAULT '{}';
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS password_hash     TEXT;
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ  DEFAULT NOW();
    ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ  DEFAULT NOW();

    -- Ensure slug has a value for any existing rows that might lack one
    UPDATE vendors SET slug = LOWER(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9]+', '-', 'g'))
      || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6)
    WHERE slug IS NULL OR slug = '';

    -- Indexes (safe to re-create)
    CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
    CREATE INDEX IF NOT EXISTS idx_vendors_slug     ON vendors(slug);
    CREATE INDEX IF NOT EXISTS idx_vendors_rating   ON vendors(rating DESC);
    CREATE INDEX IF NOT EXISTS idx_vendors_active   ON vendors(is_active, is_featured);
    CREATE INDEX IF NOT EXISTS idx_vendors_email    ON vendors(email);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    ALTER TABLE vendors DROP COLUMN IF EXISTS category;
    ALTER TABLE vendors DROP COLUMN IF EXISTS subcategories;
    ALTER TABLE vendors DROP COLUMN IF EXISTS tagline;
    ALTER TABLE vendors DROP COLUMN IF EXISTS bio;
    ALTER TABLE vendors DROP COLUMN IF EXISTS logo_url;
    ALTER TABLE vendors DROP COLUMN IF EXISTS cover_url;
    ALTER TABLE vendors DROP COLUMN IF EXISTS website_url;
    ALTER TABLE vendors DROP COLUMN IF EXISTS service_area;
    ALTER TABLE vendors DROP COLUMN IF EXISTS base_price;
    ALTER TABLE vendors DROP COLUMN IF EXISTS currency;
    ALTER TABLE vendors DROP COLUMN IF EXISTS price_label;
    ALTER TABLE vendors DROP COLUMN IF EXISTS verification_status;
    ALTER TABLE vendors DROP COLUMN IF EXISTS verification_score;
    ALTER TABLE vendors DROP COLUMN IF EXISTS tier;
    ALTER TABLE vendors DROP COLUMN IF EXISTS rating;
    ALTER TABLE vendors DROP COLUMN IF EXISTS review_count;
    ALTER TABLE vendors DROP COLUMN IF EXISTS response_time_hours;
    ALTER TABLE vendors DROP COLUMN IF EXISTS booking_count;
    ALTER TABLE vendors DROP COLUMN IF EXISTS profile_views;
    ALTER TABLE vendors DROP COLUMN IF EXISTS inquiry_count;
    ALTER TABLE vendors DROP COLUMN IF EXISTS is_featured;
    ALTER TABLE vendors DROP COLUMN IF EXISTS portfolio;
    ALTER TABLE vendors DROP COLUMN IF EXISTS services;
    ALTER TABLE vendors DROP COLUMN IF EXISTS social_links;
    ALTER TABLE vendors DROP COLUMN IF EXISTS password_hash;
  `);
}
