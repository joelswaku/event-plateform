export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS organizers (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          VARCHAR(255) NOT NULL,
      email         VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      company       VARCHAR(255),
      phone         VARCHAR(50),
      city          VARCHAR(100),
      country       VARCHAR(100),
      website       VARCHAR(512),
      event_types   TEXT[]         DEFAULT '{}',
      avatar_url    TEXT,
      bio           TEXT,
      is_active     BOOLEAN        DEFAULT TRUE,
      created_at    TIMESTAMPTZ    DEFAULT NOW(),
      updated_at    TIMESTAMPTZ    DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_organizers_email    ON organizers(email);
    CREATE INDEX IF NOT EXISTS idx_organizers_active   ON organizers(is_active);

    CREATE TABLE IF NOT EXISTS organizer_saved_vendors (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
      vendor_id    UUID NOT NULL REFERENCES vendors(id)    ON DELETE CASCADE,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organizer_id, vendor_id)
    );

    CREATE INDEX IF NOT EXISTS idx_saved_vendors_org ON organizer_saved_vendors(organizer_id);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS organizer_saved_vendors;
    DROP TABLE IF EXISTS organizers;
  `);
}
