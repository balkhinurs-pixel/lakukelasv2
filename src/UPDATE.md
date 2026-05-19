
# Log Pembaruan LakuKelas

## V28.0: The Ultimate Master Blueprint - TERIMPLEMENTASI
Konsolidasi seluruh skema database ke dalam satu blueprint utama untuk standarisasi sistem.

### 1. SQL Blueprint (Master Schema)
- **Komprehensif**: Menggabungkan 19 tabel utama, 4 Views cerdas, dan 5 fungsi RPC krusial.
- **Security First**: Penambahan kebijakan RLS (Row Level Security) untuk seluruh tabel guna menjamin isolasi data antar guru.
- **Identity Sync**: Kolom NPSN, Email Sekolah, dan Website Sekolah kini menjadi bagian permanen dari skema `public.profiles`.
- **Otomatisasi**: Trigger `handle_new_user` disempurnakan untuk penanganan metadata OAuth Google yang lebih stabil.

### 2. Database Identity
- **Full Identity**: Penambahan kolom administratif lengkap pada tabel `profiles` (NPSN, Email Sekolah, Website Sekolah, Wali Kelas Flag).
- **Audit Trail**: Penambahan kolom `created_at` dan `updated_at` pada tabel sensitif seperti `ai_documents`.

---

## V27.0: Professional Identity Update - SELESAI
Penambahan identitas sekolah yang lebih lengkap untuk kebutuhan administrasi resmi dan standarisasi kop surat.

### 1. Perubahan Skema Database
Untuk menerapkan perubahan ini, jalankan perintah SQL berikut di dashboard Supabase:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS npsn TEXT,
ADD COLUMN IF NOT EXISTS school_email TEXT,
ADD COLUMN IF NOT EXISTS school_website TEXT;
```

### 2. Fitur & UI
- **Pembaruan Profil Sekolah**: Admin sekarang dapat mengisi NPSN, Email, dan Website sekolah pada menu Pengaturan.
- **Kop Surat Dinamis**: Naskah soal PDF sekarang secara otomatis menampilkan NPSN dan kontak sekolah jika data tersebut telah diisi.

---

## V26.0: Smart Export & Metadata Evolution - SELESAI
Penyempurnaan alur kerja ekspor naskah dengan sistem organisasi folder otomatis dan header dinamis.

### 1. Fitur UI & UX
- **Indikator Seleksi Berurutan**: Penambahan badge nomor urut pada soal yang dipilih.
- **Dialog Konfigurasi Ekspor (Pre-Save)**: Guru wajib mengisi metadata lengkap sebelum melakukan ekspor.
- **Tahun Ajaran Aktif**: Sinkronisasi otomatis Tahun Pelajaran pada Kop Surat.

---

## V25.0: Professional Identity Update - SELESAI
Penambahan identitas sekolah yang lebih lengkap untuk kebutuhan administrasi resmi.

---

## V24.0: Perfect PDF Engine (Smart Slicing) - SELESAI
Pembaruan fundamental pada sistem ekspor PDF untuk menghasilkan dokumen yang bebas dari konten terpotong.