# Rencana Pembaruan Sistem Absensi Guru (V4.5) - SELESAI

Dokumen ini berisi logika dan rencana perubahan database untuk fitur pemantauan kehadiran guru yang lebih profesional dan fleksibel.

## 1. Konfigurasi Kebijakan Absensi (TERIMPLEMENTASI)
Admin dapat memilih salah satu dari dua kebijakan absensi yang diterapkan di sekolah:

### A. Kebijakan Berbasis Jadwal (Schedule-Based)
*   **Logika**: Guru hanya dianggap **Wajib Hadir** jika memiliki minimal satu jadwal mengajar (`schedule`) pada hari tersebut.
*   **Tujuan**: Memberikan keadilan bagi guru yang tidak memiliki beban mengajar penuh setiap hari.
*   **Kriteria**: Memiliki jadwal di hari tersebut + Bukan hari libur.

### B. Kebijakan Absensi Harian (Daily-Based)
*   **Logika**: Seluruh guru **Wajib Hadir** setiap hari kerja efektif sekolah.
*   **Tujuan**: Cocok untuk sekolah dengan sistem jam kerja tetap (Full-Time) di mana guru harus tetap standby di sekolah meskipun tidak ada jam mengajar.
*   **Kriteria**: Hari tersebut adalah hari kerja aktif sekolah (Senin-Sabtu) + Bukan hari libur.

## 2. Perhitungan Statistik Kehadiran (Admin) (TERIMPLEMENTASI)
Admin melihat laporan dengan metrik berikut:
- **Wajib Hadir (Target)**: Dihitung secara real-time berdasarkan kebijakan yang dipilih.
- **Hadir (Aktual)**: Jumlah unik guru yang sudah melakukan `check_in` hari ini.
- **Terlambat**: Jumlah unik guru yang melakukan `check_in` melewati batas waktu.
- **Tanpa Keterangan (Alpha)**: Selisih antara `Wajib Hadir` dan `Hadir`.

## 3. Perubahan Database (TERIMPLEMENTASI - V4.5)
- **Tabel Settings**: Penambahan kunci baru `attendance_policy` dengan nilai `schedule_based` atau `daily_based`.
- **Fungsi RPC (`get_teacher_attendance_summary`)**: Versi 4.5 yang sangat stabil, menggunakan path tabel eksplisit dan penanganan array return yang robust.
- **Fungsi Diagnostik (`diagnose_attendance_logic`)**: Alat bantu Admin untuk melacak kecocokan jadwal secara instan.

## 4. Keunggulan Sistem
- **Fleksibel**: Menyesuaikan dengan budaya dan aturan internal sekolah masing-masing melalui menu Pengaturan.
- **Otomatis**: Admin tidak perlu mengecek jadwal manual, sistem langsung memberikan data "Siapa yang seharusnya hadir" secara real-time.
- **Profesional**: Laporan menampilkan "Kebijakan yang Berlaku" sehingga transparan bagi semua staf pengajar.

---
*Update V4.5 telah selesai diimplementasikan dan diuji berhasil.*
