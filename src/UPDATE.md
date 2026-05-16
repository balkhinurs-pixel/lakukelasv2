
# Log Pembaruan LakuKelas

## V12.0: Kunci Orientasi Layar PWA (TERBARU)
Mengunci orientasi aplikasi agar selalu dalam mode potrait untuk konsistensi UI.

### 1. Perubahan Manifest
- **Orientation Lock**: Mengubah `orientation` dari `any` menjadi `portrait-primary` di `manifest.json`.
- **Hasil**: Aplikasi tidak akan lagi berputar secara otomatis saat HP diputar, menjaga tata letak Dashboard dan Tabel tetap presisi sesuai desain aslinya.

---

## V11.9: Optimalisasi Rotasi PWA (DEPRECATED)
*(Fitur ini telah digantikan oleh V12.0 demi konsistensi tampilan)*

---

## V11.6: Finalisasi Alur Onboarding (PENYEMPURNAAN)
Menyempurnakan transisi otomatis dari pengisian data diri ke halaman tunggu persetujuan.

### 1. Alur Kerja Otomatis
- **Redirect Mulus**: Setelah menekan "Ajukan Persetujuan", sistem secara otomatis memicu pembersihan cache dan mengalihkan pengguna ke `/waiting-approval`.
- **Validasi Middleware**: Memperkuat deteksi `hasFilledProfile` di middleware agar pengguna tidak bisa kembali ke formulir setelah data dikirim.
- **Instruksi WhatsApp**: Menambahkan petunjuk penginputan nomor WhatsApp tanpa simbol '+' untuk stabilitas sistem notifikasi.

---

## V11.5: Alur Verifikasi Staf Baru (PENINGKATAN)
Menambahkan langkah wajib pengisian data diri bagi guru baru untuk memudahkan Admin saat melakukan persetujuan akses.

---

## V11.2: Blueprint Database Komprehensif (TERBARU)
Penyempurnaan total pada `schema.sql` untuk memastikan kemudahan setup pada proyek baru.

---

## V11.0: Sistem Approval & Pembersihan Token (FINAL)
Peralihan total dari sistem token manual ke sistem persetujuan (approval) oleh Admin.
