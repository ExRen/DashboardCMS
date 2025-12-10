-- =============================================
-- DROP & RECREATE PRESS RELEASES TABLE
-- Kolom sesuai dengan header CSV untuk import manual
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Drop existing table
DROP TABLE IF EXISTS press_releases CASCADE;

-- 2. Recreate table dengan nama kolom SAMA PERSIS seperti header CSV
CREATE TABLE press_releases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Kolom sesuai header CSV (PERSIS SAMA)
  "NO" INTEGER,
  "NOMOR SIARAN PERS (urutan dari yang pertama)" TEXT,
  "TANGGAL TERBIT" TEXT,
  "JUDUL SIARAN PERS" TEXT,
  "JENIS RILIS" VARCHAR(200),
  "KETEGORI" VARCHAR(200),
  "MEDIA PLAN" VARCHAR(200),
  "LINGKUP" VARCHAR(200),
  "LINK WEBSITE" TEXT,
  "FOLDER SIARAN PERS" TEXT,
  "WRITER CORCOMM" VARCHAR(200),
  "REVIEW" VARCHAR(200),
  "PROCESS" VARCHAR(200),
  "KETERANGAN" TEXT,
  
  -- Metadata
  year INTEGER DEFAULT 2025,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_press_tanggal ON press_releases("TANGGAL TERBIT");
CREATE INDEX idx_press_jenis ON press_releases("JENIS RILIS");
CREATE INDEX idx_press_writer ON press_releases("WRITER CORCOMM");
CREATE INDEX idx_press_year ON press_releases(year);

-- 4. Row Level Security
ALTER TABLE press_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read press_releases" ON press_releases FOR SELECT USING (true);
CREATE POLICY "Allow public insert press_releases" ON press_releases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update press_releases" ON press_releases FOR UPDATE USING (true);
CREATE POLICY "Allow public delete press_releases" ON press_releases FOR DELETE USING (true);

-- =============================================
-- SELESAI - Tabel siap untuk import CSV manual
-- =============================================
