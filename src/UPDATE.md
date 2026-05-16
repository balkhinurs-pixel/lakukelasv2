
# Log Pembaruan LakuKelas

## V11.9: Optimalisasi Rotasi PWA (PENYEDERHANAAN)
Menyesuaikan perilaku rotasi layar agar sepenuhnya mengikuti pengaturan sistem HP pengguna.

### 1. Perubahan Logika Rotasi
- **Hapus Lock Manual**: Menghapus fitur penguncian rotasi manual dari menu Pengaturan karena dianggap membingungkan dan terkadang konflik dengan sistem OS.
- **Manifest Auto**: Mengatur `orientation: any` di `manifest.json`.
- **Hasil**: Jika "Auto-Rotate" di HP aktif, aplikasi akan ikut berputar. Jika dimatikan, aplikasi akan tetap terkunci sesuai preferensi sistem pengguna. Lebih ringkas dan stabil.

---

## V11.8: Kontrol Orientasi PWA (DEPRECATED)
*(Fitur ini telah digantikan oleh V11.9 demi kemudahan penggunaan)*

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