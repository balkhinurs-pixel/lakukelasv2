
# Log Pembaruan LakuKelas

## V25.0: Professional Identity Update - SELESAI
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
- **Visual Border**: Penambahan double line border pada kop surat untuk estetika dokumen resmi.

---

## V24.0: Perfect PDF Engine (Smart Slicing) - SELESAI
Pembaruan fundamental pada sistem ekspor PDF untuk menghasilkan dokumen yang bebas dari konten terpotong atau duplikasi saat berpindah halaman.

### 1. Algoritma Smart Element Slicing
- **Individual Element Rendering**: Meninggalkan metode "pemotongan gambar panjang" dan beralih ke perakitan elemen satu per satu (Header, tiap soal, Footer) ke dalam PDF secara atomik.
- **Dynamic Space Calculation**: Sistem secara cerdas menghitung sisa ruang di halaman secara real-time. Jika sebuah butir soal tidak muat di sisa ruang, sistem akan memindahkannya secara utuh ke halaman berikutnya.
- **Zero Duplication & Cut-off**: Menghilangkan total masalah teks yang berulang atau rumus yang terbelah di sela halaman.

---

## V23.0: Smart Export & Repository Soal - SELESAI
Implementasi alur kerja profesional untuk pengelolaan naskah ujian dengan kualitas cetak tinggi dan pengorganisasian otomatis.
