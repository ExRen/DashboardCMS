-- ===================================================
-- Authentication & Audit Tables for CMS Dashboard
-- Jalankan script ini di Supabase SQL Editor
-- ===================================================

-- User Profiles Table
-- Stores additional user information beyond Supabase Auth
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Audit Logs Table
-- Tracks all data changes for accountability
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ===================================================
-- RLS Policies
-- ===================================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles
CREATE POLICY "Allow read access to all profiles"
ON user_profiles FOR SELECT
USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Allow users to update own profile"
ON user_profiles FOR UPDATE
USING (true);

-- Policy: Allow insert for new users
CREATE POLICY "Allow insert for new users"
ON user_profiles FOR INSERT
WITH CHECK (true);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit logs
CREATE POLICY "Allow read access to audit logs"
ON audit_logs FOR SELECT
USING (true);

-- Policy: Allow insert for audit logging
CREATE POLICY "Allow insert for audit logging"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- ===================================================
-- Default Admin User
-- Change the email and password as needed
-- ===================================================

INSERT INTO user_profiles (email, full_name, role)
VALUES ('admin@asabri.co.id', 'Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ===================================================
-- Helper Function: Log Audit Entry
-- ===================================================

CREATE OR REPLACE FUNCTION log_audit(
  p_user_email TEXT,
  p_user_name TEXT,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (user_email, user_name, action, table_name, record_id, old_data, new_data)
  VALUES (p_user_email, p_user_name, p_action, p_table_name, p_record_id, p_old_data, p_new_data)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
