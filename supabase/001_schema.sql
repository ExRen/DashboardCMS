-- =============================================
-- SUPABASE DATABASE SCHEMA
-- Dashboard CMS ASABRI - Siaran Pers 2025
-- =============================================
-- Jalankan script ini di Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. TABEL KATEGORI SIARAN PERS
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. TABEL KANTOR/LINGKUP
-- =============================================
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('pusat', 'cabang')),
  region VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. TABEL WRITERS
-- =============================================
CREATE TABLE IF NOT EXISTS writers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50),
  office_id UUID REFERENCES offices(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. TABEL SIARAN PERS (MAIN TABLE)
-- =============================================
CREATE TABLE IF NOT EXISTS press_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER,
  official_number VARCHAR(100),
  publish_date DATE,
  title TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  media_plan VARCHAR(50),
  scope VARCHAR(50) CHECK (scope IN ('Rilis Pusat', 'Rilis Kantor Cabang')),
  office_id UUID REFERENCES offices(id),
  website_url TEXT,
  folder_path TEXT,
  writer_id UUID REFERENCES writers(id),
  review_status VARCHAR(100),
  process_status VARCHAR(50) DEFAULT 'Not Started',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_press_releases_date ON press_releases(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_press_releases_category ON press_releases(category_id);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON press_releases(process_status);
CREATE INDEX IF NOT EXISTS idx_press_releases_office ON press_releases(office_id);

-- =============================================
-- 6. FUNCTION: UPDATE TIMESTAMP
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-update
CREATE TRIGGER trigger_press_releases_updated
  BEFORE UPDATE ON press_releases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE writers ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for dashboard)
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read offices" ON offices FOR SELECT USING (true);
CREATE POLICY "Allow public read writers" ON writers FOR SELECT USING (true);
CREATE POLICY "Allow public read press_releases" ON press_releases FOR SELECT USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert press_releases" ON press_releases 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update press_releases" ON press_releases 
  FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================
-- SCHEMA COMPLETE
-- =============================================
