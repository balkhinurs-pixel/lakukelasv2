-- SCRIPT LENGKAP UNTUK MEMPERBAIKI MASALAH AKTIVASI
-- Jalankan script ini secara berurutan di Supabase SQL Editor

-- ========================================
-- BAGIAN 1: PERBAIKI STRUKTUR TABEL
-- ========================================

-- 1.1 Pastikan kolom used_by_email ada di tabel activation_codes
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
        
        RAISE NOTICE 'Kolom used_by_email berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom used_by_email sudah ada';
    END IF;
END $$;

-- ========================================
-- BAGIAN 2: PERBAIKI FUNGSI AKTIVASI
-- ========================================

-- 2.1 Drop fungsi lama untuk menghindari konflik
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid, text);
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid);
DROP FUNCTION IF EXISTS public.activate_account_with_code(uuid, text, text);

-- 2.2 Buat fungsi aktivasi yang benar dan lengkap
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    p_code text, 
    p_user_id uuid, 
    p_user_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_id uuid;
  v_profile_exists boolean;
BEGIN
  -- 1. Cari kode aktivasi yang valid dan belum digunakan
  SELECT id INTO v_code_id
  FROM activation_codes
  WHERE code = p_code AND is_used = false
  FOR UPDATE; -- Lock row untuk mencegah race condition

  -- 2. Jika kode tidak ditemukan atau sudah digunakan, lempar error
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;

  -- 3. Cek apakah profil user ada
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = p_user_id
  ) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
  END IF;

  -- 4. Update kode aktivasi sebagai sudah digunakan
  UPDATE activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;

  -- 5. Update profil pengguna menjadi 'Pro'
  UPDATE profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

  -- 6. Log sukses
  RAISE NOTICE 'Aktivasi berhasil untuk user % dengan kode %', p_user_email, p_code;

END;
$$;

-- 2.3 Set ownership dan permissions
ALTER FUNCTION public.activate_account_with_code(text, uuid, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(text, uuid, text) TO anon;

-- ========================================
-- BAGIAN 3: VERIFIKASI DAN TESTING
-- ========================================

-- 3.1 Verifikasi fungsi sudah dibuat dengan benar
SELECT 
    routine_name, 
    routine_type, 
    security_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'activate_account_with_code' 
AND routine_schema = 'public';

-- 3.2 Cek struktur tabel activation_codes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'activation_codes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3.3 Cek permissions fungsi
SELECT 
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_name = 'activate_account_with_code'
AND routine_schema = 'public';

-- ========================================
-- BAGIAN 4: BUAT KODE AKTIVASI TEST
-- ========================================

-- 4.1 Cek berapa banyak kode aktivasi yang tersedia
SELECT 
    COUNT(*) as total_codes,
    COUNT(CASE WHEN is_used = false THEN 1 END) as available_codes,
    COUNT(CASE WHEN is_used = true THEN 1 END) as used_codes
FROM public.activation_codes;

-- 4.2 Buat kode aktivasi test jika diperlukan
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
        -- Buat 3 kode aktivasi test
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
             UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)));
        
        RAISE NOTICE 'Berhasil membuat 3 kode aktivasi test baru';
    ELSE
        RAISE NOTICE 'Sudah ada % kode aktivasi yang tersedia', available_count;
    END IF;
END $$;

-- 4.3 Tampilkan kode aktivasi yang tersedia untuk testing
SELECT 
    code, 
    is_used, 
    created_at,
    used_by,
    used_at,
    used_by_email
FROM public.activation_codes 
WHERE is_used = false 
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- BAGIAN 5: INFORMASI USER UNTUK TESTING
-- ========================================

-- 5.1 Informasi user saat ini
SELECT 
    auth.uid() as current_user_id, 
    auth.email() as current_user_email;

-- 5.2 Status akun saat ini
SELECT 
    id, 
    email, 
    full_name, 
    account_status 
FROM public.profiles 
WHERE id = auth.uid();

-- ========================================
-- BAGIAN 6: TEMPLATE TEST MANUAL
-- ========================================

-- 6.1 Template untuk test manual fungsi aktivasi
-- GANTI 'KODE-AKTIVASI-DISINI' dengan salah satu kode dari hasil query di atas
/*
SELECT public.activate_account_with_code(
    'KODE-AKTIVASI-DISINI',
    auth.uid(),
    auth.email()
);
*/

-- 6.2 Verifikasi hasil aktivasi setelah test
/*
SELECT 
    id, 
    email, 
    full_name, 
    account_status 
FROM public.profiles 
WHERE id = auth.uid();
*/

-- ========================================
-- SELESAI
-- ========================================

RAISE NOTICE '=== SCRIPT PERBAIKAN AKTIVASI SELESAI ===';
RAISE NOTICE 'Silakan test aktivasi melalui frontend atau gunakan template manual di atas';
RAISE NOTICE 'Jika masih ada masalah, periksa browser console dan network tab';