-- =============================================
-- FIX YEAR 2024 DATA
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Cek data dengan tanggal 2024
SELECT 
  COUNT(*) as total_2024_data,
  MIN("TANGGAL") as earliest_date,
  MAX("TANGGAL") as latest_date
FROM commando_contents
WHERE "TANGGAL" LIKE '%2024%';

-- 2. Update year berdasarkan tanggal
UPDATE commando_contents
SET year = 2024
WHERE "TANGGAL" LIKE '%2024%';

UPDATE commando_contents
SET year = 2025
WHERE "TANGGAL" LIKE '%2025%';

-- 3. Verifikasi
SELECT year, COUNT(*) as total
FROM commando_contents
GROUP BY year
ORDER BY year;

-- =============================================
-- FIX PRESS RELEASES YEAR
-- =============================================

UPDATE press_releases
SET year = 2024
WHERE "TANGGAL TERBIT" LIKE '%2024%';

UPDATE press_releases
SET year = 2025
WHERE "TANGGAL TERBIT" LIKE '%2025%';

-- Verifikasi
SELECT year, COUNT(*) as total
FROM press_releases
GROUP BY year
ORDER BY year;
