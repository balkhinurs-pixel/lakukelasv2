# Panduan Instalasi dan Penyiapan Lokal

Dokumen ini berisi panduan untuk menginstal semua dependensi yang diperlukan dan menjalankan aplikasi Lakukelas di komputer lokal Anda untuk tujuan pengembangan.

## Daftar Isi
1.  [Prasyarat](#1-prasyarat)
2.  [Instalasi](#2-instalasi)
3.  [Penyiapan Supabase](#3-penyiapan-supabase)
4.  [Menjalankan Aplikasi](#4-menjalankan-aplikasi)

---

### 1. Prasyarat

Sebelum memulai, pastikan Anda telah menginstal perangkat lunak berikut di sistem Anda:

-   **Node.js**: Versi 18.x atau yang lebih baru. Anda bisa mengunduhnya dari [nodejs.org](https://nodejs.org/).
-   **npm** (Node Package Manager): Biasanya sudah terinstal bersama Node.js.
-   **Akun Supabase**: Anda memerlukan proyek Supabase yang aktif.

---

### 2. Instalasi

Semua dependensi proyek sudah didefinisikan dalam file `package.json`.

Untuk menginstal semua dependensi tersebut, ikuti langkah berikut:

1.  **Buka Terminal**: Buka terminal atau command prompt Anda.
2.  **Arahkan ke Direktori Proyek**: Gunakan perintah `cd` untuk menavigasi ke direktori root tempat Anda menyimpan proyek ini.
3.  **Jalankan Perintah Instalasi**: Jalankan perintah berikut untuk menginstal semua paket yang diperlukan. Perintah ini akan membaca file `package.json` dan mengunduh semua yang dibutuhkan ke dalam folder `node_modules`.

    ```bash
    npm install
    ```

Proses ini mungkin memerlukan beberapa menit tergantung pada kecepatan koneksi internet Anda.

---

### 3. Penyiapan Supabase

Aplikasi ini memerlukan koneksi ke database Supabase untuk berfungsi.

1.  **Buat file `.env`**:
    -   Salin file `.env.example` dan ubah namanya menjadi `.env`.
    -   Isi nilai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dengan kredensial dari proyek Supabase Anda. Anda bisa menemukannya di *Project Settings* > *API* di dasbor Supabase.

    Contoh isi file `.env`:
    ```
    NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxxxxxx.xxxxxxxx
    ```

2.  **Jalankan Skema Database**:
    -   Masuk ke dasbor Supabase Anda.
    -   Navigasi ke **SQL Editor**.
    -   Buka file `schema.sql` dari proyek ini, salin seluruh isinya.
    -   Tempelkan ke editor SQL di Supabase dan klik **"RUN"**. Ini akan membuat semua tabel yang diperlukan.

---

### 4. Menjalankan Aplikasi

#### Menjalankan Server Pengembangan Next.js

Ini adalah server utama untuk antarmuka pengguna aplikasi.

```bash
npm run dev
```

Setelah server berhasil berjalan, Anda akan melihat pesan di terminal, biasanya seperti ini:
```
- ready started server on 0.0.0.0:9002, url: http://localhost:9002
```
Buka `http://localhost:9002` di browser Anda untuk melihat aplikasi.
