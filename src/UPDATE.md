
# Log Pembaruan LakuKelas

## V28.0: The Ultimate Master Blueprint - TERIMPLEMENTASI
Konsolidasi seluruh skema database ke dalam satu blueprint utama untuk standarisasi sistem.

### 1. SQL Blueprint (Master Schema)
- **Komprehensif**: Menggabungkan 19 tabel utama, 4 Views cerdas, dan 6 fungsi RPC krusial (termasuk summary kehadiran guru).
- **Security First**: Penambahan kebijakan RLS (Row Level Security) untuk seluruh tabel guna menjamin isolasi data antar guru.
- **Identity Sync**: Kolom NPSN, Email Sekolah, dan Website Sekolah kini menjadi bagian permanen dari skema `public.profiles`.
- **Otomatisasi**: Trigger `handle_new_user` disempurnakan untuk penanganan metadata OAuth Google yang lebih stabil.
- **Indeksasi**: Penambahan indeks performa pada kolom pencarian utama (date, class_id, teacher_id).

### 2. Fitur Baru Berhasil Dicatat:
- **Professional Kop Surat**: Integrasi otomatis NPSN dan kontak sekolah pada Naskah Soal PDF.
- **Smart Selection Indicator**: Badge nomor urut pada pemilihan soal di Bank Soal AI.
- **Dynamic Metadata Export**: Dialog sebelum cetak yang menentukan struktur folder Drive secara otomatis.

---

## V27.0: Professional Identity Update - SELESAI
Penambahan identitas sekolah yang lebih lengkap untuk kebutuhan administrasi resmi dan standarisasi kop surat.

### 1. Perubahan Skema Database
Penambahan kolom `npsn`, `school_email`, dan `school_website` pada tabel `profiles`.

### 2. Fitur & UI
- **Pembaruan Profil Sekolah**: Admin sekarang dapat mengisi NPSN, Email, dan Website sekolah pada menu Pengaturan.
- **Kop Surat Dinamis**: Naskah soal PDF sekarang secara otomatis menampilkan NPSN dan kontak sekolah jika data tersebut telah diisi.

---

## V26.0: Smart Export & Metadata Evolution - SELESAI
Penyempurnaan alur kerja ekspor naskah dengan sistem organisasi folder otomatis dan header dinamis.
