-- Script untuk membuat kode aktivasi test
-- Jalankan di Supabase SQL Editor setelah memperbaiki struktur tabel

-- 1. Cek berapa banyak kode aktivasi yang tersedia
SELECT 
    COUNT(*) as total_codes,
    COUNT(CASE WHEN is_used = false THEN 1 END) as available_codes,
    COUNT(CASE WHEN is_used = true THEN 1 END) as used_codes
FROM public.activation_codes;

-- 2. Jika tidak ada kode yang tersedia, buat beberapa kode test
DO $$
DECLARE
    available_count integer;
BEGIN
    -- Hitung kode yang tersedia
    SELECT COUNT(*) INTO available_count
    FROM public.activation_codes 
    WHERE is_used = false;
    
    -- Jika kurang dari 3 kode tersedia, buat kode baru
    IF available_count < 3 THEN
        -- Buat 5 kode aktivasi test
        INSERT INTO public.activation_codes (code) VALUES 
            ('TEST-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4))),
            ('TEST-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4))),
            ('TEST-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4))),
            ('TEST-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4))),
            ('TEST-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)));
        
        RAISE NOTICE 'Berhasil membuat 5 kode aktivasi test baru';
    ELSE
        RAISE NOTICE 'Sudah ada % kode aktivasi yang tersedia', available_count;
    END IF;
END $$;

-- 3. Tampilkan kode aktivasi yang tersedia untuk testing
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

-- 4. Informasi user saat ini untuk testing
SELECT 
    auth.uid() as current_user_id, 
    auth.email() as current_user_email;

-- 5. Status akun saat ini
SELECT 
    id, 
    email, 
    full_name, 
    account_status 
FROM public.profiles 
WHERE id = auth.uid();

-- 6. Template untuk test manual fungsi aktivasi
-- Ganti 'KODE-AKTIVASI-DISINI' dengan salah satu kode dari hasil query di atas
/*
SELECT public.activate_account_with_code(
    'KODE-AKTIVASI-DISINI',
    auth.uid(),
    auth.email()
);
*/