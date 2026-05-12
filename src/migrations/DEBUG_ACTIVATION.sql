-- Script untuk debugging masalah aktivasi kode
-- Jalankan di Supabase SQL Editor untuk memeriksa status sistem

-- 1. Cek apakah fungsi aktivasi sudah ada dan benar
SELECT 
    routine_name, 
    routine_type, 
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'activate_account_with_code' 
AND routine_schema = 'public';

-- 2. Cek kode aktivasi yang tersedia (belum digunakan)
SELECT 
    code, 
    is_used, 
    created_at,
    used_by,
    used_at
FROM public.activation_codes 
WHERE is_used = false 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Cek total kode aktivasi
SELECT 
    COUNT(*) as total_codes,
    COUNT(CASE WHEN is_used = false THEN 1 END) as available_codes,
    COUNT(CASE WHEN is_used = true THEN 1 END) as used_codes
FROM public.activation_codes;

-- 4. Cek struktur tabel activation_codes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'activation_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Cek struktur tabel profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Test manual fungsi aktivasi (HANYA JIKA ADA KODE YANG TERSEDIA)
-- GANTI 'TEST-CODE-HERE' dengan kode aktivasi yang valid
-- GANTI 'user-uuid-here' dengan UUID user yang valid
-- GANTI 'user@email.com' dengan email user yang valid
/*
SELECT public.activate_account_with_code(
    'TEST-CODE-HERE',
    'user-uuid-here'::uuid,
    'user@email.com'
);
*/

-- 7. Cek permissions fungsi
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'activate_account_with_code'
AND routine_schema = 'public';

-- 8. Jika tidak ada kode aktivasi, buat satu untuk testing
-- (Uncomment baris di bawah jika diperlukan)
/*
INSERT INTO public.activation_codes (code) 
VALUES ('TEST-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
        UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
        UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
        UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)));
*/

-- 9. Cek user yang sedang login (untuk testing)
SELECT auth.uid() as current_user_id, auth.email() as current_user_email;

-- 10. Cek profil user saat ini
SELECT id, email, full_name, account_status 
FROM public.profiles 
WHERE id = auth.uid();