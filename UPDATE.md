# Rencana Pembaruan Sistem Absensi Guru (V4.3)

Dokumen ini berisi logika dan rencana perubahan database untuk fitur pemantauan kehadiran guru yang lebih profesional dan objektif.

## 1. Logika Kewajiban Absen
Seorang guru dianggap **Wajib Hadir** pada tanggal tertentu jika:
- Guru tersebut memiliki minimal satu jadwal mengajar (`schedule`) pada hari tersebut (Senin-Minggu).
- Tanggal tersebut **bukan** merupakan hari libur (`holidays`).
- Tanggal tersebut **bukan** hari Sabtu/Minggu (kecuali ada jadwal khusus).

## 2. Perhitungan Statistik Kehadiran (Admin)
Admin akan melihat laporan dengan metrik berikut:
- **Total Hari Wajib Masuk**: Dihitung dari jumlah hari unik di mana guru memiliki jadwal dalam satu periode semester.
- **Kehadiran Aktual**: Jumlah rekaman `check_in` di tabel `teacher_attendance`.
- **Persentase Kehadiran**: `(Kehadiran Aktual / Hari Wajib Masuk) * 100`.
- **Status "Tanpa Keterangan"**: Guru yang memiliki jadwal hari ini tetapi belum melakukan `check_in` hingga jam pulang sekolah berakhir.

## 3. Perubahan Database (Next Update)
- **View Baru (`v_teacher_expected_attendance`)**: Untuk memetakan siapa saja yang seharusnya hadir setiap harinya berdasarkan jadwal.
- **Fungsi RPC (`get_teacher_attendance_summary`)**: Fungsi cerdas untuk menghitung persentase kehadiran guru secara real-time untuk ditampilkan di Dashboard Admin.

## 4. Keunggulan Sistem
- **Adil**: Guru yang tidak memiliki jadwal di hari tertentu (misal: hanya mengajar 3 hari seminggu) tidak akan dianggap "Alpa" di hari kosongnya.
- **Otomatis**: Admin tidak perlu mengecek jadwal manual, sistem langsung memberikan rapor kedisiplinan.
- **Profesional**: Tampilan monitoring akan menunjukkan "Beban Hari Kerja" vs "Realisasi Kehadiran".

---
*Diskusi ini akan menjadi acuan untuk pembaruan Skema SQL Versi 4.3.*
