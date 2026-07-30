-- ============================================================================
-- CHAT SYSTEM SETUP FOR PRODUCTION
-- Creates chat tables and applies admin features
-- ============================================================================

-- ============================================================================
-- PART 1: Create base chat tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                 VARCHAR(20)  NOT NULL DEFAULT 'direct',
  title                TEXT,
  event_id             UUID,
  created_by           UUID,
  direct_key           TEXT UNIQUE,            -- sorted "uidA:uidB" for direct dedupe
  last_message_at      TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_sender  UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'member',  -- member | admin
  last_read_at    TIMESTAMPTZ,
  muted           BOOLEAN NOT NULL DEFAULT FALSE,
  archived        BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID,
  body            TEXT,
  attachment_url  TEXT,
  attachment_type VARCHAR(40),
  kind            VARCHAR(20) NOT NULL DEFAULT 'text',  -- text | image | system
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at       TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_msg_conv_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_part_user        ON conversation_participants(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_part_conv        ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_event       ON conversations(event_id) WHERE event_id IS NOT NULL;

-- ============================================================================
-- PART 2: Add admin/moderation features
-- ============================================================================

-- Add flagged column to messages for moderation
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false;

-- Add reported_at for tracking when message was reported
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP;

-- Add reported_by to track who reported the message
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES users(id);

-- Add report_reason for moderation context
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS report_reason TEXT;

-- Create index for flagged messages
CREATE INDEX IF NOT EXISTS idx_messages_flagged
  ON messages(flagged)
  WHERE flagged = true;

-- Add archived column to conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Add archived_at timestamp
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

-- Create index for active conversations
CREATE INDEX IF NOT EXISTS idx_conversations_archived
  ON conversations(archived)
  WHERE archived = false;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify conversations table exists
SELECT 'conversations' AS table_name,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') AS exists;

-- Verify messages table exists
SELECT 'messages' AS table_name,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') AS exists;

-- Verify conversation_participants table exists
SELECT 'conversation_participants' AS table_name,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_participants') AS exists;

-- Verify admin columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'messages' AND column_name IN ('flagged', 'reported_at', 'reported_by', 'report_reason');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations' AND column_name IN ('archived', 'archived_at');

-- ============================================================================
-- DONE!
-- ============================================================================
