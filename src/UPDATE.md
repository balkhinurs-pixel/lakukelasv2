# Log Pembaruan LakuKelas

## V8.0: Presensi Kolaboratif & Sinkronisasi Cerdas (TERIMPLEMENTASI)
Optimisasi alur kerja guru untuk efisiensi input data dan pemantauan real-time oleh Wali Kelas.

### 1. Konsep "First Input Base"
- **Logika**: Guru mata pelajaran yang melakukan input presensi pertama kali di suatu kelas (pada hari tersebut) akan menentukan status awal seluruh siswa.
- **Penerapan**: Data ini menjadi referensi utama bagi sistem untuk hari itu.

### 2. Fitur "Inherit & Update" bagi Guru
- **Alur Kerja**: Guru di jam pelajaran berikutnya tidak akan menerima formulir kosong. Sistem otomatis mengisi formulir berdasarkan data presensi terakhir di hari yang sama.
- **Efisiensi**: Guru hanya perlu melakukan perubahan (adjustment) jika ada perubahan status siswa (misal: siswa terlambat hadir atau izin pulang di tengah pelajaran).
- **Manfaat**: Menghemat waktu input guru hingga 80% per sesi dan menjaga konsistensi data antar jam pelajaran.

### 3. Real-time Monitoring Wali Kelas
- **Akses**: Wali kelas dapat melihat status kehadiran siswa di kelas perwaliannya secara langsung (live) melalui menu "Progres Siswa".
- **Visualisasi**: Ditambahkan kartu status hari ini yang merinci siapa saja yang Hadir, Sakit, Izin, atau Alpha berdasarkan input guru mapel terakhir.

### 4. Protokol Pembaruan SQL
- **Snippets Update**: Untuk database operasional, sistem akan memberikan potongan skrip SQL untuk pembaruan fitur (RLS, RPC, View) agar data lama tetap aman.
- **Master Schema**: File `schema.sql` hanya diperbarui secara menyeluruh sebagai referensi instalasi baru setelah fitur diverifikasi berhasil oleh pengguna.

---

## V7.0: Konsolidasi Skema SQL Utama (TERIMPLEMENTASI)
Optimalisasi untuk deployment mandiri dan migrasi proyek Supabase.
- Penyediaan file `schema.sql` yang idempotent (aman dijalankan berulang kali).
- Penguatan aturan RLS untuk keamanan multi-role (Guru, Wali Kelas, Kepsek).
- Otomatisasi profil pengguna baru melalui PostgreSQL Trigger.
