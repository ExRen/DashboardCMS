-- =============================================
-- MASTER DATA TABLES
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Content Types Table
CREATE TABLE IF NOT EXISTS content_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Media Platforms Table
CREATE TABLE IF NOT EXISTS media_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Writers Table
CREATE TABLE IF NOT EXISTS writers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  department VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE writers ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete categories" ON categories FOR DELETE USING (true);

-- Content Types policies
CREATE POLICY "Allow public read content_types" ON content_types FOR SELECT USING (true);
CREATE POLICY "Allow public insert content_types" ON content_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update content_types" ON content_types FOR UPDATE USING (true);
CREATE POLICY "Allow public delete content_types" ON content_types FOR DELETE USING (true);

-- Media Platforms policies
CREATE POLICY "Allow public read media_platforms" ON media_platforms FOR SELECT USING (true);
CREATE POLICY "Allow public insert media_platforms" ON media_platforms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update media_platforms" ON media_platforms FOR UPDATE USING (true);
CREATE POLICY "Allow public delete media_platforms" ON media_platforms FOR DELETE USING (true);

-- Writers policies
CREATE POLICY "Allow public read writers" ON writers FOR SELECT USING (true);
CREATE POLICY "Allow public insert writers" ON writers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update writers" ON writers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete writers" ON writers FOR DELETE USING (true);

-- =============================================
-- Seed Data (Optional)
-- =============================================

INSERT INTO categories (name, description) VALUES
  ('Hari Besar Nasional', 'Konten untuk peringatan hari besar nasional'),
  ('Campaign ASABRI', 'Kampanye dan promosi ASABRI'),
  ('TJSL', 'Tanggung Jawab Sosial dan Lingkungan'),
  ('Hari Penting', 'Peringatan hari-hari penting'),
  ('Campaign Bersama BUMN', 'Kolaborasi dengan BUMN lainnya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO content_types (name, description) VALUES
  ('Infografis', 'Konten visual berupa infografis'),
  ('Video', 'Konten video'),
  ('Foto', 'Konten foto'),
  ('Carousel', 'Konten carousel/multi-slide'),
  ('Reels', 'Konten video pendek')
ON CONFLICT (name) DO NOTHING;

INSERT INTO media_platforms (name, icon) VALUES
  ('Instagram', 'instagram'),
  ('Twitter', 'twitter'),
  ('Facebook', 'facebook'),
  ('TikTok', 'tiktok'),
  ('LinkedIn', 'linkedin'),
  ('YouTube', 'youtube'),
  ('Website', 'globe')
ON CONFLICT (name) DO NOTHING;

INSERT INTO writers (name, email, department) VALUES
  ('Admin ASABRI', 'admin@asabri.co.id', 'Corporate Communication'),
  ('Tim Media Sosial', 'medsos@asabri.co.id', 'Digital Marketing')
ON CONFLICT DO NOTHING;
