-- =============================================
-- SUPABASE SEED DATA
-- Dashboard CMS ASABRI - Data Awal
-- =============================================
-- Jalankan script ini setelah 001_schema.sql
-- =============================================

-- =============================================
-- 1. INSERT CATEGORIES
-- =============================================
INSERT INTO categories (name, description) VALUES
  ('Manfaat Program ASABRI', 'Program manfaat untuk peserta ASABRI'),
  ('Layanan ASABRI', 'Informasi layanan dan fasilitas ASABRI'),
  ('Pencapaian dan Kinerja ASABRI', 'Pencapaian dan kinerja perusahaan'),
  ('Kegiatan ASABRI', 'Kegiatan dan event ASABRI'),
  ('TJSL', 'Tanggung Jawab Sosial dan Lingkungan'),
  ('Campaign Nasional', 'Campaign tingkat nasional'),
  ('Hari Besar Nasional', 'Peringatan hari besar nasional'),
  ('Hari Penting', 'Peringatan hari-hari penting'),
  ('Campaign ASABRI', 'Campaign internal ASABRI'),
  ('Akses dan Digitalisasi ASABRI', 'Transformasi digital dan akses layanan'),
  ('Human Capital', 'Sumber daya manusia'),
  ('Inovasi ASABRI', 'Inovasi dan pengembangan');

-- =============================================
-- 2. INSERT OFFICES
-- =============================================
INSERT INTO offices (code, name, type, region) VALUES
  ('PUSAT', 'Kantor Pusat', 'pusat', 'Jakarta'),
  ('KCU', 'Kantor Cabang Utama', 'cabang', 'Jakarta'),
  ('KC_ACEH', 'KC Aceh', 'cabang', 'Sumatera'),
  ('KC_MEDAN', 'KC Medan', 'cabang', 'Sumatera'),
  ('KC_PADANG', 'KC Padang', 'cabang', 'Sumatera'),
  ('KC_PEKANBARU', 'KC Pekanbaru', 'cabang', 'Sumatera'),
  ('KC_PALEMBANG', 'KC Palembang', 'cabang', 'Sumatera'),
  ('KC_LAMPUNG', 'KC Lampung', 'cabang', 'Sumatera'),
  ('KC_BENGKULU', 'KC Bengkulu', 'cabang', 'Sumatera'),
  ('KC_BANDUNG', 'KC Bandung', 'cabang', 'Jawa'),
  ('KC_SEMARANG', 'KC Semarang', 'cabang', 'Jawa'),
  ('KC_YOGYAKARTA', 'KC Yogyakarta', 'cabang', 'Jawa'),
  ('KC_SURABAYA', 'KC Surabaya', 'cabang', 'Jawa'),
  ('KC_MALANG', 'KC Malang', 'cabang', 'Jawa'),
  ('KC_CIREBON', 'KC Cirebon', 'cabang', 'Jawa'),
  ('KC_SERANG', 'KC Serang', 'cabang', 'Jawa'),
  ('KC_DENPASAR', 'KC Denpasar', 'cabang', 'Bali Nusra'),
  ('KC_MATARAM', 'KC Mataram', 'cabang', 'Bali Nusra'),
  ('KC_KUPANG', 'KC Kupang', 'cabang', 'Bali Nusra'),
  ('KC_PONTIANAK', 'KC Pontianak', 'cabang', 'Kalimantan'),
  ('KC_PALANGKARAYA', 'KC Palangkaraya', 'cabang', 'Kalimantan'),
  ('KC_BANJARMASIN', 'KC Banjarmasin', 'cabang', 'Kalimantan'),
  ('KC_BALIKPAPAN', 'KC Balikpapan', 'cabang', 'Kalimantan'),
  ('KC_MAKASSAR', 'KC Makassar', 'cabang', 'Sulawesi'),
  ('KC_MANADO', 'KC Manado', 'cabang', 'Sulawesi'),
  ('KC_PALU', 'KC Palu', 'cabang', 'Sulawesi'),
  ('KC_KENDARI', 'KC Kendari', 'cabang', 'Sulawesi'),
  ('KC_AMBON', 'KC Ambon', 'cabang', 'Maluku Papua'),
  ('KC_TERNATE', 'KC Ternate', 'cabang', 'Maluku Papua'),
  ('KC_JAYAPURA', 'KC Jayapura', 'cabang', 'Maluku Papua'),
  ('KC_LHOKSEUMAWE', 'KC Lhokseumawe', 'cabang', 'Sumatera');

-- =============================================
-- 3. INSERT WRITERS
-- =============================================
INSERT INTO writers (name, role) VALUES
  ('Agung', 'Writer Corcomm'),
  ('Andres', 'Writer Corcomm'),
  ('Rizky', 'Writer Corcomm'),
  ('Clara', 'Writer Corcomm'),
  ('Evelyn', 'Writer Corcomm'),
  ('Ryan', 'Writer Corcomm'),
  ('Kompro', 'Corporate Communication');

-- =============================================
-- SEED DATA COMPLETE
-- =============================================
