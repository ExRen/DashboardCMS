-- FIX ADMIN USER DATA
-- Jalankan di Supabase SQL Editor

-- Update admin user dengan data yang benar
UPDATE user_profiles 
SET 
    full_name = 'Administrator',
    role = 'admin'
WHERE email = 'admin@asabri.co.id';

-- Verifikasi
SELECT * FROM user_profiles WHERE email = 'admin@asabri.co.id';
