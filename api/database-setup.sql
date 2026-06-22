-- Production Database Setup Script
-- This creates all necessary tables for the application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  verification_token UUID,
  reset_token UUID,
  reset_token_expires TIMESTAMPTZ,
  stripe_customer_id VARCHAR(255) UNIQUE,
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_current_period_end TIMESTAMPTZ,
  is_subscribed BOOLEAN DEFAULT FALSE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ,
  terms_version_accepted VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  website_url VARCHAR(512),
  country VARCHAR(100),
  timezone VARCHAR(100) DEFAULT 'UTC',
  default_currency VARCHAR(10) DEFAULT 'USD',
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_personal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  image_url TEXT,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  max_attendees INTEGER,
  open_rsvp BOOLEAN DEFAULT FALSE,
  zip_code VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ticket_type VARCHAR(50) NOT NULL,
  price NUMERIC(10,2) DEFAULT 0 NOT NULL,
  status VARCHAR(50) DEFAULT 'active' NOT NULL,
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT FALSE NOT NULL,
  checked_in_at TIMESTAMPTZ,
  ticket_number VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link VARCHAR(512),
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_index ON users(email);
CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS events_user_id_index ON events(user_id);
CREATE INDEX IF NOT EXISTS events_date_index ON events(date);
CREATE INDEX IF NOT EXISTS tickets_event_id_index ON tickets(event_id);
CREATE INDEX IF NOT EXISTS tickets_user_id_index ON tickets(user_id);
CREATE INDEX IF NOT EXISTS vendors_email_index ON vendors(email);
CREATE INDEX IF NOT EXISTS vendors_category_index ON vendors(category);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Add default organization_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_organization_id UUID REFERENCES organizations(id);
