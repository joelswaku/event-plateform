export async function up(pgm) {
  pgm.sql(`
    -- Create vendors table if it doesn't exist
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID REFERENCES organizations(id),
      user_id UUID REFERENCES users(id),
      business_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      subcategories TEXT[],
      tagline VARCHAR(300),
      bio TEXT,
      logo_url TEXT,
      cover_url TEXT,
      website_url VARCHAR(512),
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      city VARCHAR(100),
      country VARCHAR(100),
      service_area VARCHAR(500),
      base_price NUMERIC(12,2),
      currency VARCHAR(10) DEFAULT 'USD',
      price_label VARCHAR(100) DEFAULT 'Starting from',
      verification_status VARCHAR(30) DEFAULT 'pending',
      verification_score INTEGER DEFAULT 0,
      tier VARCHAR(20) DEFAULT 'bronze',
      rating NUMERIC(3,2) DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      response_time_hours INTEGER,
      booking_count INTEGER DEFAULT 0,
      profile_views INTEGER DEFAULT 0,
      inquiry_count INTEGER DEFAULT 0,
      is_featured BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      portfolio JSONB DEFAULT '[]',
      services JSONB DEFAULT '[]',
      social_links JSONB DEFAULT '{}',
      password_hash TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add slug column if it doesn't exist
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vendors' AND column_name = 'slug'
      ) THEN
        ALTER TABLE vendors ADD COLUMN slug VARCHAR(255) UNIQUE;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
    CREATE INDEX IF NOT EXISTS idx_vendors_slug ON vendors(slug);
    CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating DESC);
    CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active, is_featured);

    CREATE TABLE IF NOT EXISTS vendor_reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      reviewer_name VARCHAR(200) NOT NULL,
      reviewer_email VARCHAR(255),
      reviewer_initial VARCHAR(5),
      reviewer_color VARCHAR(20) DEFAULT '#6366f1',
      event_type VARCHAR(100),
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      title VARCHAR(200),
      body TEXT NOT NULL,
      reply TEXT,
      replied_at TIMESTAMPTZ,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor ON vendor_reviews(vendor_id);

    CREATE TABLE IF NOT EXISTS vendor_inquiries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
      sender_name VARCHAR(200) NOT NULL,
      sender_email VARCHAR(255) NOT NULL,
      event_type VARCHAR(100),
      event_date DATE,
      guest_count INTEGER,
      budget NUMERIC(12,2),
      message TEXT NOT NULL,
      status VARCHAR(30) DEFAULT 'new',
      vendor_reply TEXT,
      replied_at TIMESTAMPTZ,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_vendor ON vendor_inquiries(vendor_id, status);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS vendor_inquiries;
    DROP TABLE IF EXISTS vendor_reviews;
    DROP TABLE IF EXISTS vendors;
  `);
}
