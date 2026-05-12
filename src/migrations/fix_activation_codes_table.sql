-- Script untuk memperbaiki struktur tabel activation_codes
-- Jalankan di Supabase SQL Editor

-- 1. Cek apakah kolom used_by_email sudah ada
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'activation_codes' 
AND table_schema = 'public' 
AND column_name = 'used_by_email';

-- 2. Jika kolom belum ada, tambahkan kolom used_by_email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'activation_codes' 
        AND table_schema = 'public' 
        AND column_name = 'used_by_email'
    ) THEN
        ALTER TABLE public.activation_codes 
        ADD COLUMN used_by_email text NULL;
        
        RAISE NOTICE 'Kolom used_by_email berhasil ditambahkan ke tabel activation_codes';
    ELSE
        RAISE NOTICE 'Kolom used_by_email sudah ada di tabel activation_codes';
    END IF;
END $$;

-- 3. Verifikasi struktur tabel setelah perubahan
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'activation_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Test apakah fungsi activate_account_with_code bisa berjalan
-- (Uncomment jika ingin test dengan data dummy)
/*
SELECT public.activate_account_with_code(
    'TEST-CODE-HERE',
    auth.uid(),
    auth.email()
);
*/