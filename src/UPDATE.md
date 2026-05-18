
# Log Pembaruan LakuKelas

## V19.2: Perbaikan Izin PostgreSQL (Grant Permissions) - SELESAI
Solusi definitif untuk error `permission denied for table profiles` yang muncul pada log middleware di proyek database baru.

### 1. Perubahan SQL (Kritikal)
- Menambahkan perintah `GRANT USAGE ON SCHEMA public` untuk peran `anon` dan `authenticated`.
- Menambahkan `GRANT SELECT ON public.profiles` untuk memastikan Middleware selalu bisa memverifikasi Role pengguna.
- Memastikan sistem database memberikan izin pembacaan teknis sebelum kebijakan RLS (Row Level Security) dievaluasi.

### 2. Verifikasi Login Admin
- Admin sekarang diprioritaskan di tingkat paling atas pada Middleware.
- Bypass otomatis untuk Admin melewati form "Lengkapi Data Diri" dan "Menunggu Persetujuan".

---

## V19.1: Middleware Debug Mode & RLS Open Policy
Pembaruan untuk melacak penyebab kegagalan deteksi Admin melalui server log Vercel.

### 1. Debug Logs
- Menambahkan `console.log` pada file `middleware.ts` untuk memonitor Role, Session, dan Alur Redirect secara real-time.

### 2. Database V19.1 (Optimasi RLS)
- **Profiles Table**: Kebijakan RLS disederhanakan menjadi `using (true)` untuk operasi `SELECT`. Ini menjamin middleware selalu mendapatkan data profil tanpa terhalang kebijakan keamanan yang berpotensi rekursif.
