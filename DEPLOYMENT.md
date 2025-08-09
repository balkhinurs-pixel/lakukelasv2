# Panduan Deployment ke Vercel dan Supabase

Dokumen ini akan memandu Anda melalui proses deployment aplikasi Next.js ini menggunakan Vercel untuk hosting dan Supabase sebagai backend (database, autentikasi, dll.). Setelah mengikuti langkah-langkah ini, aplikasi Anda akan siap produksi dan berfungsi penuh.

## Daftar Isi
1.  [Prasyarat](#1-prasyarat)
2.  [Langkah 1: Setup Proyek Supabase](#2-langkah-1-setup-proyek-supabase)
3.  [Langkah 2: Setup Tabel Database](#3-langkah-2-setup-tabel-database)
4.  [Langkah 3: Setup Webhook Profil Pengguna (SANGAT PENTING)](#4-langkah-3-setup-webhook-profil-pengguna-sangat-penting)
5.  [Langkah 4: Konfigurasi Autentikasi Supabase](#5-langkah-4-konfigurasi-autentikasi-supabase)
6.  [Langkah 5: Deploy ke Vercel](#6-langkah-5-deploy-ke-vercel)
7.  [Langkah 6: Konfigurasi Environment Variables di Vercel](#7-langkah-6-konfigurasi-environment-variables-di-vercel)
8.  [Aplikasi Anda Siap!](#8-aplikasi-anda-siap)
9.  [Langkah 7: Mengatur Pengguna Admin Pertama](#9-langkah-7-mengatur-pengguna-admin-pertama)

---

### 1. Prasyarat

Sebelum memulai, pastikan Anda memiliki:
- Akun **GitHub** (atau GitLab/Bitbucket).
- Akun **Supabase** ([Daftar di sini](https://supabase.com/dashboard)).
- Akun **Vercel** ([Daftar di sini](https://vercel.com/signup)).

---

### 2. Langkah 1: Setup Proyek Supabase

Supabase akan kita gunakan sebagai database dan untuk autentikasi pengguna.

1.  **Buat Proyek Baru**:
    -   Masuk ke [Dashboard Supabase](https://supabase.com/dashboard).
    -   Klik **"New Project"**.
    -   Isi nama proyek Anda dan buat kata sandi database yang kuat (simpan kata sandi ini di tempat aman).
    -   Pilih region server yang paling dekat dengan target pengguna Anda.
    -   Klik **"Create new project"**. Proses ini mungkin memerlukan beberapa menit.

2.  **Ambil Kunci API**:
    -   Setelah proyek selesai dibuat, buka proyek Anda.
    -   Di menu samping, navigasi ke **Project Settings** (ikon roda gigi) > **API**.
    -   Di halaman ini, Anda akan menemukan dua nilai penting:
        -   **Project URL** (di bawah bagian `Project URL`).
        -   Kunci **`anon` `public`** (di bawah bagian `Project API Keys`).
    -   Salin kedua nilai ini. Kita akan membutuhkannya untuk Vercel nanti. **Jaga kerahasiaan kunci ini**.

---

### 3. Langkah 2: Setup Tabel Database

Kita perlu membuat semua tabel yang dibutuhkan oleh aplikasi di database Supabase.

1.  **Buka SQL Editor**:
    -   Di menu samping dasbor Supabase, klik ikon **SQL Editor** (terlihat seperti `>_`).
    -   Klik **"+ New query"**.

2.  **Jalankan Skrip SQL**:
    -   Buka file `schema.sql` yang ada di direktori root proyek ini.
    -   Salin **seluruh isi** file `schema.sql`.
    -   Tempelkan skrip tersebut ke dalam editor SQL di Supabase.
    -   Klik tombol **"RUN"**.

Ini akan secara otomatis membuat semua tabel yang diperlukan (`profiles`, `classes`, `students`, `activation_codes`, dll.) beserta relasi dan kebijakan keamanan (RLS) yang benar.

---

### 4. Langkah 3: Setup Webhook Profil Pengguna (SANGAT PENTING)

Langkah ini **wajib** dilakukan agar setiap pengguna baru yang mendaftar (baik melalui email atau Google) secara otomatis dibuatkan profilnya di tabel `profiles`. Tanpa ini, pengguna tidak akan bisa login atau menggunakan aplikasi.

1.  **Navigasi ke Database Webhooks**:
    -   Di dasbor Supabase proyek Anda, pergi ke **Database** (ikon silinder) > **Webhooks**.

2.  **Buat Webhook Baru**:
    -   Klik tombol **"Create a new webhook"**.
    -   Isi formulir dengan konfigurasi berikut:
        -   **Name**: Beri nama yang deskriptif, contoh: `Buat Profil Pengguna Baru`.
        -   **Table**: Pilih tabel **`users`** dari skema **`auth`**.
        -   **Events**: Centang hanya **`INSERT`**.
        -   **Type**: Pilih **`HTTP Request`**.
        -   **HTTP Method**: Pilih **`POST`**.
        -   Di bawah **`HTTP Request`**, klik **`Supabase Function`** dan pilih fungsi **`handle_new_user`**.
    -   Klik **"Confirm"** untuk menyimpan webhook.

Setelah ini, sistem sudah siap menangani pendaftaran pengguna baru secara otomatis.

---

### 5. Langkah 4: Konfigurasi Autentikasi Supabase

Langkah ini penting agar email konfirmasi dan tautan lainnya berfungsi dengan benar saat aplikasi sudah di-deploy.

1.  **Navigasi ke Pengaturan Autentikasi**:
    -   Di dasbor Supabase proyek Anda, pergi ke **Authentication** (ikon pengguna) > **Providers**.

2.  **Atur Site URL**:
    -   Scroll ke bawah ke bagian **Site URL**.
    -   Masukkan URL **produksi** aplikasi Anda di Vercel (contoh: `https://nama-aplikasi-anda.vercel.app`). **Jangan biarkan kosong atau berisi localhost**.
    -   Klik **Save**.

3.  **Nonaktifkan Konfirmasi Email (Opsional, untuk Kemudahan Awal)**:
    -   Jika Anda tidak ingin pengguna baru harus mengkonfirmasi email mereka, Anda bisa menonaktifkan fitur ini.
    -   Di menu **Authentication** > **Providers**, scroll ke atas ke bagian **Email**.
    -   Matikan sakelar (toggle) **"Confirm email"**.

---

### 6. Langkah 5: Deploy ke Vercel

Vercel akan kita gunakan untuk hosting aplikasi Next.js Anda.

1.  **Push Kode ke GitHub**:
    -   Pastikan proyek ini sudah ada di repositori GitHub Anda.

2.  **Impor Proyek ke Vercel**:
    -   Masuk ke [Dashboard Vercel](https://vercel.com/dashboard).
    -   Klik **"Add New..."** > **"Project"**.
    -   Pilih repositori GitHub yang berisi aplikasi Lakukelas Anda, lalu klik **"Import"**.
    -   Vercel akan otomatis mendeteksi bahwa ini adalah proyek Next.js. Anda bisa membiarkan semua pengaturan build dan instalasi tetap default.

3.  **Konfigurasi Environment Variables**:
    -   Sebelum menekan tombol "Deploy", buka bagian **"Environment Variables"**.
    -   Di sini, kita akan menambahkan kunci API yang telah kita dapatkan dari Supabase pada Langkah 1. Lihat langkah berikutnya untuk detailnya.

---

### 7. Langkah 6: Konfigurasi Environment Variables di Vercel

Variabel ini penting agar aplikasi Anda yang di-hosting di Vercel bisa terhubung ke database Supabase.

-   Di pengaturan Environment Variables proyek Vercel Anda, tambahkan variabel berikut satu per satu:

| Nama Variabel                  | Nilai                                     | Deskripsi                                 |
| ------------------------------ | ----------------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`     | `URL proyek Supabase Anda`                | Salin dari pengaturan API Supabase.       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| `Kunci anon public Supabase Anda`         | Salin dari pengaturan API Supabase.       |

-   Pastikan nama variabelnya sama persis.
-   Setelah semua variabel ditambahkan, klik tombol **"Deploy"**.

Vercel akan mulai membangun dan men-deploy aplikasi Anda. Proses ini mungkin memakan waktu beberapa menit.

---

### 8. Aplikasi Anda Siap!

Setelah proses deployment selesai, Vercel akan memberikan Anda URL publik (contoh: `lakukelas-anda.vercel.app`). Buka URL tersebut untuk mengakses aplikasi Anda yang sudah berfungsi penuh.

Anda sekarang dapat mendaftar sebagai pengguna baru dan mulai menggunakan semua fitur aplikasi.

---

### 9. Langkah 7: Mengatur Pengguna Admin Pertama

Aplikasi ini memiliki panel admin terpisah untuk mengelola pengguna dan kode aktivasi. Untuk mengaksesnya, Anda perlu mengatur satu pengguna sebagai 'admin' secara manual.

1.  **Daftar Akun Baru**:
    -   Buka aplikasi Anda yang sudah di-deploy.
    -   Daftarkan akun baru menggunakan email yang ingin Anda jadikan admin. Selesaikan proses verifikasi email jika diperlukan.

2.  **Buka Tabel `profiles` di Supabase**:
    -   Kembali ke dasbor proyek Supabase Anda.
    -   Di menu samping, klik ikon **Table Editor** (terlihat seperti tabel).
    -   Pilih tabel **`profiles`**.

3.  **Ubah Role Pengguna**:
    -   Cari baris yang sesuai dengan pengguna yang baru saja Anda daftarkan (Anda bisa mencarinya berdasarkan email).
    -   Klik dua kali pada sel di kolom **`role`**.
    -   Ubah nilainya dari `teacher` menjadi `admin`.
    -   Klik tombol **Save** di pojok kanan atas.

4.  **Akses Panel Admin**:
    -   Sekarang, logout dari aplikasi jika Anda sedang login.
    -   Login kembali menggunakan akun yang baru saja Anda atur sebagai admin.
    -   Setelah login, Anda akan berada di dasbor guru. Di menu navigasi samping, akan ada tautan untuk beralih ke panel admin, atau Anda bisa mengaksesnya langsung dengan menambahkan `/admin` ke URL (contoh: `https://lakukelas-anda.vercel.app/admin`).

    