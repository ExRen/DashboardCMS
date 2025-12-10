-- =============================================
-- DROP & RECREATE COMMANDO TABLE
-- Kolom sesuai dengan header CSV untuk import manual
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Drop existing table
DROP TABLE IF EXISTS commando_contents CASCADE;

-- 2. Recreate table dengan nama kolom SAMA PERSIS seperti header CSV
CREATE TABLE commando_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Kolom sesuai header CSV (PERSIS SAMA)
  "NO" INTEGER,
  "TANGGAL" TEXT,                               -- Simpan sebagai TEXT untuk format Indonesia
  "JUDUL KONTEN" TEXT,
  "JENIS KONTEN" VARCHAR(200),
  "KATEGORI DALAM AGSET BUMN" VARCHAR(200),
  "JENIS MEDIA PLAN" VARCHAR(200),
  "AKTUALISASI" VARCHAR(100),
  "MEDIA" VARCHAR(100),
  "Jenis Konten" VARCHAR(200),                  -- Format konten (Infografis, Video, dll)
  "HEADLINE/CAPTION/ORIE" TEXT,
  "LINK" TEXT,
  "CREATOR" VARCHAR(100),
  "PROCESS" VARCHAR(200),
  "KETERANGAN/JENIS KONTEN" TEXT,
  
  -- Metadata tambahan
  year INTEGER DEFAULT 2025,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_commando_jenis ON commando_contents("JENIS KONTEN");
CREATE INDEX idx_commando_media ON commando_contents("MEDIA");
CREATE INDEX idx_commando_creator ON commando_contents("CREATOR");
CREATE INDEX idx_commando_year ON commando_contents(year);

-- 4. Row Level Security
ALTER TABLE commando_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read commando" ON commando_contents FOR SELECT USING (true);
CREATE POLICY "Allow public insert commando" ON commando_contents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update commando" ON commando_contents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete commando" ON commando_contents FOR DELETE USING (true);

-- =============================================
-- SELESAI - Tabel siap untuk import CSV manual
-- =============================================
