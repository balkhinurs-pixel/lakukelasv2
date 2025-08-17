# Panduan Memperbaiki Masalah Aktivasi Kode

## Masalah yang Ditemukan

Berdasarkan analisis kode, masalah "Aktivasi Gagal" terjadi karena:

1. **Fungsi aktivasi di database mungkin tidak ter-update dengan benar**
2. **Kemungkinan ada konflik antara versi fungsi yang berbeda**
3. **Permissions atau search_path yang tidak tepat**

## Solusi

### Langkah 1: Jalankan Migrasi di Supabase

Buka **Supabase Dashboard** → **SQL Editor** dan jalankan script berikut:

```sql
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
```

### Langkah 2: Verifikasi Fungsi

Setelah menjalankan migrasi, verifikasi dengan query berikut:

```sql
-- Verifikasi fungsi sudah dibuat dengan benar
SELECT routine_name, routine_type, security_type 
FROM information_schema.routines 
WHERE routine_name = 'activate_account_with_code' 
AND routine_schema = 'public';
```

### Langkah 3: Test Kode Aktivasi

1. **Pastikan ada kode aktivasi yang belum digunakan**:
   ```sql
   SELECT code, is_used FROM public.activation_codes WHERE is_used = false LIMIT 5;
   ```

2. **Jika tidak ada kode, buat kode baru melalui Admin Panel**:
   - Buka `/admin/codes`
   - Klik "Generate New Code"

3. **Test aktivasi dengan kode yang valid**

## Kemungkinan Penyebab Lain

### 1. Format Kode Tidak Sesuai
- Pastikan kode dimasukkan dengan format: `XXXX-XXXX-XXXX-XXXX`
- Tidak ada spasi di awal atau akhir
- Huruf besar semua

### 2. Kode Sudah Digunakan
- Cek status kode di admin panel
- Pastikan menggunakan kode yang `is_used = false`

### 3. Masalah Permissions
- Pastikan user sudah login
- Cek apakah ada error di browser console

## Debugging

Jika masalah masih terjadi, cek:

1. **Browser Console** untuk error JavaScript
2. **Supabase Logs** untuk error database
3. **Network Tab** untuk melihat response API

## File yang Terlibat

- `src/lib/actions.ts` - Fungsi `activateAccount()`
- `src/app/dashboard/activation/page.tsx` - UI aktivasi
- `migrations/008_fix_activation_function_final.sql` - Migrasi perbaikan

---

**Catatan**: Setelah menjalankan migrasi, restart aplikasi untuk memastikan semua perubahan ter-apply dengan benar.