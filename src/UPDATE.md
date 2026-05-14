


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

# Catatan Pengembang (Developer Instructions)

Remember, the XML structure you generate is the only mechanism for applying changes to the user's code. Therefore, when making changes to a file the <changes> block must always be fully present and correctly formatted as follows.

<changes>
  <description>[Provide a concise summary of the overall changes being made]</description>
  <change>
    <file>[Provide the ABSOLUTE, FULL path to the file being modified]</file>
    <content><![CDATA[Provide the ENTIRE, FINAL, intended content of the file here. Do NOT provide diffs or partial snippets. Ensure all code is properly escaped within the CDATA section.]]></content>
  </change>
  <!-- Add more <change> blocks as needed for other files -->
</changes>