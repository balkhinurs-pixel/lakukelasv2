# Panduan Instalasi dan Penyiapan Lokal

Dokumen ini berisi panduan untuk menginstal semua dependensi yang diperlukan dan menjalankan aplikasi Lakukelas di komputer lokal Anda untuk tujuan pengembangan.

## Daftar Isi
1.  [Prasyarat](#1-prasyarat)
2.  [Instalasi](#2-instalasi)
3.  [Menjalankan Aplikasi](#3-menjalankan-aplikasi)
4.  [Konfigurasi Tambahan](#4-konfigurasi-tambahan)

---

### 1. Prasyarat

Sebelum memulai, pastikan Anda telah menginstal perangkat lunak berikut di sistem Anda:

-   **Node.js**: Versi 18.x atau yang lebih baru. Anda bisa mengunduhnya dari [nodejs.org](https://nodejs.org/).
-   **npm** (Node Package Manager): Biasanya sudah terinstal bersama Node.js.

---

### 2. Instalasi

Semua dependensi proyek, baik untuk frontend (Next.js, React) maupun backend (Genkit), sudah didefinisikan dalam file `package.json`.

Untuk menginstal semua dependensi tersebut, ikuti langkah berikut:

1.  **Buka Terminal**: Buka terminal atau command prompt Anda.
2.  **Arahkan ke Direktori Proyek**: Gunakan perintah `cd` untuk menavigasi ke direktori root tempat Anda menyimpan proyek ini.
3.  **Jalankan Perintah Instalasi**: Jalankan perintah berikut untuk menginstal semua paket yang diperlukan. Perintah ini akan membaca file `package.json` dan mengunduh semua yang dibutuhkan ke dalam folder `node_modules`.

    ```bash
    npm install
    ```

Proses ini mungkin memerlukan beberapa menit tergantung pada kecepatan koneksi internet Anda.

---

### 3. Menjalankan Aplikasi

Aplikasi ini terdiri dari dua bagian utama yang bisa dijalankan secara terpisah:
-   Aplikasi Next.js (antarmuka pengguna utama).
-   Server Genkit (untuk fitur AI seperti pembayaran).

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

#### Menjalankan Server Genkit (Opsional)

Server ini diperlukan jika Anda ingin menguji fungsionalitas yang terkait dengan AI, seperti alur pembayaran.

Buka terminal **baru** (biarkan terminal Next.js tetap berjalan) dan jalankan:

```bash
npm run genkit:dev
```

Server Genkit akan berjalan dan siap menerima panggilan dari aplikasi Next.js.

---

### 4. Konfigurasi Tambahan

Untuk fitur tertentu seperti pembayaran dengan Duitku, Anda perlu mengatur *environment variables*.

1.  Buat file baru bernama `.env` di direktori root proyek.
2.  Salin isi dari file `DEPLOYMENT.md` bagian "Konfigurasi Environment Variables" ke dalam file `.env` Anda.
3.  Isi nilainya sesuai dengan kunci API yang Anda miliki dari layanan terkait.

Contoh isi file `.env`:
```
DUITKU_MERCHANT_CODE=KODE_MERCHANT_ANDA
DUITKU_API_KEY=KUNCI_API_ANDA
NEXT_PUBLIC_APP_URL=http://localhost:9002
```
