-- Add verification_token column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token UUID;
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
