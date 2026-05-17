
# Log Pembaruan LakuKelas

## V16.0: Restrukturisasi AI Pembelajaran (PROGRES)
Mengubah modul AI menjadi sistem manajemen konten yang lebih terstruktur.

### 1. Tahap 1: Arsitektur Menu (Selesai)
- Melakukan pemisahan fitur AI Pembelajaran menjadi 4 sub-menu utama: Bank Soal, Modul Ajar, LKPD, dan Generate Soal.
- Memperbarui Sidebar dengan sistem *collapsible* (lipat) untuk kategori AI.
- Menyiapkan PRD V2.0 sebagai panduan pengembangan jangka panjang.
- Membuat halaman *placeholder* dengan desain indigo premium untuk konsistensi UI.

---

## V15.0: Fondasi Integrasi Google Drive (Selesai)
Menyelesaikan tahap awal integrasi penyimpanan awan untuk dokumen AI.

### 1. Tahap 1: OAuth & UI (Selesai)
- Menambahkan scope `drive.file` pada proses login Google.
- Membuat tab "Integrasi" di halaman Pengaturan.
- Implementasi sistem pemutusan akses (Disconnect).

### 2. Tahap 2: Manajemen Folder (Selesai)
- Implementasi Server Action `setupGoogleDriveFolder` untuk membuat folder "LakuKelas AI" secara otomatis.
- Penyimpanan `folder_id` ke database Supabase untuk mencegah duplikasi.

### 3. Tahap 3: Uji Coba Tulis (Selesai)
- Implementasi fungsi `createTestDocument` untuk memverifikasi izin tulis ke folder aplikasi.
- Pencatatan metadata file ke tabel `ai_documents`.

### 4. Tahap 4: Inisialisasi Otomatis (Selesai)
- Menambahkan sistem pengecekan otomatis di Dashboard.
- Guru yang login via Google kini akan langsung mendapatkan folder "LakuKelas AI" secara otomatis saat membuka aplikasi tanpa harus melakukan setup manual di pengaturan.

### 5. Tahap 5: AI Pembelajaran - Generator RPP & Soal (Selesai)
- Implementasi Genkit Flow `generateEducationContent` untuk membuat draf RPP dan Soal.
- Membuat halaman dashboard AI Pembelajaran yang interaktif.
- Integrasi sistem simpan dokumen otomatis ke Google Drive dalam format Google Doc.
- Penambahan fitur review/preview konten AI sebelum disimpan.

### 6. Tahap 6: API Key Mandiri Per Guru (Selesai)
- Memindahkan tanggung jawab API Key Gemini dari server ke pengguna.
- Menambahkan field `gemini_api_key` di profil Supabase.
- Menyediakan UI input API Key di Pengaturan > Integrasi dengan panduan Google AI Studio.
- Melakukan isolasi proses AI agar menggunakan Key unik masing-masing guru untuk efisiensi biaya.
- Memperbaiki string scope OAuth untuk menyertakan openid/email/profile guna stabilitas koneksi Google.
