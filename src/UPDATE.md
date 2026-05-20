
# Log Pembaruan LakuKelas

## Update V47.0: Integrated AI Curriculum Ecosystem - TERIMPLEMENTASI
Penyempurnaan alur kerja guru dengan mengintegrasikan Pemetaan Kurikulum (CP/ATP) langsung ke penyusunan Modul Ajar.

### 1. AI Curriculum Architect
- **Generate CP & ATP**: Mesin baru yang ahli dalam memecah Capaian Pembelajaran menjadi Tujuan Pembelajaran (TP) dan Alur (ATP) yang sistematis.
- **Arsip Master Kurikulum**: Menu khusus untuk menyimpan dan mengelola dokumen master kurikulum di Google Drive dan Database.

### 2. Smart Reference Integration
- **ATP to RPP Bridge**: Saat membuat RPP, guru kini dapat memilih referensi ATP yang sudah ada.
- **Context Injection**: AI secara otomatis membaca konten ATP untuk menghasilkan langkah pembelajaran yang 100% selaras dengan alur yang direncanakan.

### 3. Folder Deep Nesting V2
- Otomatisasi folder Drive yang lebih rapi: `LakuKelas AI/CP & ATP/[Fase]/[Kelas]/[Mapel]`.

---

## Update V45.0: AI Content Repository & Dynamic Models - TERIMPLEMENTASI
Pembaruan besar pada ekosistem AI untuk mendukung pengarsipan dokumen dan fleksibilitas model.

### 1. Repository RPP & Modul
- **Daftar RPP**: Menambahkan menu baru untuk mengelola arsip Modul Ajar yang tersimpan di Google Drive.
- **Deep Sync**: Metadata RPP (Kelas, Mapel, Judul) kini tersimpan di database untuk akses instan tanpa menunggu loading Drive.
- **Unified UI**: Menyelaraskan tampilan menu RPP dengan menu Soal AI menggunakan Hero Section premium.

### 2. Dynamic AI Model Selector
- **User Preference**: Guru kini bisa memilih model AI sendiri di menu Pengaturan.
- **Gemini 2.5 Flash**: Direkomendasikan untuk stabilitas (Anti-Error 503).
- **Gemini 3 Flash Preview**: Untuk guru yang ingin mencoba kecepatan dan nalar terbaru dari Google.

---

## Update V43.0: High-Performance Security Architecture - TERIMPLEMENTASI
Memastikan proteksi user tetap ketat namun dengan kecepatan akses maksimal.

### 1. Dekopling Middleware
- **Middleware** kini hanya menangani autentikasi dasar (login/logout).
- Hasil: Loading aset (CSS/JS/Gambar) menjadi instan karena tidak terhambat kueri database profil.

### 2. Layout-Level Protection
- Logika pengecekan `is_activated` dan `role-based access` dipindahkan ke Server Components di setiap folder root (`/dashboard`, `/admin`, `/monitoring`).
- Keamanan: Pengguna tidak terdaftar atau tidak berwenang tetap terblokir secara permanen dari rute tersebut.

---

## Update V42.0: Performance Optimization & PWA Caching - TERIMPLEMENTASI
Fokus pada pengurangan delay saat membuka dashboard dan efisiensi kuota.

### 1. PWA Runtime Caching
- Implementasi `next-pwa` dengan aturan `runtimeCaching` khusus untuk API Supabase.
- Mempercepat pemuatan data dashboard saat aplikasi dibuka kembali melalui browser/home screen.
