# Troubleshooting Masalah Aktivasi Kode

## Status Saat Ini
Masalah aktivasi masih terjadi meskipun sudah menjalankan migrasi. Mari kita lakukan debugging sistematis.

## Langkah 1: Debugging Database

### A. Jalankan Script Debug
1. Buka **Supabase Dashboard** → **SQL Editor**
2. Jalankan file `DEBUG_ACTIVATION.sql` yang sudah dibuat
3. Periksa hasil setiap query:

**Yang harus diperiksa:**
- ✅ Fungsi `activate_account_with_code` sudah ada
- ✅ Ada kode aktivasi yang `is_used = false`
- ✅ Struktur tabel benar
- ✅ Permissions fungsi sudah benar

### B. Jika Fungsi Tidak Ada atau Salah
Jalankan migrasi 008 lagi:
```sql
-- Copy paste isi file migrations/008_fix_activation_function_final.sql
```

### C. Jika Tidak Ada Kode Aktivasi
1. Buka `/admin/codes` di aplikasi
2. Klik "Generate New Code"
3. Atau jalankan SQL:
```sql
INSERT INTO public.activation_codes (code) 
VALUES ('TEST-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
        UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
        UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)) || '-' || 
        UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)));
```

## Langkah 2: Test Manual di Database

### A. Ambil Data User Saat Ini
```sql
SELECT auth.uid() as user_id, auth.email() as user_email;
```

### B. Ambil Kode Aktivasi yang Tersedia
```sql
SELECT code FROM public.activation_codes WHERE is_used = false LIMIT 1;
```

### C. Test Fungsi Aktivasi Manual
```sql
-- Ganti dengan data real
SELECT public.activate_account_with_code(
    'KODE-DARI-QUERY-B',
    'USER-ID-DARI-QUERY-A'::uuid,
    'EMAIL-DARI-QUERY-A'
);
```

### D. Cek Hasil
```sql
-- Cek apakah profil berubah menjadi Pro
SELECT account_status FROM public.profiles WHERE id = auth.uid();

-- Cek apakah kode sudah digunakan
SELECT is_used, used_by, used_at FROM public.activation_codes WHERE code = 'KODE-YANG-DITEST';
```

## Langkah 3: Debugging Frontend

### A. Cek Browser Console
1. Buka halaman aktivasi
2. Buka Developer Tools (F12)
3. Masukkan kode aktivasi
4. Lihat error di Console dan Network tab

### B. Cek Response API
1. Di Network tab, cari request ke `/api/...` atau RPC call
2. Periksa response body untuk error detail
3. Periksa status code (harus 200 jika berhasil)

## Langkah 4: Kemungkinan Masalah Lain

### A. Format Kode Salah
- Pastikan format: `XXXX-XXXX-XXXX-XXXX`
- Semua huruf besar
- Tidak ada spasi di awal/akhir

### B. User Tidak Login
- Pastikan user sudah login
- Cek `auth.uid()` tidak null

### C. Permissions Database
- Pastikan RLS (Row Level Security) tidak memblokir
- Cek apakah user `authenticated` punya akses

### D. Cache Issue
- Restart aplikasi Next.js
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)

## Langkah 5: Solusi Berdasarkan Error

### Error: "Kode aktivasi tidak valid atau sudah digunakan"
**Penyebab:**
- Kode memang sudah digunakan
- Kode tidak ada di database
- Format kode salah

**Solusi:**
1. Cek status kode di admin panel
2. Generate kode baru
3. Pastikan format benar

### Error: "Terjadi kesalahan pada server saat aktivasi"
**Penyebab:**
- Fungsi database error
- Permissions salah
- Struktur tabel berubah

**Solusi:**
1. Jalankan migrasi 008 lagi
2. Cek Supabase logs
3. Cek permissions fungsi

### Error: "Pengguna tidak terautentikasi"
**Penyebab:**
- User belum login
- Session expired

**Solusi:**
1. Login ulang
2. Refresh halaman

## Langkah 6: Reset Lengkap (Jika Semua Gagal)

### A. Reset Fungsi Database
```sql
-- Drop semua versi fungsi
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid, text);
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid);
DROP FUNCTION IF EXISTS public.activate_account_with_code(uuid, text, text);

-- Buat ulang dari schema.sql atau migrasi 008
```

### B. Reset Kode Aktivasi
```sql
-- Hapus semua kode lama (HATI-HATI!)
DELETE FROM public.activation_codes;

-- Buat kode baru
INSERT INTO public.activation_codes (code) VALUES ('TEST-1234-5678-9ABC');
```

### C. Reset Status User
```sql
-- Reset status ke Free
UPDATE public.profiles SET account_status = 'Free' WHERE id = auth.uid();
```

## Langkah 7: Verifikasi Final

1. **Database:** Fungsi ada dan benar
2. **Kode:** Ada kode yang belum digunakan
3. **User:** Login dan profil ada
4. **Frontend:** Tidak ada error di console
5. **Test:** Aktivasi berhasil mengubah status ke Pro

---

## Kontak Support

Jika masalah masih berlanjut, berikan informasi berikut:
1. Screenshot error di browser console
2. Hasil query dari `DEBUG_ACTIVATION.sql`
3. Screenshot halaman aktivasi
4. Kode aktivasi yang digunakan (jika tidak sensitif)

**File terkait:**
- `migrations/008_fix_activation_function_final.sql`
- `DEBUG_ACTIVATION.sql`
- `src/lib/actions.ts`
- `src/app/dashboard/activation/page.tsx`