-- Migration: Chat Admin Features & Message Management
-- Date: 2026-07-24
-- Description: Adds soft delete support and admin features for chat system

-- Add deleted_at column to messages table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NOT NULL;
    COMMENT ON COLUMN messages.deleted_at IS 'Timestamp when message was soft-deleted by admin';
  END IF;
END $$;

-- Add deleted_at column to conversations table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_conversations_deleted_at ON conversations(deleted_at) WHERE deleted_at IS NOT NULL;
    COMMENT ON COLUMN conversations.deleted_at IS 'Timestamp when conversation was soft-deleted by admin';
  END IF;
END $$;

-- Add is_super_admin column to users table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
    CREATE INDEX idx_users_super_admin ON users(is_super_admin) WHERE is_super_admin = true;
    COMMENT ON COLUMN users.is_super_admin IS 'Flag indicating if user has super admin privileges';
  END IF;
END $$;

-- Update existing conversations to ensure they're not marked as deleted
UPDATE conversations SET deleted_at = NULL WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';

-- Update existing messages to ensure they're not marked as deleted
UPDATE messages SET deleted_at = NULL WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';

-- Grant super admin to first user (if no super admin exists)
DO $$
DECLARE
  admin_exists BOOLEAN;
  first_user_id UUID;
BEGIN
  SELECT EXISTS(SELECT 1 FROM users WHERE is_super_admin = true) INTO admin_exists;

  IF NOT admin_exists THEN
    SELECT id INTO first_user_id FROM users ORDER BY created_at ASC LIMIT 1;
    IF first_user_id IS NOT NULL THEN
      UPDATE users SET is_super_admin = true WHERE id = first_user_id;
      RAISE NOTICE 'Granted super admin to user: %', first_user_id;
    END IF;
  END IF;
END $$;

-- Verify migration
SELECT
  'Messages table has deleted_at' as check,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'deleted_at') as passed
UNION ALL
SELECT
  'Conversations table has deleted_at' as check,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'deleted_at') as passed
UNION ALL
SELECT
  'Users table has is_super_admin' as check,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_super_admin') as passed
UNION ALL
SELECT
  'At least one super admin exists' as check,
  EXISTS(SELECT 1 FROM users WHERE is_super_admin = true) as passed;
