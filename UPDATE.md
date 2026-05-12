# Rencana Pembaruan Sistem Absensi Guru (V4.3)

Dokumen ini berisi logika dan rencana perubahan database untuk fitur pemantauan kehadiran guru yang lebih profesional dan fleksibel.

## 1. Konfigurasi Kebijakan Absensi
Admin dapat memilih salah satu dari dua kebijakan absensi yang akan diterapkan di sekolah:

### A. Kebijakan Berbasis Jadwal (Schedule-Based)
*   **Logika**: Guru hanya dianggap **Wajib Hadir** jika memiliki minimal satu jadwal mengajar (`schedule`) pada hari tersebut.
*   **Tujuan**: Memberikan keadilan bagi guru yang tidak memiliki beban mengajar penuh setiap hari.
*   **Kriteria**: Memiliki jadwal di hari tersebut + Bukan hari libur.

### B. Kebijakan Absensi Harian (Daily-Based)
*   **Logika**: Seluruh guru **Wajib Hadir** setiap hari kerja efektif sekolah.
*   **Tujuan**: Cocok untuk sekolah dengan sistem jam kerja tetap (Full-Time) di mana guru harus tetap standby di sekolah meskipun tidak ada jam mengajar.
*   **Kriteria**: Hari tersebut adalah hari kerja aktif sekolah (misal Senin-Jumat) + Bukan hari libur.

## 2. Perhitungan Statistik Kehadiran (Admin)
Admin akan melihat laporan dengan metrik berikut:
- **Total Hari Wajib Masuk**: Dihitung berdasarkan kebijakan yang dipilih (Jumlah hari unik dengan jadwal VS Jumlah total hari kerja efektif).
- **Kehadiran Aktual**: Jumlah rekaman `check_in` di tabel `teacher_attendance`.
- **Persentase Kehadiran**: `(Kehadiran Aktual / Hari Wajib Masuk) * 100`.
- **Status "Tanpa Keterangan"**: Guru yang wajib hadir hari ini tetapi belum melakukan `check_in` hingga jam pulang sekolah berakhir.

## 3. Perubahan Database (Next Update)
- **Tabel Settings**: Penambahan kunci baru `attendance_policy` dengan nilai `schedule_based` atau `daily_based`.
- **View Baru (`v_teacher_expected_attendance`)**: View cerdas yang akan menyesuaikan daftar "siapa yang harus hadir" berdasarkan setting kebijakan yang dipilih Admin.
- **Fungsi RPC (`get_teacher_attendance_summary`)**: Fungsi untuk menghitung persentase kehadiran guru secara real-time untuk Dashboard Admin.

## 4. Keunggulan Sistem
- **Fleksibel**: Bisa menyesuaikan dengan budaya dan aturan internal sekolah masing-masing.
- **Otomatis**: Admin tidak perlu mengecek jadwal manual, sistem langsung memberikan rapor kedisiplinan berdasarkan kebijakan yang dipilih.
- **Profesional**: Laporan akan menampilkan "Kebijakan yang Berlaku" sehingga transparan bagi semua staf pengajar.

---
*Diskusi ini akan menjadi acuan untuk pembaruan Skema SQL Versi 4.3.*
