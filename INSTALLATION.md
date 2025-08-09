# Panduan Instalasi dan Penyiapan Lokal

Dokumen ini berisi panduan untuk menginstal semua dependensi yang diperlukan dan menjalankan aplikasi Lakukelas di komputer lokal Anda untuk tujuan pengembangan.

## Daftar Isi
1.  [Prasyarat](#1-prasyarat)
2.  [Instalasi](#2-instalasi)
3.  [Penyiapan Supabase (Lokal)](#3-penyiapan-supabase-lokal)
4.  [Menjalankan Aplikasi](#4-menjalankan-aplikasi)

---

### 1. Prasyarat

Sebelum memulai, pastikan Anda telah menginstal perangkat lunak berikut di sistem Anda:

-   **Node.js**: Versi 18.x atau yang lebih baru. Anda bisa mengunduhnya dari [nodejs.org](https://nodejs.org/).
-   **npm** (Node Package Manager): Biasanya sudah terinstal bersama Node.js.
-   **Git**: Untuk mengkloning repositori.
-   **Docker**: Diperlukan untuk menjalankan Supabase secara lokal. Anda bisa mengunduhnya dari [Docker Desktop](https://www.docker.com/products/docker-desktop/).
-   **Supabase CLI**: Alat bantu baris perintah untuk mengelola proyek Supabase lokal. Instal dengan perintah:
    ```bash
    npm install -g supabase
    ```

---

### 2. Instalasi

Semua dependensi proyek sudah didefinisikan dalam file `package.json`.

1.  **Buka Terminal**: Buka terminal atau command prompt Anda.
2.  **Arahkan ke Direktori Proyek**: Gunakan perintah `cd` untuk menavigasi ke direktori root proyek ini.
3.  **Jalankan Perintah Instalasi**: Jalankan perintah berikut untuk menginstal semua paket yang diperlukan.

    ```bash
    npm install
    ```

Proses ini mungkin memerlukan beberapa menit. Skrip `postinstall` akan berjalan secara otomatis untuk menerapkan patch yang diperlukan.

---

### 3. Penyiapan Supabase (Lokal)

Untuk pengembangan lokal, kita akan menjalankan Supabase di dalam Docker.

1.  **Mulai Supabase**:
    -   Pastikan Docker Desktop sedang berjalan di komputer Anda.
    -   Di direktori root proyek Anda, jalankan perintah berikut untuk memulai layanan Supabase:
        ```bash
        supabase start
        ```
    -   Setelah proses selesai, terminal akan menampilkan kredensial penting, termasuk **Project URL**, **anon key**, dan **service_role key**. Simpan nilai-nilai ini.

2.  **Buat file `.env.local`**:
    -   Di direktori root proyek, buat file baru bernama `.env.local`.
    -   Isi file tersebut dengan URL dan kunci `anon` yang Anda dapatkan dari langkah sebelumnya. **Gunakan `.env.local` untuk kredensial lokal, bukan `.env`**.

    Contoh isi file `.env.local`:
    ```
    NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...
    ```

3.  **Jalankan Skema Database**:
    -   Buka dasbor Supabase lokal Anda (biasanya `http://localhost:54323`).
    -   Navigasi ke **SQL Editor**.
    -   Buka file `schema.sql` dari proyek ini, salin seluruh isinya.
    -   Tempelkan ke editor SQL di Supabase dan klik **"RUN"**.

4.  **Konfigurasi Login Google (Opsional, untuk Uji Coba)**:
    -   Ikuti panduan di `SUPABASE_GOOGLE_AUTH_GUIDE.md` untuk membuat kredensial di Google Cloud Console.
    -   Di dasbor Supabase lokal Anda, navigasi ke **Authentication -> Providers -> Google**.
    -   Masukkan **Client ID** dan **Client Secret** Anda.
    -   Tambahkan **URL Callback** berikut ke "Authorized redirect URIs" di Google Cloud Console:
        ```
        http://localhost:54321/auth/v1/callback
        ```
    -   **Penting**: Pastikan alamat email yang Anda gunakan untuk login Google di-set sebagai "Test User" di Google Cloud Console jika aplikasi OAuth Anda masih dalam mode pengujian.

---

### 4. Menjalankan Aplikasi

#### Menjalankan Server Pengembangan Next.js

Ini adalah server utama untuk antarmuka pengguna aplikasi.

```bash
npm run dev
```

Setelah server berhasil berjalan, Anda akan melihat pesan di terminal:
```
- ready started server on 0.0.0.0:9002, url: http://localhost:9002
```
Buka `http://localhost:9002` di browser Anda untuk melihat aplikasi. Aplikasi akan terhubung ke instance Supabase lokal Anda.
