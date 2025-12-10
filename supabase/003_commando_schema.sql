-- =============================================
-- SUPABASE DATABASE SCHEMA - COMMANDO
-- Social Media Content Tracking
-- =============================================
-- Jalankan script ini di Supabase SQL Editor
-- setelah menjalankan 001_schema.sql dan 002_seed_data.sql
-- =============================================

-- =============================================
-- 1. TABEL JENIS KONTEN (Content Types)
-- =============================================
CREATE TABLE IF NOT EXISTS content_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. TABEL PLATFORM MEDIA
-- =============================================
CREATE TABLE IF NOT EXISTS media_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. TABEL COMMANDO (Main Table - Social Media Content)
-- =============================================
CREATE TABLE IF NOT EXISTS commando_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER,
  publish_date DATE,
  title TEXT NOT NULL,
  content_type_id UUID REFERENCES content_types(id),
  category_id UUID REFERENCES categories(id),
  media_plan VARCHAR(50),
  platform_id UUID REFERENCES media_platforms(id),
  post_url TEXT,
  caption TEXT,
  hashtags TEXT,
  writer_id UUID REFERENCES writers(id),
  status VARCHAR(50) DEFAULT 'Draft',
  year INTEGER DEFAULT 2025,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_commando_date ON commando_contents(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_commando_type ON commando_contents(content_type_id);
CREATE INDEX IF NOT EXISTS idx_commando_platform ON commando_contents(platform_id);
CREATE INDEX IF NOT EXISTS idx_commando_year ON commando_contents(year);

-- =============================================
-- 5. TRIGGER FOR UPDATE TIMESTAMP
-- =============================================
CREATE TRIGGER trigger_commando_updated
  BEFORE UPDATE ON commando_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE commando_contents ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read content_types" ON content_types FOR SELECT USING (true);
CREATE POLICY "Allow public read media_platforms" ON media_platforms FOR SELECT USING (true);
CREATE POLICY "Allow public read commando_contents" ON commando_contents FOR SELECT USING (true);

-- Allow public insert/update/delete (for dashboard)
CREATE POLICY "Allow public insert content_types" ON content_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert media_platforms" ON media_platforms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert commando_contents" ON commando_contents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update commando_contents" ON commando_contents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete commando_contents" ON commando_contents FOR DELETE USING (true);

-- =============================================
-- SCHEMA COMPLETE
-- =============================================
