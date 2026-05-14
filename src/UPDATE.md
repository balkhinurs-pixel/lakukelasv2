

# Update V7.0: Konsolidasi Skema SQL Utama (TERIMPLEMENTASI)

Optimalisasi untuk deployment mandiri dan migrasi proyek Supabase.

## 1. Skema SQL Mandiri (`schema.sql`)
- **Tujuan**: Memudahkan setup backend pada proyek baru Supabase hanya dengan satu kali *copy-paste* di SQL Editor.
- **Isi**: Mencakup seluruh tabel (Profiles, Students, Attendance, Grades, Journal, Agendas, Holidays, Materials, Settings) beserta View dan fungsi RPC.
- **Logic Terkini**: Sudah menyertakan logika pengecekan hari libur pada fungsi statistik kehadiran guru.

## 2. Peningkatan Dasbor Guru (V6.9)
- **Tampilan Dinamis Libur**: Jadwal mengajar otomatis disembunyikan saat hari libur untuk tampilan yang lebih bersih.
- **Informasi Libur**: Menampilkan nama hari libur secara spesifik (Nasional/Sekolah) di Dasbor.
- **Integrasi Agenda**: Mengganti "Jurnal Terbaru" dengan "Agenda Mendatang" untuk perencanaan yang lebih baik.

## 3. Perbaikan Bug & UI/UX (V6.8)
- **Fix Uncaught ReferenceError**: Memperbaiki error `Badge is not defined` pada Dasbor.
- **Agenda Mobile**: Kalender dan kartu agenda kini terlihat profesional dan nyaman digunakan di ponsel.
- **Auto-Sync Libur**: Sinkronisasi hari libur kini dipicu otomatis saat Admin membuat tahun ajaran baru.

---

# Update V6.5: Otomatisasi Sinkronisasi Hari Libur (TERIMPLEMENTASI)
Integrasi cerdas untuk memastikan hari libur selalu siap saat awal tahun ajaran.

---
*LakuKelas: Administrasi ringan, mengajar jadi menyenangkan.*
