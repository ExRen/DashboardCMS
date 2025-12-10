-- =============================================
-- SUPABASE SEED DATA - COMMANDO
-- =============================================

-- =============================================
-- 1. INSERT CONTENT TYPES (Jenis Konten)
-- =============================================
INSERT INTO content_types (name, description) VALUES
  ('Single Image', 'Posting dengan satu gambar'),
  ('Carousel', 'Posting dengan beberapa gambar slide'),
  ('Video/Reels', 'Video pendek atau Reels'),
  ('Story', 'Instagram/Facebook Story'),
  ('Artikel', 'Konten artikel panjang'),
  ('Infografis', 'Konten infografis'),
  ('Quote', 'Konten kutipan/quote'),
  ('Live', 'Siaran langsung'),
  ('Poster', 'Poster digital'),
  ('Motion Graphic', 'Animasi atau motion graphic')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 2. INSERT MEDIA PLATFORMS
-- =============================================
INSERT INTO media_platforms (name, icon) VALUES
  ('Instagram', 'instagram'),
  ('Facebook', 'facebook'),
  ('Twitter/X', 'twitter'),
  ('LinkedIn', 'linkedin'),
  ('YouTube', 'youtube'),
  ('TikTok', 'tiktok'),
  ('Website', 'globe'),
  ('WhatsApp', 'whatsapp')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED DATA COMPLETE
-- =============================================
