-- Migration: Add ASSIGNED_TO and NOTES columns to commando_contents and press_releases
-- Purpose: Enable assignment and notes functionality with @mention support
-- Run this script in Supabase SQL Editor

-- ============================================
-- ADD COLUMNS TO commando_contents TABLE
-- ============================================

ALTER TABLE commando_contents 
ADD COLUMN IF NOT EXISTS "ASSIGNED_TO" TEXT;

ALTER TABLE commando_contents 
ADD COLUMN IF NOT EXISTS "NOTES" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN commando_contents."ASSIGNED_TO" IS 'User assigned to this content (e.g., Admin, Corcomm Team)';
COMMENT ON COLUMN commando_contents."NOTES" IS 'Notes with @mention support';

-- ============================================
-- ADD COLUMNS TO press_releases TABLE
-- ============================================

ALTER TABLE press_releases 
ADD COLUMN IF NOT EXISTS "ASSIGNED_TO" TEXT;

ALTER TABLE press_releases 
ADD COLUMN IF NOT EXISTS "NOTES" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN press_releases."ASSIGNED_TO" IS 'User assigned to this press release';
COMMENT ON COLUMN press_releases."NOTES" IS 'Notes with @mention support';

-- ============================================
-- CREATE INDEX FOR FASTER QUERIES (Optional)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_commando_assigned_to 
ON commando_contents ("ASSIGNED_TO");

CREATE INDEX IF NOT EXISTS idx_press_releases_assigned_to 
ON press_releases ("ASSIGNED_TO");

-- ============================================
-- VERIFY COLUMNS WERE ADDED
-- ============================================

-- Check commando_contents columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commando_contents' 
AND column_name IN ('ASSIGNED_TO', 'NOTES');

-- Check press_releases columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'press_releases' 
AND column_name IN ('ASSIGNED_TO', 'NOTES');
