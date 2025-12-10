-- =============================================
-- FILL ALL NULL VALUES - VERSI PERBAIKAN
-- Menggunakan kolom "NO" untuk urutan (bukan created_at)
-- =============================================

-- =============================================
-- 1. FILL JENIS RILIS
-- =============================================
UPDATE press_releases p1
SET "JENIS RILIS" = (
  SELECT "JENIS RILIS"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."JENIS RILIS" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "JENIS RILIS" IS NULL;

-- =============================================
-- 2. FILL KETEGORI
-- =============================================
UPDATE press_releases p1
SET "KETEGORI" = (
  SELECT "KETEGORI"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."KETEGORI" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "KETEGORI" IS NULL;

-- =============================================
-- 3. FILL MEDIA PLAN
-- =============================================
UPDATE press_releases p1
SET "MEDIA PLAN" = (
  SELECT "MEDIA PLAN"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."MEDIA PLAN" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "MEDIA PLAN" IS NULL;

-- =============================================
-- 4. FILL LINGKUP
-- =============================================
UPDATE press_releases p1
SET "LINGKUP" = (
  SELECT "LINGKUP"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."LINGKUP" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "LINGKUP" IS NULL;

-- =============================================
-- 5. FILL LINK WEBSITE
-- =============================================
UPDATE press_releases p1
SET "LINK WEBSITE" = (
  SELECT "LINK WEBSITE"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."LINK WEBSITE" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "LINK WEBSITE" IS NULL;

-- =============================================
-- 6. FILL FOLDER SIARAN PERS
-- =============================================
UPDATE press_releases p1
SET "FOLDER SIARAN PERS" = (
  SELECT "FOLDER SIARAN PERS"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."FOLDER SIARAN PERS" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "FOLDER SIARAN PERS" IS NULL;

-- =============================================
-- 7. FILL WRITER CORCOMM
-- =============================================
UPDATE press_releases p1
SET "WRITER CORCOMM" = (
  SELECT "WRITER CORCOMM"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."WRITER CORCOMM" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "WRITER CORCOMM" IS NULL;

-- =============================================
-- 8. FILL REVIEW
-- =============================================
UPDATE press_releases p1
SET "REVIEW" = (
  SELECT "REVIEW"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."REVIEW" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "REVIEW" IS NULL;

-- =============================================
-- 9. FILL PROCESS
-- =============================================
UPDATE press_releases p1
SET "PROCESS" = (
  SELECT "PROCESS"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."PROCESS" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "PROCESS" IS NULL;

-- =============================================
-- 10. FILL KETERANGAN
-- =============================================
UPDATE press_releases p1
SET "KETERANGAN" = (
  SELECT "KETERANGAN"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."KETERANGAN" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "KETERANGAN" IS NULL;

-- =============================================
-- 11. FILL TANGGAL TERBIT
-- =============================================
UPDATE press_releases p1
SET "TANGGAL TERBIT" = (
  SELECT "TANGGAL TERBIT"
  FROM press_releases p2
  WHERE p2."NO" < p1."NO"
  AND p2."TANGGAL TERBIT" IS NOT NULL
  ORDER BY p2."NO" DESC
  LIMIT 1
)
WHERE "TANGGAL TERBIT" IS NULL;

-- =============================================
-- VERIFIKASI
-- =============================================
SELECT 
  COUNT(*) FILTER (WHERE "JENIS RILIS" IS NULL) as null_jenis,
  COUNT(*) FILTER (WHERE "KETEGORI" IS NULL) as null_kategori,
  COUNT(*) FILTER (WHERE "LINGKUP" IS NULL) as null_lingkup,
  COUNT(*) FILTER (WHERE "LINK WEBSITE" IS NULL) as null_link,
  COUNT(*) as total_rows
FROM press_releases;
