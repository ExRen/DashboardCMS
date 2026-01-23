-- =============================================
-- ADDITIONAL FEATURES DATABASE MIGRATIONS
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Create Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT 'blue',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial tags
INSERT INTO tags (name, color) VALUES
    ('Penting', 'red'),
    ('Urgent', 'orange'),
    ('Review', 'yellow'),
    ('Selesai', 'green'),
    ('Pending', 'blue'),
    ('Internal', 'purple'),
    ('Eksternal', 'pink')
ON CONFLICT (name) DO NOTHING;

-- RLS for tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Allow insert tags" ON tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update tags" ON tags FOR UPDATE USING (true);
CREATE POLICY "Allow delete tags" ON tags FOR DELETE USING (true);

-- 2. Add tags column to content tables (as JSONB array)
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE commando_contents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- 3. Add scheduled_at column for content scheduling
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE commando_contents ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- Indexes for scheduled content
CREATE INDEX IF NOT EXISTS idx_press_scheduled ON press_releases(scheduled_at) 
    WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commando_scheduled ON commando_contents(scheduled_at) 
    WHERE scheduled_at IS NOT NULL;

-- 4. Ensure notifications table exists (should already exist from previous migration)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notifications (if not exists)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view notifications') THEN
        CREATE POLICY "Users can view notifications" ON notifications FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert notifications') THEN
        CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update notifications') THEN
        CREATE POLICY "Users can update notifications" ON notifications FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can delete notifications') THEN
        CREATE POLICY "Users can delete notifications" ON notifications FOR DELETE USING (true);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- =============================================
-- VERIFICATION
-- =============================================
-- Run these to verify:
-- SELECT * FROM tags;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'press_releases' AND column_name IN ('tags', 'scheduled_at', 'status');
