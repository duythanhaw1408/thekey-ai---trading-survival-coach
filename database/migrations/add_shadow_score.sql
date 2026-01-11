-- Migration: Add shadow_score column to users table
-- Run this on Supabase SQL Editor

-- Step 1: Add shadow_score column (TEXT for JSON storage)
ALTER TABLE users ADD COLUMN IF NOT EXISTS shadow_score TEXT;

-- Step 2: Create index for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_users_shadow_score ON users(shadow_score) WHERE shadow_score IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'shadow_score';
