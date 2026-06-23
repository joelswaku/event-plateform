-- ========================================
-- RESET DATABASE - USE WITH CAUTION
-- This drops ALL tables and recreates from scratch
-- Only run when RESET_DATABASE=true
-- ========================================

-- Drop all tables (cascade to drop dependencies)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
