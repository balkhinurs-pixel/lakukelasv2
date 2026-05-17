saya# PRD — Integrasi Izin Google Drive untuk Fitur AI Pembelajaran

## 1. Ringkasan

Fitur ini bertujuan menambahkan integrasi **Google Drive milik masing-masing guru** ke aplikasi administrasi sekolah yang sudah ada. Integrasi ini akan dipakai sebagai fondasi penyimpanan dokumen hasil fitur AI Pembelajaran, seperti RPP, soal, modul ajar, kisi-kisi, ATP, CP, dan dokumen pendukung lainnya.

Aplikasi utama tetap menggunakan:

```txt
Frontend: React
Backend/API: Vercel API Route / Supabase Edge Function
Database: Supabase
Auth: Supabase Auth Google
Storage dokumen AI: Google Drive guru
```

Google Drive hanya dipakai untuk menyimpan **file/dokumen final**, sedangkan Supabase tetap menyimpan data utama, metadata dokumen, `folder_id`, dan riwayat generate.

---

## 2. Tujuan Fitur

### Tujuan utama

Membuat sistem agar setiap guru yang login dengan Google dapat:

1. Memberikan izin akses Google Drive ke aplikasi.
2. Memiliki folder khusus aplikasi di Google Drive.
3. Menyimpan dokumen AI pembelajaran ke folder tersebut.
4. Melihat daftar dokumen dari dashboard aplikasi.
5. Membuka dokumen Drive dari aplikasi melalui link.
6. Mengatur file menjadi private atau public link jika diperlukan.

### Tujuan teknis

Sistem harus bisa:

```txt
- meminta scope Google Drive saat login
- mendapatkan provider_token dari Supabase Auth
- membuat folder khusus di Drive guru
- menyimpan folder_id ke Supabase
- membuat/upload file ke folder tersebut
- menyimpan metadata file ke Supabase
- mengatur permission file menjadi public jika guru memilih
```

Catatan: Supabase mendukung Google social login dan provider token dapat digunakan untuk mengakses Google API atas nama user, tetapi refresh provider token perlu dirancang dengan aman di backend jika dibutuhkan akses jangka panjang.

---

## 3. Scope Google yang Digunakan

### Scope wajib

```txt
openid
email
profile
https://www.googleapis.com/auth/drive.file
```

### Alasan memakai `drive.file`

Gunakan:

```txt
https://www.googleapis.com/auth/drive.file
```

Bukan:

```txt
https://www.googleapis.com/auth/drive
```

Karena `drive.file` hanya memberi akses untuk membuat dan mengelola file/folder yang dibuat atau dibuka oleh aplikasi, sehingga lebih aman dan lebih ringan dari sisi verifikasi Google.

---

## 4. Aktor Pengguna

### Guru

Guru adalah pengguna utama fitur ini. Guru dapat:

```txt
- login dengan Google
- menghubungkan Google Drive
- membuat folder khusus aplikasi
- membuat dokumen AI
- menyimpan dokumen ke Drive
- membuka file hasil generate
- membuat file menjadi public link jika diperlukan
```

### Admin Sekolah

Admin tidak otomatis memiliki akses ke Drive guru. Admin hanya bisa melihat metadata yang disimpan di Supabase sesuai aturan aplikasi.

Contoh metadata:

```txt
- nama dokumen
- jenis dokumen
- guru pembuat
- tanggal dibuat
- link dokumen jika dibagikan
```

### Sistem

Sistem bertugas:

```txt
- memproses OAuth Google
- membuat folder aplikasi di Drive guru
- menyimpan folder_id
- membuat/upload file ke Drive
- mencatat metadata ke Supabase
- mengatur permission file jika diminta guru
```

---

## 5. User Story

### US-001 — Guru login dengan Google dan memberi izin Drive

Sebagai guru, saya ingin login menggunakan akun Google dan memberi izin akses Drive, agar aplikasi bisa menyimpan dokumen AI ke Google Drive saya.

**Acceptance Criteria:**

```txt
- Guru bisa login dengan Google.
- Consent screen Google menampilkan izin Drive.
- Setelah login berhasil, aplikasi mendapatkan provider_token.
- Sistem bisa menggunakan token untuk memanggil Google Drive API.
```

---

### US-002 — Sistem membuat folder khusus aplikasi

Sebagai guru, saya ingin aplikasi membuat folder khusus di Google Drive saya, agar dokumen hasil AI tidak bercampur dengan file pribadi.

**Acceptance Criteria:**

```txt
- Jika guru belum punya folder aplikasi, sistem membuat folder baru.
- Nama folder default: "LakuKelas AI" atau nama aplikasi.
- folder_id disimpan ke tabel profiles atau google_drive_integrations.
- Jika folder sudah ada, sistem tidak membuat duplikat.
```

---

### US-003 — Guru dapat menyimpan dokumen ke Drive

Sebagai guru, saya ingin hasil AI seperti RPP atau soal bisa tersimpan ke Google Drive, agar saya bisa membuka, mengedit, dan membagikannya.

**Acceptance Criteria:**

```txt
- Sistem bisa membuat file Google Docs atau upload file PDF/DOCX.
- File masuk ke folder khusus aplikasi.
- drive_file_id dan drive_file_url disimpan ke Supabase.
- Guru bisa membuka file dari dashboard.
```

---

### US-004 — Guru dapat membuat file menjadi public link

Sebagai guru, saya ingin bisa membagikan dokumen melalui link publik, agar dokumen bisa dibuka oleh pihak lain tanpa login aplikasi.

**Acceptance Criteria:**

```txt
- File default private.
- Tombol "Buat Link Publik" tersedia di dokumen.
- Saat diklik, sistem membuat permission anyone with link.
- Status is_public berubah menjadi true di Supabase.
- Link publik bisa dibuka oleh orang yang memiliki link.
```

---

### US-005 — Guru dapat memutus integrasi Drive

Sebagai guru, saya ingin bisa memutus akses Google Drive dari aplikasi, agar saya bisa mengontrol akses akun saya.

**Acceptance Criteria:**

```txt
- Guru bisa klik "Putuskan Google Drive".
- Sistem menghapus token tersimpan dari database.
- folder_id lama tetap boleh disimpan sebagai riwayat, tetapi status integrasi menjadi disconnected.
- Aplikasi tidak bisa lagi upload file baru ke Drive sampai guru menghubungkan ulang.
```

---

## 6. Flow Utama

### 6.1 Flow login / daftar guru

```txt
1. Guru klik "Login dengan Google"
2. Aplikasi meminta scope:
   - openid
   - email
   - profile
   - drive.file
3. Guru menyetujui consent
4. Supabase menyelesaikan OAuth callback
5. Aplikasi mendapatkan session
6. Backend menerima provider_token
7. Sistem cek status integrasi Drive guru
8. Jika belum ada folder, sistem membuat folder khusus
9. folder_id disimpan ke Supabase
10. Guru diarahkan ke dashboard
```

Contoh login Supabase:

```js
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    scopes: "openid email profile https://www.googleapis.com/auth/drive.file",
    queryParams: {
      access_type: "offline",
      prompt: "consent",
    },
  },
});
```

---

### 6.2 Flow membuat folder Drive

```txt
1. Backend menerima request setup Drive
2. Backend validasi user Supabase
3. Backend ambil provider_token user
4. Backend panggil Google Drive API
5. Buat folder "LakuKelas AI"
6. Simpan folder_id dan folder_url ke Supabase
7. Return status sukses ke frontend
```

Struktur folder ideal:

```txt
LakuKelas AI
├── RPP
├── Soal
├── Modul Ajar
├── Kisi-Kisi
└── Gambar Soal
```

Pada MVP, cukup buat folder utama dulu:

```txt
LakuKelas AI
```

Subfolder bisa ditambahkan di tahap berikutnya.

---

### 6.3 Flow menyimpan dokumen AI

```txt
1. Guru membuat dokumen AI
2. Sistem menghasilkan konten
3. Guru klik "Simpan ke Drive"
4. Backend membuat file di Google Drive
5. File dimasukkan ke folder khusus aplikasi
6. Metadata file disimpan ke Supabase
7. Guru melihat dokumen di daftar riwayat
```

---

### 6.4 Flow membuat public link

```txt
1. Guru membuka daftar dokumen
2. Guru klik "Buat Link Publik"
3. Backend memanggil Drive permissions.create
4. Permission dibuat:
   - type: anyone
   - role: reader
5. Supabase update is_public = true
6. Frontend menampilkan link publik
```

---

## 7. Kebutuhan Fungsional

### FR-001 — Login Google dengan scope Drive

Aplikasi harus mendukung login Google dengan tambahan scope Drive.

```txt
Priority: High
```

---

### FR-002 — Setup folder Drive otomatis

Aplikasi harus membuat folder khusus aplikasi di Drive guru setelah izin diberikan.

```txt
Priority: High
```

---

### FR-003 — Simpan folder ID ke Supabase

Aplikasi harus menyimpan `google_drive_folder_id` agar tidak membuat folder baru setiap login.

```txt
Priority: High
```

---

### FR-004 — Upload / create file ke folder Drive

Aplikasi harus bisa menyimpan dokumen ke folder Drive guru.

```txt
Priority: High
```

---

### FR-005 — Simpan metadata dokumen ke Supabase

Setiap file yang dibuat harus dicatat di Supabase.

```txt
Priority: High
```

---

### FR-006 — Public link opsional

Aplikasi harus menyediakan opsi untuk membuat file menjadi public link, bukan otomatis public.

```txt
Priority: Medium
```

---

### FR-007 — Disconnect Google Drive

Guru harus bisa memutus integrasi Drive.

```txt
Priority: Medium
```

---

### FR-008 — Status integrasi Drive

Dashboard guru harus menampilkan status:

```txt
- Belum terhubung
- Terhubung
- Token expired
- Error akses Drive
```

```txt
Priority: Medium
```

---

## 8. Kebutuhan Non-Fungsional

### Security

```txt
- Jangan simpan provider_token di localStorage.
- Jangan panggil Google Drive API langsung dari frontend untuk aksi sensitif.
- Token/refresh token harus diproses di backend.
- Gunakan scope drive.file, bukan drive penuh.
- File default private.
- Public link hanya dibuat atas aksi eksplisit guru.
```

### Privacy

```txt
- Aplikasi tidak boleh membaca semua isi Drive guru.
- Aplikasi hanya mengelola file/folder yang dibuat oleh aplikasi.
- Guru harus tahu bahwa dokumen akan disimpan ke Drive mereka.
```

### Reliability

```txt
- Jika upload Drive gagal, konten AI jangan langsung hilang.
- Simpan draft sementara ke Supabase.
- Tampilkan error yang jelas ke guru.
```

### Performance

```txt
- Setup Drive hanya dilakukan sekali per guru.
- Jangan cek Drive setiap halaman dibuka.
- Gunakan folder_id dari Supabase sebagai cache utama.
```

---

## 9. Desain Database Supabase

### Opsi A — Simpan di tabel `profiles`

Cocok kalau ingin sederhana.

```sql
alter table profiles
add column google_drive_connected boolean default false,
add column google_drive_folder_id text,
add column google_drive_folder_url text,
add column google_drive_connected_at timestamptz;
```

### Opsi B — Tabel khusus `google_drive_integrations`

Lebih rapi dan scalable.

```sql
create table google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  drive_email text,
  folder_id text,
  folder_url text,
  folder_name text default 'LakuKelas AI',
  status text not null default 'connected',
  connected_at timestamptz default now(),
  disconnected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id)
);
```

### Tabel `ai_documents`

```sql
create table ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  title text not null,
  subject text,
  class_level text,
  semester text,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  mime_type text,
  is_public boolean default false,
  status text default 'created',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Tabel token, jika perlu

Kalau membutuhkan akses Drive jangka panjang tanpa login ulang, buat tabel token terenkripsi.

```sql
create table google_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id)
);
```

Catatan penting: tabel token harus memakai RLS ketat dan idealnya hanya bisa diakses backend/service role.

---

## 10. RLS Supabase

### `google_drive_integrations`

```sql
alter table google_drive_integrations enable row level security;

create policy "Users can view own drive integration"
on google_drive_integrations
for select
using (auth.uid() = user_id);

create policy "Users can insert own drive integration"
on google_drive_integrations
for insert
with check (auth.uid() = user_id);

create policy "Users can update own drive integration"
on google_drive_integrations
for update
using (auth.uid() = user_id);
```

### `ai_documents`

```sql
alter table ai_documents enable row level security;

create policy "Users can view own AI documents"
on ai_documents
for select
using (auth.uid() = user_id);

create policy "Users can insert own AI documents"
on ai_documents
for insert
with check (auth.uid() = user_id);

create policy "Users can update own AI documents"
on ai_documents
for update
using (auth.uid() = user_id);

create policy "Users can delete own AI documents"
on ai_documents
for delete
using (auth.uid() = user_id);
```

---

## 11. API Endpoint yang Dibutuhkan

### 11.1 `POST /api/google-drive/setup`

Fungsi:

```txt
- cek apakah user sudah punya folder Drive
- jika belum, buat folder utama
- simpan folder_id ke Supabase
```

Request:

```json
{}
```

Response sukses:

```json
{
  "success": true,
  "folder_id": "abc123",
  "folder_url": "https://drive.google.com/drive/folders/abc123"
}
```

---

### 11.2 `POST /api/google-drive/create-document`

Fungsi:

```txt
- membuat file Google Docs / upload file ke Drive
- memasukkan file ke folder aplikasi
- menyimpan metadata ke Supabase
```

Request:

```json
{
  "title": "RPP Matematika Kelas 7 - Pecahan",
  "document_type": "rpp",
  "content": "Isi dokumen..."
}
```

Response:

```json
{
  "success": true,
  "drive_file_id": "file123",
  "drive_file_url": "https://docs.google.com/document/d/file123/edit"
}
```

---

### 11.3 `POST /api/google-drive/make-public`

Fungsi:

```txt
- membuat file bisa dibuka siapa saja yang punya link
- update is_public di Supabase
```

Request:

```json
{
  "document_id": "uuid-ai-document"
}
```

Response:

```json
{
  "success": true,
  "is_public": true,
  "drive_file_url": "https://docs.google.com/document/d/file123/edit"
}
```

---

### 11.4 `POST /api/google-drive/disconnect`

Fungsi:

```txt
- menandai integrasi sebagai disconnected
- menghapus token tersimpan jika ada
```

Response:

```json
{
  "success": true,
  "status": "disconnected"
}
```

---

## 12. UI yang Dibutuhkan

### Halaman Setting Integrasi

Lokasi yang disarankan:

```txt
Dashboard Guru → Pengaturan → Integrasi → Google Drive
```

Komponen:

```txt
- Status Google Drive
- Email Google yang terhubung
- Nama folder Drive
- Tombol "Hubungkan Google Drive"
- Tombol "Buat Folder Drive"
- Tombol "Buka Folder"
- Tombol "Putuskan Integrasi"
```

Status UI:

```txt
Belum terhubung:
"Tautkan Google Drive untuk menyimpan dokumen AI pembelajaran."

Terhubung:
"Google Drive terhubung. Dokumen AI akan disimpan ke folder LakuKelas AI."

Token expired:
"Izin Google Drive perlu diperbarui. Silakan hubungkan ulang."

Error:
"Gagal mengakses Google Drive. Coba hubungkan ulang."
```

---

### UI Saat Simpan Dokumen AI

Setelah guru generate RPP/soal:

```txt
[Preview Dokumen]
[Edit]
[Simpan ke Google Drive]
[Simpan sebagai Draft]
```

Setelah berhasil:

```txt
Dokumen berhasil disimpan ke Google Drive.

[Buka Dokumen]
[Buat Link Publik]
[Kembali ke Daftar]
```

---

## 13. Aturan Public / Private

Default:

```txt
Semua file private
```

File hanya menjadi public jika guru klik:

```txt
"Buat Link Publik"
```

Permission yang dibuat:

```json
{
  "role": "reader",
  "type": "anyone"
}
```

Jangan otomatis membuat seluruh folder public. Lebih aman hanya file tertentu yang dibuat public.

---

## 14. Error Handling

### Kasus error yang perlu ditangani

```txt
- Guru menolak izin Google Drive
- provider_token kosong
- token expired
- folder_id tidak valid
- folder dihapus manual oleh guru
- Drive storage penuh
- upload gagal
- permission public gagal dibuat
- koneksi Google API error
```

### Pesan error ramah pengguna

```txt
"Gagal menghubungkan Google Drive. Silakan coba login ulang dengan Google."

"Folder Drive aplikasi tidak ditemukan. Sistem akan membuat folder baru."

"File gagal disimpan ke Google Drive. Dokumen masih tersimpan sebagai draft."

"Izin Google Drive sudah kedaluwarsa. Silakan hubungkan ulang akun Google."
```

---

## 15. MVP Scope

### Masuk MVP

```txt
- Login Google dengan scope drive.file
- Setup folder utama di Google Drive guru
- Simpan folder_id ke Supabase
- Upload / create dokumen sederhana ke Drive
- Simpan metadata dokumen ke Supabase
- Tombol buka dokumen Drive
- Tombol buat file public link
```

### Tidak masuk MVP

```txt
- Sinkronisasi semua file Drive
- Membaca seluruh isi Drive guru
- Manajemen folder kompleks
- Kolaborasi multi-user di file
- Editor dokumen penuh di aplikasi
- Auto backup semua file
- Pencarian file Drive dari aplikasi
```

---

## 16. Roadmap Implementasi

### Tahap 1 — Fondasi OAuth Drive

```txt
- Tambahkan scope drive.file ke Google login
- Pastikan provider_token tersedia
- Buat halaman status integrasi Drive
```

### Tahap 2 — Setup folder

```txt
- Buat endpoint setup Drive
- Buat folder "LakuKelas AI"
- Simpan folder_id ke Supabase
- Tampilkan tombol buka folder
```

### Tahap 3 — Upload file test

```txt
- Buat endpoint upload/create file sederhana
- Simpan file test ke folder Drive
- Simpan metadata ke ai_documents
```

### Tahap 4 — Integrasi ke AI Pembelajaran

```txt
- Simpan RPP hasil AI ke Drive
- Simpan soal hasil AI ke Drive
- Simpan modul/kisi-kisi ke Drive
```

### Tahap 5 — Sharing

```txt
- Tambahkan tombol buat public link
- Tambahkan status public/private
- Tambahkan validasi sebelum share
```

---

## 17. Risiko dan Mitigasi

### Risiko 1 — Token Google expired

Mitigasi:

```txt
- Simpan refresh token secara terenkripsi jika diperlukan.
- Jika token gagal, minta guru hubungkan ulang.
```

### Risiko 2 — Guru menolak izin Drive

Mitigasi:

```txt
- Fitur AI tetap bisa generate preview.
- Tombol "Simpan ke Drive" nonaktif sampai Drive terhubung.
```

### Risiko 3 — Folder Drive dihapus guru

Mitigasi:

```txt
- Saat upload gagal karena folder tidak ditemukan, buat folder baru.
- Update folder_id baru ke Supabase.
```

### Risiko 4 — File public tanpa sengaja

Mitigasi:

```txt
- Default private.
- Public hanya per file.
- Tampilkan konfirmasi sebelum membuat public link.
```

### Risiko 5 — Scope terlalu luas ditolak Google

Mitigasi:

```txt
- Gunakan drive.file, bukan drive.
- Jelaskan tujuan izin di consent/app policy.
```

---

## 18. Definisi Selesai

Fitur dianggap selesai jika:

```txt
- Guru bisa login dengan Google dan memberi izin Drive.
- Aplikasi bisa membuat folder khusus di Drive guru.
- folder_id tersimpan di Supabase.
- Aplikasi bisa membuat/upload file ke folder tersebut.
- Dokumen muncul di daftar riwayat aplikasi.
- Guru bisa membuka file dari dashboard.
- Guru bisa membuat file tertentu menjadi public link.
- File default tetap private.
- Error token/izin/folder ditangani dengan jelas.
```

---

## 19. Rekomendasi Akhir

Untuk aplikasi ini, implementasi terbaik adalah:

```txt
Google Drive = penyimpanan dokumen final AI
Supabase = database utama + metadata dokumen
Supabase Storage = gambar kecil/asset aplikasi jika diperlukan
Gemini = generate isi pembelajaran
Pollinations = generate gambar pendukung jika diperlukan
```

Prioritas implementasi:

```txt
1. Google OAuth + Drive scope
2. Setup folder Drive guru
3. Upload file test
4. Simpan metadata ke Supabase
5. Baru sambungkan ke fitur AI RPP/soal/modul
```

PRD ini khusus menyelesaikan fondasi Google Drive dulu, sebelum fitur AI pembelajaran dibuat lebih besar.
