-- Migrasi final untuk memperbaiki fungsi aktivasi
-- Pastikan fungsi ini dijalankan di Supabase SQL Editor

-- Drop fungsi yang ada untuk menghindari konflik
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid, text);
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid);
DROP FUNCTION IF EXISTS public.activate_account_with_code(uuid, text, text);

-- Buat ulang fungsi dengan logika yang benar dan lengkap
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

  -- 3. Update kode aktivasi sebagai sudah digunakan
  UPDATE activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;

  -- 4. Update profil pengguna menjadi 'Pro'
  UPDATE profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

  -- 5. Pastikan update berhasil
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
  END IF;

END;
$$;

-- Set ownership dan permissions
ALTER FUNCTION public.activate_account_with_code(text, uuid, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(text, uuid, text) TO authenticated;

-- Verifikasi fungsi sudah dibuat dengan benar
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_name = 'activate_account_with_code' 
AND routine_schema = 'public';