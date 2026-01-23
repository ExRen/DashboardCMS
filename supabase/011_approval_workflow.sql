-- =============================================
-- ADD STATUS COLUMNS FOR APPROVAL WORKFLOW
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Add status columns to press_releases
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE press_releases ADD COLUMN IF NOT EXISTS approval_comment TEXT;

-- 2. Add status columns to commando_contents  
ALTER TABLE commando_contents ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE commando_contents ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE commando_contents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE commando_contents ADD COLUMN IF NOT EXISTS approval_comment TEXT;

-- 3. Create indexes for status
CREATE INDEX IF NOT EXISTS idx_press_status ON press_releases(status);
CREATE INDEX IF NOT EXISTS idx_commando_status ON commando_contents(status);

-- =============================================
-- CREATE STORAGE BUCKET FOR MEDIA
-- =============================================
-- Note: This needs to be done in Supabase Dashboard > Storage
-- 1. Create bucket named "media"
-- 2. Set it as Public bucket
-- 3. Add policy to allow uploads

-- =============================================
-- CREATE NOTIFICATIONS TABLE (In-App)
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (true);
CREATE POLICY "Allow insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- =============================================
-- FUNCTION: Create notification after approval
-- =============================================

CREATE OR REPLACE FUNCTION notify_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      COALESCE(NEW.approved_by, '00000000-0000-0000-0000-000000000000'),
      'Konten Disetujui',
      'Konten telah disetujui dan siap dipublikasikan',
      'success'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      COALESCE(NEW.approved_by, '00000000-0000-0000-0000-000000000000'),
      'Konten Ditolak',
      COALESCE(NEW.approval_comment, 'Konten ditolak oleh reviewer'),
      'error'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger (optional - uncomment if needed)
-- CREATE TRIGGER press_approval_trigger
--   AFTER UPDATE ON press_releases
--   FOR EACH ROW EXECUTE FUNCTION notify_on_approval();

-- CREATE TRIGGER commando_approval_trigger
--   AFTER UPDATE ON commando_contents
--   FOR EACH ROW EXECUTE FUNCTION notify_on_approval();
