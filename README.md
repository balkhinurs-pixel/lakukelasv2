# Product Requirements Document (PRD) - Lakukelas

## 1. Visi & Misi

**Visi**: Memberdayakan para guru dengan alat digital yang modern, intuitif, dan efisien untuk mengelola administrasi kelas sehari-hari, sehingga mereka dapat lebih fokus pada proses belajar-mengajar.

**Misi**: Menyediakan aplikasi manajemen kelas terintegrasi yang mencakup presensi, penilaian, jurnal mengajar, dan pelaporan, dengan alur kerja cerdas yang menghemat waktu dan tenaga guru.

---

## 2. Fitur Utama (Dasbor Guru)

### 2.1. Dasbor Utama
- **Ringkasan Cerdas**: Menampilkan statistik kunci seperti rata-rata presensi hari ini, jumlah kelas yang dijadwalkan, dan jurnal yang belum diisi.
- **Jadwal Hari Ini Dinamis**:
    - Menampilkan jadwal mengajar untuk hari yang sedang berjalan.
    - Secara otomatis menampilkan tombol aksi (Isi Presensi, Input Nilai, Isi Jurnal) secara bertahap ketika waktu pelajaran telah dimulai.
    - Navigasi cerdas yang otomatis mengisi data kelas dan mata pelajaran di halaman tujuan.
- **Jurnal Terbaru**: Menampilkan 5 entri jurnal mengajar terakhir untuk akses cepat.

### 2.2. Manajemen Presensi
- Input presensi siswa dengan status (Hadir, Sakit, Izin, Alpha).
- Formulir cerdas dengan pemilihan kelas, mata pelajaran, dan tanggal.
- **Riwayat Presensi**:
    - Tabel riwayat semua presensi yang pernah diinput.
    - Filter riwayat berdasarkan kelas dan mata pelajaran.
    - Kemampuan untuk **mengubah (edit)** data presensi yang salah.

### 2.3. Manajemen Nilai
- Input nilai siswa untuk berbagai jenis penilaian (e.g., Ulangan Harian, Tugas, UTS, UAS).
- Skala nilai 0-100.
- **Riwayat Penilaian**:
    - Tabel riwayat semua nilai yang pernah diinput.
    - Filter riwayat berdasarkan kelas dan mata pelajaran.
    - Kemampuan untuk **mengubah (edit)** data nilai yang salah.

### 2.4. Jurnal Mengajar
- Input jurnal mengajar yang detail, mencakup:
    - Tujuan Pembelajaran
    - Kegiatan Pembelajaran (Sintaks)
    - Penilaian (Asesmen)
    - Refleksi & Tindak Lanjut
- **Riwayat Jurnal**:
    - Tabel riwayat jurnal dengan filter berdasarkan kelas dan mata pelajaran.
    - **Lihat Detail**: Dialog popup untuk membaca seluruh isi jurnal.
    - **Ubah & Hapus**: Kemampuan untuk mengedit atau menghapus entri jurnal.

### 2.5. Laporan Akademik Profesional
- **Dasbor Laporan**: Visualisasi data dalam bentuk grafik (grafik batang dan diagram lingkaran) untuk kehadiran dan performa umum.
- **Analisis Performa Siswa**: Tabel cerdas yang mengkategorikan siswa berdasarkan performa (e.g., Sangat Baik, Stabil, Butuh Perhatian) berdasarkan nilai dan kehadiran.
- **Laporan Detail**: Tabel laporan terperinci untuk Kehadiran, Nilai, dan Jurnal dengan opsi filter.
- **Unduh PDF (Fitur Premium)**: Kemampuan untuk mengunduh semua laporan dalam format PDF profesional lengkap dengan kop surat sekolah.

### 2.6. Manajemen Rombongan Belajar (Rombel)
- **Pengaturan Siswa**: Mengelola data induk siswa per kelas.
- **Pengaturan Kelas**: Menambah dan mengelola daftar kelas.
- **Pengaturan Mata Pelajaran**: Menambah dan mengelola daftar mata pelajaran.
- **Tahun Ajaran**: Mengatur tahun ajaran aktif yang berlaku di seluruh aplikasi.
- **Promosi & Mutasi**: Alat bantu untuk proses kenaikan kelas dan kelulusan siswa di akhir tahun ajaran.

### 2.7. Manajemen Akun & Pengaturan
- Pengaturan profil guru (nama, NIP, dll).
- Pengaturan akun (email, kata sandi).
- Pengaturan data sekolah yang akan digunakan pada kop surat laporan.

---

## 3. Fitur Langganan & Monetisasi

- **Model Freemium**: Aplikasi menawarkan paket Gratis dan Premium.
- **Paket Gratis**:
    - Fungsionalitas inti dengan batasan (e.g., jumlah kelas, siswa per kelas).
- **Paket Premium (Semester & Tahunan)**:
    - Membuka semua batasan (kelas, siswa, entri tanpa batas).
    - Mengaktifkan fitur eksklusif seperti Impor/Ekspor data siswa dan Unduh Laporan PDF.
- **Halaman Langganan**: Antarmuka untuk memilih dan membeli paket langganan.
- **Integrasi Pembayaran**: Alur kerja pembayaran terintegrasi dengan payment gateway (Duitku).

---

## 4. Panel Admin

- **Dasbor Admin**: Ringkasan statistik penggunaan aplikasi secara keseluruhan (total pengguna, pendapatan, langganan aktif).
- **Manajemen Pengguna**: Melihat daftar pengguna (guru) dan mengelola status langganan mereka secara manual.
- **Analitik Aplikasi**: Grafik pertumbuhan pengguna dan distribusi langganan.
- **Manajemen Harga**: Mengatur harga untuk paket langganan yang ditampilkan di halaman Subscription.
- **Manajemen Kupon**: Membuat dan mengelola kupon diskon untuk promosi.

---

## 5. Aspek Teknis & Desain

- **Stack**: Next.js (App Router), React, TypeScript.
- **Styling**: Tailwind CSS dengan ShadCN UI untuk komponen.
- **Desain**: Antarmuka yang modern, bersih, dan profesional.
- **Responsif**: Didesain untuk bekerja dengan baik di desktop maupun perangkat mobile, dengan komponen khusus seperti navigasi bawah (bottom navigation bar) untuk mobile.
- **UX**: Fokus pada alur kerja yang efisien dan praktis, meminimalkan klik dan input manual.
