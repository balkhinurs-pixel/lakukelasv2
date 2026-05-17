# PRD Fitur AI Generate Soal

## 1. Ringkasan

Fitur **AI Generate Soal** adalah modul tambahan untuk membantu guru membuat soal otomatis menggunakan AI berdasarkan input manual dari guru. Aplikasi digunakan untuk **1 sekolah**, menggunakan stack **React + Vercel + Supabase + Google Drive**, dan setiap guru memakai **API key Gemini masing-masing**.

Fitur mendukung jenjang:

- SD / MI
- SMP / MTs
- SMA / MA
- SMK / MAK

Fitur ini dibuat sebagai modul baru dan tidak boleh mengganggu modul lama seperti presensi, jurnal, nilai, data siswa, data guru, dan administrasi sekolah.

---

## 2. Tujuan

1. Membantu guru membuat soal lebih cepat.
2. Membuat soal sesuai jenjang, kelas, mata pelajaran, bab/topik, kurikulum, dan tujuan asesmen.
3. Menghasilkan soal yang rapi, bisa diedit, dan bisa disimpan ke Bank Soal.
4. Mengurangi risiko hasil AI tidak sesuai dengan membatasi generate menjadi 5 soal per proses.
5. Mendukung rumus matematika dan teks Bahasa Arab.
6. Menghemat kuota Gemini guru.
7. Mendukung export Word/PDF dan penyimpanan hasil export ke Google Drive.

---

## 3. Pengguna

### Guru

Guru dapat:

- Menyimpan API key Gemini miliknya.
- Generate soal maksimal 5 soal per proses.
- Preview hasil soal.
- Edit soal.
- Hapus soal.
- Tandai soal sudah direview.
- Simpan soal ke Bank Soal.
- Export Word/PDF.
- Simpan file export ke Google Drive.

### Admin Sekolah

Admin dapat:

- Mengaktifkan atau menonaktifkan akses fitur AI untuk guru.
- Melihat monitoring penggunaan AI.
- Melihat status guru yang sudah menghubungkan API key.
- Melihat jumlah generate per guru.
- Mengatur limit internal harian jika diperlukan.

Admin tidak boleh melihat API key guru.

---

## 4. Menu

```text
AI Generate Soal
├── Generate Soal
├── Bank Soal
├── Riwayat Generate
└── Pengaturan AI
```

---

## 5. Alur Utama

```text
Guru buka Pengaturan AI
↓
Guru menyimpan API key Gemini
↓
Guru buka Generate Soal
↓
Guru mengisi detail soal
↓
Guru klik Generate 5 Soal
↓
Server mengambil API key guru
↓
Server memanggil Gemini
↓
AI menghasilkan JSON soal
↓
Sistem validasi hasil AI
↓
Soal otomatis tersimpan sebagai draft
↓
Guru melihat preview
↓
Guru edit / hapus / tandai sudah direview
↓
Guru simpan ke Bank Soal
↓
Guru export Word/PDF atau simpan ke Google Drive
```

---

## 6. Form Generate Soal

### Detail Soal

| Field | Wajib | Keterangan |
|---|---:|---|
| Jenjang | Ya | SD/MI, SMP/MTs, SMA/MA, SMK/MAK |
| Kelas | Ya | 1–12 |
| Semester | Opsional | Ganjil/Genap |
| Mata Pelajaran | Ya | Ambil dari data aplikasi jika sudah ada |
| Kurikulum | Ya | Merdeka, K13, Kemenag |
| Tujuan Soal | Ya | Latihan, PR, PH, PTS, PAS/UAS, PAT, US, Remedial, Pengayaan |
| Bab/Topik | Ya | Contoh: Persamaan Linear |
| Subtopik | Opsional | Contoh: Persamaan Linear Satu Variabel |
| CP/TP/KD | Opsional | Untuk memperjelas target soal |
| Ringkasan Materi | Opsional | Materi singkat dari guru |

### Konfigurasi AI

| Field | Wajib | Keterangan |
|---|---:|---|
| Jumlah Soal | Ya | Tetap 5 soal |
| Jenis Soal | Ya | Pilihan Ganda / Essay |
| Kesulitan | Ya | Mudah, Sedang, Sulit |
| Level Kognitif | Opsional | C1, C2, C3, C4, C5, C6 |
| Mode Soal | Opsional | Reguler, Remedial, Pengayaan, HOTS |
| Instruksi Tambahan | Opsional | Perintah khusus dari guru |

---

## 7. Aturan Generate

1. Satu kali generate hanya menghasilkan **5 soal**.
2. Guru tidak bisa memilih 10, 15, 20, atau 30 soal sekaligus.
3. Jika butuh lebih banyak, guru klik **Generate 5 Soal Lagi**.
4. Semua hasil AI default `needs_review = true`.
5. Semua hasil AI default `status = draft`.
6. Soal harus direview guru sebelum digunakan.

Alasan pembatasan 5 soal:

- Output AI lebih stabil.
- Risiko JSON rusak lebih kecil.
- Hemat token Gemini.
- Lebih mudah direview guru.
- Mengurangi risiko soal berulang atau kurang sesuai.

---

## 8. Aturan Pilihan Ganda

| Jenjang | Jumlah Opsi |
|---|---|
| SD/MI | A, B, C, D |
| SMP/MTs | A, B, C, D |
| SMA/MA | A, B, C, D, E |
| SMK/MAK | A, B, C, D, E |

Aturan:

1. Jumlah opsi otomatis mengikuti jenjang.
2. Guru tidak perlu memilih jumlah opsi secara manual.
3. Hanya boleh ada satu jawaban benar.
4. Sistem wajib menolak hasil AI jika jumlah opsi tidak sesuai jenjang.

---

## 9. Peran AI

AI berperan sebagai **asisten guru profesional Indonesia** yang membantu membuat soal sesuai jenjang, kelas, mata pelajaran, kurikulum, topik, tujuan asesmen, tingkat kesulitan, dan level kognitif.

AI tidak menggantikan guru. Semua hasil wajib diperiksa guru sebelum digunakan.

### System Prompt Dasar

```text
Anda adalah asisten guru profesional di Indonesia yang membantu membuat soal untuk sekolah dan madrasah.

Tugas Anda:
1. Membuat soal berdasarkan input manual guru.
2. Menyesuaikan soal dengan jenjang, kelas, mata pelajaran, kurikulum, topik, tujuan asesmen, tingkat kesulitan, dan level kognitif.
3. Membuat soal yang jelas, tidak ambigu, dan sesuai kemampuan siswa.
4. Menyertakan kunci jawaban dan pembahasan singkat.
5. Menghasilkan output JSON valid.

Aturan:
1. Jika ringkasan materi kosong, buat soal umum sesuai topik dan beri needs_review: true.
2. Jangan membuat kutipan ayat, hadis, pasal, data statistik, nama tokoh, tahun, atau regulasi spesifik jika tidak diberikan guru.
3. Untuk pilihan ganda SD/MI dan SMP/MTs, buat 4 opsi A-D.
4. Untuk pilihan ganda SMA/MA dan SMK/MAK, buat 5 opsi A-E.
5. Hanya boleh ada satu jawaban benar.
6. Untuk Matematika, tulis rumus dalam LaTeX sederhana dan valid.
7. Untuk Bahasa Arab, tulis teks Arab Unicode asli dan beri language_direction: rtl.
8. Gunakan bahasa Indonesia yang sesuai level siswa.
9. Semua soal default needs_review: true.
10. Output wajib JSON valid.
```

### Role Tambahan Berdasarkan Mapel

#### Matematika

```text
Karena mata pelajaran adalah Matematika, pastikan semua rumus ditulis dalam LaTeX valid. Berikan pembahasan langkah demi langkah secara ringkas.
```

#### Bahasa Arab

```text
Karena mata pelajaran adalah Bahasa Arab, pastikan teks Arab ditulis dengan Unicode Arab asli, arah kanan-ke-kiri, dan tidak rusak. Gunakan harakat jika diperlukan.
```

#### PAI / Madrasah

```text
Karena mata pelajaran adalah PAI atau mapel madrasah, jangan membuat kutipan ayat, hadis, atau hukum fikih spesifik jika guru tidak memberikan sumbernya. Jika kurang yakin, buat soal konsep umum dan tandai needs_review: true.
```

---

## 10. Format Output AI

### Pilihan Ganda SD/MI atau SMP/MTs

```json
{
  "questions": [
    {
      "sort_order": 1,
      "type": "multiple_choice",
      "question": "Apa fungsi akar pada tumbuhan?",
      "options": {
        "A": "Membuat makanan",
        "B": "Menyerap air dan mineral",
        "C": "Tempat fotosintesis",
        "D": "Menghasilkan bunga"
      },
      "answer": "B",
      "explanation": "Akar berfungsi menyerap air dan mineral dari tanah.",
      "difficulty": "mudah",
      "cognitive_level": "C1",
      "language_direction": "ltr",
      "needs_review": true
    }
  ]
}
```

### Pilihan Ganda SMA/MA atau SMK/MAK

```json
{
  "questions": [
    {
      "sort_order": 1,
      "type": "multiple_choice",
      "question": "Faktor utama penyebab pengangguran struktural adalah...",
      "options": {
        "A": "Perubahan musim produksi",
        "B": "Ketidaksesuaian keterampilan tenaga kerja dengan kebutuhan industri",
        "C": "Penurunan harga barang konsumsi",
        "D": "Peningkatan hari libur nasional",
        "E": "Kenaikan pendapatan rumah tangga"
      },
      "answer": "B",
      "explanation": "Pengangguran struktural terjadi karena keterampilan tenaga kerja tidak sesuai kebutuhan lapangan kerja.",
      "difficulty": "sedang",
      "cognitive_level": "C2",
      "language_direction": "ltr",
      "needs_review": true
    }
  ]
}
```

### Rumus Matematika

Rumus disimpan sebagai LaTeX.

```json
{
  "question": "Hasil dari \\(2x + 5 = 15\\) adalah...",
  "options": {
    "A": "\\(x = 3\\)",
    "B": "\\(x = 4\\)",
    "C": "\\(x = 5\\)",
    "D": "\\(x = 6\\)"
  },
  "answer": "C",
  "explanation": "Diketahui \\(2x + 5 = 15\\), maka \\(2x = 10\\), sehingga \\(x = 5\\)."
}
```

### Bahasa Arab

```json
{
  "question": "ما معنى كلمة \"كِتَابٌ\"؟",
  "options": {
    "A": "Buku",
    "B": "Meja",
    "C": "Pintu",
    "D": "Sekolah"
  },
  "answer": "A",
  "explanation": "كِتَابٌ berarti buku dalam bahasa Indonesia.",
  "language_direction": "rtl"
}
```

---

## 11. Validasi Hasil AI

Sebelum soal ditampilkan atau disimpan, sistem wajib memvalidasi:

1. JSON valid.
2. Jumlah soal maksimal 5.
3. Setiap soal punya pertanyaan.
4. Soal pilihan ganda SD/MI dan SMP/MTs punya opsi A-D.
5. Soal pilihan ganda SMA/MA dan SMK/MAK punya opsi A-E.
6. Jawaban sesuai opsi yang tersedia.
7. Pembahasan tidak kosong.
8. `sort_order` tidak duplikat dalam satu hasil generate.
9. Tidak ada soal duplikat dalam satu hasil generate.
10. Semua soal punya `needs_review = true`.

Jika gagal validasi, tampilkan:

```text
Hasil AI belum sesuai format. Silakan generate ulang atau perbaiki manual.
```

---

## 12. Penyimpanan Data

Karena aplikasi hanya untuk 1 sekolah dan tidak memakai sistem paket berbayar, struktur data dibuat sederhana.

### Tabel `questions`

```sql
create table public.questions (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null,
  created_by uuid not null,

  generation_group_id uuid default gen_random_uuid(),

  jenjang text not null,
  kelas text not null,
  semester text,
  subject text not null,
  curriculum text,
  assessment_purpose text,
  topic text not null,
  subtopic text,

  sort_order int not null,

  question_type text not null,
  question_text text not null,
  options_json jsonb,
  option_count int,
  correct_answer text,
  explanation text,

  difficulty text,
  cognitive_level text,
  language_direction text default 'ltr',

  needs_review boolean default true,
  status text default 'draft',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Catatan:

- `generation_group_id` mengelompokkan 5 soal hasil sekali generate.
- `sort_order` menjaga urutan soal.
- Metadata soal disimpan di setiap soal agar Bank Soal mudah difilter.

### Tabel `ai_user_settings`

```sql
create table public.ai_user_settings (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null,
  user_id uuid not null,

  provider text default 'gemini',
  api_key_encrypted text not null,

  model text default 'gemini-1.5-flash',
  is_active boolean default true,
  daily_generate_limit int default 10,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, provider)
);
```

### Tabel `ai_generation_logs`

```sql
create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null,
  user_id uuid not null,

  generation_group_id uuid,
  feature text default 'ai_generate_soal',

  provider text default 'gemini',
  model text,

  question_count int default 5,

  prompt_tokens int,
  output_tokens int,
  total_tokens int,

  status text not null,
  error_message text,

  created_at timestamptz default now()
);
```

### Tabel `question_exports` Opsional

```sql
create table public.question_exports (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null,
  created_by uuid not null,
  generation_group_id uuid,

  export_type text not null,
  include_answer_key boolean default false,
  include_explanation boolean default false,

  file_name text,
  file_url text,
  storage_provider text,

  created_at timestamptz default now()
);
```

---

## 13. RLS dan Keamanan

Sebelum implementasi, sesuaikan dengan struktur database lama. Gunakan `school_id`, `user_id`, `role`, `class`, dan `subject` yang sudah ada.

### Helper Function Contoh

Sesuaikan nama tabel dan kolom dengan database aplikasi.

```sql
create or replace function public.current_user_school_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select school_id
  from public.profiles
  where user_id = auth.uid()
  limit 1
$$;
```

```sql
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where user_id = auth.uid()
  limit 1
$$;
```

### RLS `questions`

```sql
alter table public.questions enable row level security;
```

```sql
create policy "questions_select_own_or_admin"
on public.questions
for select
to authenticated
using (
  school_id = public.current_user_school_id()
  and (
    created_by = auth.uid()
    or public.current_user_role() in ('admin', 'kepala_sekolah', 'waka_kurikulum')
  )
);
```

```sql
create policy "questions_insert_own"
on public.questions
for insert
to authenticated
with check (
  school_id = public.current_user_school_id()
  and created_by = auth.uid()
);
```

```sql
create policy "questions_update_own_or_admin"
on public.questions
for update
to authenticated
using (
  school_id = public.current_user_school_id()
  and (
    created_by = auth.uid()
    or public.current_user_role() = 'admin'
  )
)
with check (
  school_id = public.current_user_school_id()
);
```

### RLS `ai_user_settings`

```sql
alter table public.ai_user_settings enable row level security;
```

```sql
create policy "ai_user_settings_insert_own"
on public.ai_user_settings
for insert
to authenticated
with check (
  school_id = public.current_user_school_id()
  and user_id = auth.uid()
);
```

```sql
create policy "ai_user_settings_update_own"
on public.ai_user_settings
for update
to authenticated
using (
  school_id = public.current_user_school_id()
  and user_id = auth.uid()
)
with check (
  school_id = public.current_user_school_id()
  and user_id = auth.uid()
);
```

Frontend tidak boleh membaca `api_key_encrypted` secara langsung. Buat view aman:

```sql
create view public.ai_user_settings_safe as
select
  id,
  school_id,
  user_id,
  provider,
  model,
  is_active,
  daily_generate_limit,
  created_at,
  updated_at,
  case
    when api_key_encrypted is not null then true
    else false
  end as has_api_key
from public.ai_user_settings;
```

---

## 14. Bank Soal

Bank Soal harus bisa difilter berdasarkan:

- Jenjang
- Kelas
- Semester
- Mata pelajaran
- Kurikulum
- Tujuan soal
- Bab/topik
- Subtopik
- Jenis soal
- Kesulitan
- Level kognitif
- Status review
- Guru pembuat
- Tanggal dibuat

Saat membuka satu hasil generate:

```sql
where generation_group_id = '...'
order by sort_order asc
```

---

## 15. Export Word/PDF dan Google Drive

AI hanya menghasilkan JSON soal. Word/PDF dibuat oleh sistem dari data yang sudah tersimpan.

Alur:

```text
Soal tersimpan di Supabase
↓
Guru klik Export Word/PDF
↓
Sistem membuat file dari data soal
↓
Guru download atau simpan ke Google Drive
```

Pilihan export:

- Soal saja
- Soal + kunci jawaban
- Soal + kunci + pembahasan

Format nama file:

```text
Soal_Matematika_Kelas7_PersamaanLinear_UAS_2026-05-17.docx
```

Folder Google Drive:

```text
LakuKelas / AI Generate Soal / Tahun Ajaran / Mata Pelajaran
```

---

## 16. Library yang Disarankan

### Wajib

```bash
react-hook-form
zod
@hookform/resolvers
katex
react-katex
docx
file-saver
dompurify
@google/genai
date-fns
```

### Opsional

```bash
@react-pdf/renderer
@tiptap/react
@tiptap/starter-kit
lucide-react
framer-motion
clsx
tailwind-merge
```

Fungsi utama:

- `react-hook-form`: form generate soal.
- `zod`: validasi form dan output AI.
- `katex` + `react-katex`: render rumus matematika.
- `docx`: export Word.
- `file-saver`: download file.
- `dompurify`: sanitasi HTML.
- `@google/genai`: koneksi Gemini di server.
- `date-fns`: format tanggal dan nama file.

---

## 17. Endpoint yang Dibutuhkan

```text
POST /api/ai/save-key
GET  /api/ai/key-status
POST /api/ai/generate-questions
POST /api/questions/update
POST /api/questions/delete
POST /api/questions/mark-reviewed
GET  /api/questions/bank
POST /api/export/word
POST /api/export/pdf
POST /api/drive/upload
```

Catatan:

- API key Gemini tidak boleh dipanggil langsung dari React.
- Pemanggilan Gemini harus lewat Vercel Serverless Function atau Supabase Edge Function.

---

## 18. Optimasi Kuota Gemini

1. Maksimal 5 soal per generate.
2. Jangan kirim prompt terlalu panjang.
3. Jangan kirim semua riwayat soal.
4. Batasi ringkasan materi maksimal 2.000–3.000 karakter.
5. Regenerate per soal, bukan semua soal.
6. Word/PDF dibuat oleh sistem, bukan oleh AI.
7. Simpan hasil generate ke draft setelah berhasil.

Batas input disarankan:

| Field | Batas |
|---|---:|
| Topik | 100 karakter |
| Subtopik | 200 karakter |
| CP/TP/KD | 1.000 karakter |
| Ringkasan materi | 2.000–3.000 karakter |
| Instruksi tambahan | 1.000 karakter |

---

## 19. Tahapan Implementasi

### Tahap 1 — Database dan RLS

- Cek struktur database lama.
- Sesuaikan dengan tabel `profiles`, `schools`, `subjects`, `classes`, dan role yang sudah ada.
- Buat tabel `questions`, `ai_user_settings`, `ai_generation_logs`.
- Aktifkan RLS.
- Buat policy sesuai role.

### Tahap 2 — Pengaturan AI Guru

- Buat halaman Pengaturan AI.
- Guru bisa menyimpan API key Gemini.
- API key disimpan aman.
- Frontend hanya menampilkan status terhubung/belum terhubung.

### Tahap 3 — Generate Soal

- Buat form Generate Soal.
- Batasi jumlah soal menjadi 5.
- Kirim request ke server function.
- Server memanggil Gemini dengan API key guru.
- Hasil AI divalidasi dengan Zod.
- Hasil disimpan sebagai draft.

### Tahap 4 — Preview dan Edit

- Tampilkan preview soal.
- Guru bisa edit, hapus, regenerate per soal, dan tandai sudah direview.
- Render rumus dengan KaTeX.
- Tampilkan Bahasa Arab dengan RTL.

### Tahap 5 — Bank Soal

- Tampilkan daftar soal.
- Tambahkan filter kelas, mapel, topik, tujuan soal, kesulitan, level kognitif, dan status review.
- Gunakan `generation_group_id` untuk membuka hasil satu kali generate.

### Tahap 6 — Export Word/PDF

- Export dari data Supabase.
- Pilihan: soal saja, soal + kunci, soal + kunci + pembahasan.
- Pastikan opsi A-D/A-E sesuai jenjang.

### Tahap 7 — Google Drive

- Tambahkan tombol Simpan ke Drive.
- Upload file export ke folder Drive.
- Simpan log export jika diperlukan.

---

## 20. Acceptance Criteria

Fitur dianggap selesai jika:

1. Guru bisa menyimpan API key Gemini miliknya.
2. API key tidak terlihat di browser setelah disimpan.
3. Guru bisa generate maksimal 5 soal per proses.
4. Hasil generate otomatis memiliki `generation_group_id`.
5. Setiap soal memiliki `sort_order`.
6. SD/MI dan SMP/MTs menghasilkan opsi A-D.
7. SMA/MA dan SMK/MAK menghasilkan opsi A-E.
8. Rumus matematika tampil rapi, bukan kode mentah.
9. Bahasa Arab tampil RTL dan tidak rusak.
10. Semua soal default `needs_review = true`.
11. Guru bisa edit, hapus, dan tandai sudah direview.
12. Guru bisa melihat soal di Bank Soal.
13. Bank Soal bisa difilter berdasarkan kelas, mapel, topik, tujuan soal, dan status review.
14. Guru bisa export Word/PDF.
15. Guru bisa simpan hasil export ke Google Drive.
16. Admin bisa melihat monitoring penggunaan AI.
17. Data dipisahkan berdasarkan `school_id`.
18. RLS aktif pada tabel baru.
19. Fitur baru tidak mengganggu modul lama.

---

## 21. Catatan untuk AI Agent

```text
Aplikasi digunakan untuk 1 sekolah dan tidak memakai sistem paket berbayar.
Gemini menggunakan API key masing-masing guru.
Jangan membuat billing, subscription, paket Basic/Pro, atau sistem pembayaran.

Sebelum implementasi:
1. Cek struktur database Supabase yang sudah ada.
2. Gunakan school_id, user_id, role, class, subject, dan profile yang sudah tersedia.
3. Jangan membuat tabel duplikat.
4. Jangan mengubah modul presensi, jurnal, nilai, siswa, guru, atau administrasi lain.
5. Tambahkan fitur AI Generate Soal sebagai modul baru yang terpisah.
6. Satu kali generate hanya 5 soal.
7. Semua soal hasil AI wajib diberi status Perlu Review.
8. API key guru tidak boleh terlihat di frontend.
9. Word/PDF dibuat oleh sistem dari data soal, bukan dibuat oleh AI.
```
