
# Log Pembaruan LakuKelas

## V13.5: Perbaikan Deteksi Data & Optimasi Penilaian (TERBARU)
Menyelesaikan masalah krusial pada deteksi siswa dan menyempurnakan fitur "Smart Katrol".

### 1. Backend & Data Fix
- **Class ID Mapping**: Memperbaiki fungsi `getAllStudents` di `src/lib/data.ts` dengan menyertakan kolom `class_id`. Perbaikan ini memastikan siswa terdeteksi dengan benar saat guru memilih kelas di menu Presensi atau Nilai.
- **Smart Logic**: Memastikan fitur pencarian dan tombol Katrol tetap muncul secara stabil di menu Penilaian setelah pemilihan kelas dilakukan.

---

## V13.2: Standarisasi Header Premium & Visual Aset
Menerapkan bahasa desain yang konsisten di seluruh modul utama aplikasi.

### 1. UI Modul Presensi & Nilai
- **Indigo Gradient Header**: Mengganti header standar dengan desain kartu gradien indigo (`from-indigo-700 via-indigo-600 to-blue-500`) yang sangat bulat (32px).
- **Lottie Integration**: Menambahkan ilustrasi Lottie interaktif pada header untuk memberikan kesan modern dan hidup.
- **Mobile HSIA Optimization**: Tombol status (H, S, I, A) kini tersusun dalam satu baris horizontal di mobile untuk kecepatan input maksimal.

### 2. Dashboard Refinement
- **GIF Background**: Memindahkan aset `icon dashboard.gif` ke lapisan latar belakang kartu ucapan selamat datang dengan opasitas rendah, memberikan ruang teks yang lebih luas dan bersih.
- **Text Wrapping**: Nama guru kini mendukung pembungkusan teks hingga 2 baris (*line-clamp-2*) untuk mengakomodasi nama yang panjang tanpa merusak layout.

---

## V13.0: Sistem Jadwal Collapsible & Countdown
Meningkatkan fungsionalitas Dashboard utama untuk membantu manajemen waktu guru.

### 1. Smart Schedule
- **Smooth Collapsible**: Implementasi daftar jadwal harian yang bisa dibuka-tutup dengan animasi Framer Motion yang halus (durasi 0.6 detik).
- **Teaching Countdown**: Fitur hitung mundur (contoh: `120:00`) sisa waktu mengajar yang aktif secara real-time pada jadwal yang sedang berlangsung.
- **Status Indicators**: Penambahan label status dinamis: `Segera` (Abu-abu), `Aktif` (Hijau), dan `Selesai` (Merah).

---

## V12.1: Pembebasan Orientasi Layar PWA
Mengembalikan fleksibilitas rotasi layar agar mengikuti pengaturan sistem perangkat pengguna.

### 1. Perubahan Manifest
- **Orientation Removed**: Menghapus baris `"orientation": "portrait-primary"` dari `manifest.json`.
- **Hasil**: Aplikasi sekarang mendukung mode landscape (mendatar), memudahkan guru saat melihat laporan tabel yang panjang atau grafik yang detail.

---

## V11.6: Finalisasi Alur Onboarding
Menyempurnakan transisi otomatis dari pengisian data diri ke halaman tunggu persetujuan.

### 1. Alur Kerja Otomatis
- **Redirect Mulus**: Transisi otomatis ke `/waiting-approval` setelah pengisian profil.
- **Validation Middleware**: Memperkuat deteksi `hasFilledProfile` agar pengguna tidak bisa kembali ke formulir setelah data terkirim.

---

## V11.0: Sistem Approval & Pembersihan Token
Peralihan total dari sistem token manual ke sistem persetujuan (approval) oleh Admin.
