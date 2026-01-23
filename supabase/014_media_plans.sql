-- =============================================
-- MEDIA PLAN TABLE SCHEMA
-- Dashboard CMS ASABRI - Media Plan Feature
-- =============================================

-- =============================================
-- 1. TABEL MEDIA PLANS (MAIN TABLE)
-- =============================================
CREATE TABLE IF NOT EXISTS media_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  no INTEGER,
  bulan VARCHAR(20),
  tanggal INTEGER,
  year INTEGER DEFAULT 2026,
  scheduled_date DATE,
  kategori VARCHAR(100),
  rencana_pemberitaan TEXT,
  jenis_media_plan VARCHAR(50) CHECK (jenis_media_plan IN ('TOP ONE', 'MEDIA PLAN BIASA', 'CORPORATE ACTION', 'CSR ACTION')),
  bentuk_media VARCHAR(50) CHECK (bentuk_media IN ('MEDIA SOSIAL', 'MEDIA CETAK', 'MEDIA ONLINE')),
  pic VARCHAR(100),
  keterangan TEXT,
  source_image_url TEXT,
  status VARCHAR(50) DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Published', 'Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_media_plans_date ON media_plans(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_media_plans_bulan ON media_plans(bulan);
CREATE INDEX IF NOT EXISTS idx_media_plans_kategori ON media_plans(kategori);
CREATE INDEX IF NOT EXISTS idx_media_plans_pic ON media_plans(pic);
CREATE INDEX IF NOT EXISTS idx_media_plans_status ON media_plans(status);

-- =============================================
-- 3. TRIGGER FOR AUTO-UPDATE TIMESTAMP
-- =============================================
CREATE TRIGGER trigger_media_plans_updated
  BEFORE UPDATE ON media_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE media_plans ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for dashboard)
CREATE POLICY "Allow public read media_plans" ON media_plans FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert media_plans" ON media_plans 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update media_plans" ON media_plans 
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete media_plans" ON media_plans 
  FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- SCHEMA COMPLETE
-- =============================================
