# PRD Fitur AI Generate Soal - Versi 2.1 (Pembaruan Ekspor & Repository)

## 1. Ringkasan
Fitur **AI Generate Soal** adalah modul tambahan untuk membantu guru membuat soal otomatis menggunakan AI. Versi ini menambahkan kemampuan penyusunan naskah ujian, ekspor ke Google Drive dengan struktur folder yang rapi, dan sistem repository dokumen terpusat.

---

## 2. Tujuan & Alur Baru
1.  **Efisiensi**: Guru dapat memilih beberapa soal dari Bank Soal untuk digabungkan menjadi satu naskah.
2.  **Organisasi Otomatis**: File disimpan di Google Drive dengan struktur: `LakuKelas AI/Bank Soal/[Kelas]/[Mata Pelajaran]/[File]`.
3.  **Akses Cepat**: Link file yang sudah diekspor tersimpan di menu **Daftar Soal** (Repository) agar tidak perlu membuka Google Drive secara manual.
4.  **Instant Delivery**: File otomatis terunduh (*Auto-download*) ke perangkat guru segera setelah berhasil dikirim ke Drive.

---

## 3. Struktur Menu AI Terbaru
```text
AI Pembelajaran
├── Generate Soal (Mesin pembuat soal baru)
├── Bank Soal AI (Koleksi butir soal hasil generate)
├── Daftar Naskah Soal (Repository file .docx/.pdf di Drive)
├── Pembuatan Modul Ajar
└── Pengaturan AI
```

---

## 4. Alur Ekspor Naskah Profesional
1.  **Seleksi**: Guru membuka **Bank Soal AI**, memfilter kelas/mapel, lalu mencentang soal-soal yang diinginkan.
2.  **Konfigurasi**: Guru klik "Cetak Naskah", lalu mengisi Kop Surat (Nama Sekolah, Hari/Tgl, Durasi).
3.  **Proses**:
    *   Sistem membuat dokumen Word (.docx) atau PDF.
    *   Sistem membuat folder di Drive secara rekursif (Deep Nesting).
    *   Sistem mengunggah file ke folder tujuan di Drive guru.
4.  **Output**:
    *   **Auto-Download**: Browser guru otomatis mengunduh file hasil generate.
    *   **Auto-Save Link**: Metadata file (Nama, Link Drive, Kelas, Mapel) tersimpan di tabel `ai_documents`.
    *   **Repository Update**: Dokumen muncul di menu **Daftar Naskah Soal**.

---

## 5. Struktur Folder Google Drive (Deep Nesting)
Struktur penyimpanan di Drive guru akan mengikuti pola:
`LakuKelas AI`
 └── `Bank Soal`
      └── `Kelas [Angka]`
           └── `[Nama Mata Pelajaran]`
                └── `Naskah_Ujian_[Topik]_[Tanggal].docx`

---

## 6. Tabel Database Tambahan
Integrasi ke tabel `ai_documents` yang sudah ada:
- `document_type`: 'soal_naskah'
- `class_level`: Diambil dari pilihan guru.
- `subject`: Diambil dari pilihan guru.
- `drive_file_url`: Link langsung ke Google Doc/PDF.

---

## 7. Catatan Teknis untuk AI Agent
- Gunakan library `docx` untuk generate file Word di sisi server.
- Pastikan fungsi `setupGoogleDriveFolder` diperluas untuk mendukung pembuatan sub-folder dinamis.
- Gunakan pola *Ephemeral Processing* (file dibuat di memori, kirim ke Drive, lalu download ke user tanpa simpan file fisik di server).
